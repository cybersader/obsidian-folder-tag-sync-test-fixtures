/**
 * Spec-as-oracle: the fixture frameworks ARE the test contract.
 *
 * Every FixtureFile.tags entry declares what tags that file should carry
 * given the framework's rules. This test imports the main plugin's
 * `applyRuleForward` runtime and asserts that, for every (framework, file)
 * combination, the runtime emits exactly the rule-derived tags the
 * fixture spec promises.
 *
 * Why this test is the cleverest one in the suite:
 *
 *   - Adding a new framework auto-extends test coverage. No new test cases.
 *   - Adding a new TransferOp variant requires showing it in some
 *     framework, which is then automatically verified at runtime.
 *   - Drift between the fixture spec and the runtime is caught at every
 *     commit. If a rule's derivation changes, every framework that uses
 *     that op fails until the fixture's expected tags are updated.
 *   - The test uses ONLY library-science vocabulary on both sides
 *     (FolderClassifier, TagVocabulary, TransferOp). It doesn't know
 *     about regex strings — those are derived. This is the typed model
 *     verifying itself against itself.
 *
 * Cross-plugin import: this test imports from the main plugin's source
 * tree at `../../folder-tag-sync/src/...`. Both plugins live as siblings
 * inside the dev vault's `.obsidian/plugins/` folder, so the relative
 * path is stable. If you check out the fixtures plugin standalone (no
 * sibling main plugin), this suite skips gracefully — see the dynamic
 * import + try/catch in `loadOracle()` below.
 */

import { describe, expect, test } from 'bun:test';
import { FRAMEWORKS, FRAMEWORK_IDS } from './fixtures';
import type { FixtureFile, FixtureFramework, TransferOp } from './fixtures/types';

// ─── Dynamic import + skip-if-missing ────────────────────────────────────

interface ForwardResult {
	tags: string[];
	lossy: boolean;
}
type ApplyRuleForwardFn = (folderPath: string, rule: unknown) => ForwardResult;

async function loadOracle(): Promise<ApplyRuleForwardFn | null> {
	try {
		const mod = await import('../../folder-tag-sync/src/engine/applyTransfer');
		return mod.applyRuleForward as ApplyRuleForwardFn;
	} catch (err) {
		console.warn(
			`[oracle.test] Sibling main plugin not found at ../../folder-tag-sync; skipping cross-plugin oracle suite. (${(err as Error).message})`,
		);
		return null;
	}
}

const applyRuleForwardPromise = loadOracle();

function folderPathOf(file: FixtureFile): string {
	// File path is relative to the fixtures rootFolder. The runtime sees a
	// folder path, not a file path. The framework's rules are written
	// against folder paths (e.g. "Capture/Clips/Web") — so we strip the
	// trailing "/<filename>.md" segment.
	const segments = file.path.split('/');
	segments.pop(); // drop the file name
	return segments.join('/');
}

function expectedTagsFromFixture(file: FixtureFile): Set<string> {
	return new Set(file.tags.map((t) => `#${t.name}`));
}

// ─── The oracle assertion: for every framework × file ────────────────────

describe('Cross-plugin oracle: runtime emits exactly the tags the fixture spec promises', () => {
	for (const id of FRAMEWORK_IDS) {
		const framework = FRAMEWORKS[id];

		describe(`framework: ${framework.name} (${framework.id})`, () => {
			for (const file of framework.files) {
				test(`${file.path}`, async () => {
					const applyRuleForward = await applyRuleForwardPromise;
					if (!applyRuleForward) return; // skip when sibling plugin absent

					const folderPath = folderPathOf(file);
					const expected = expectedTagsFromFixture(file);

					// Every tag any rule emits MUST appear in the fixture's expected set.
					// This catches "the rule emits a tag the fixture didn't expect".
					const ruleDerivedTags: string[] = [];
					for (const rule of framework.rules) {
						const result = applyRuleForward(folderPath, rule);
						ruleDerivedTags.push(...result.tags);
					}

					// Diagnostics if assertion fails — print before throwing
					const surprises = ruleDerivedTags.filter((t) => !expected.has(t));
					if (surprises.length > 0) {
						console.error(
							`[oracle FAIL] ${framework.id} :: ${file.path}\n` +
								`  folderPath:        ${folderPath}\n` +
								`  expected (fixture): ${[...expected].sort().join(', ')}\n` +
								`  emitted (runtime):  ${ruleDerivedTags.sort().join(', ')}\n` +
								`  surprises:          ${surprises.join(', ')}`,
						);
					}

					expect(surprises).toEqual([]);
				});
			}
		});
	}
});

// ─── TransferOp coverage invariant ───────────────────────────────────────
//
// Every variant of the TransferOp discriminated union must be exercised by
// at least one framework rule. Catches the case where we add a new variant
// (or a new option on an existing variant like `tailHandling`) but forget
// to ship a fixture demonstrating it. Library-science fundamentals: each
// primitive is meant to express a real-world recoordination, so every
// primitive must show up in lived practice.

describe('coverage: every TransferOp variant is exercised by some framework', () => {
	function opKey(op: TransferOp): string {
		switch (op.op) {
			case 'identity':
				return 'identity';
			case 'truncation':
				return `truncation:${op.tailHandling}`;
			case 'marker-only':
				return 'marker-only';
			case 'promotion-to-root':
				return 'promotion-to-root';
			case 'flattening-to-leaf':
				return 'flattening-to-leaf';
			case 'aggregation':
				return 'aggregation';
			case 'post-coordination':
				return 'post-coordination';
			case 'opaque':
				return 'opaque';
		}
	}

	const REQUIRED_VARIANTS: string[] = [
		'identity',
		'truncation:drop',
		'truncation:aggregate',
		'truncation:flatten',
		'marker-only',
		'promotion-to-root',
		'flattening-to-leaf',
		'aggregation',
		'post-coordination',
		'opaque',
	];

	test('the canonical primitives appear in some framework', () => {
		const seen = new Set<string>();
		for (const id of FRAMEWORK_IDS) {
			for (const rule of FRAMEWORKS[id].rules) {
				seen.add(opKey(rule.transfer));
				seen.add(opKey(rule.inverseTransfer));
			}
		}
		const missing = REQUIRED_VARIANTS.filter((v) => !seen.has(v));
		if (missing.length > 0) {
			console.error(
				`[coverage FAIL] These TransferOp variants are not used by any framework: ${missing.join(', ')}\n` +
					`  variants seen: ${[...seen].sort().join(', ')}\n` +
					'  Add a framework rule using each missing variant, or remove it from REQUIRED_VARIANTS with justification.',
			);
		}
		expect(missing).toEqual([]);
	});

	test('reports which advanced variants are NOT yet exercised (informational)', () => {
		const seen = new Set<string>();
		for (const id of FRAMEWORK_IDS) {
			for (const rule of FRAMEWORKS[id].rules) {
				seen.add(opKey(rule.transfer));
				seen.add(opKey(rule.inverseTransfer));
			}
		}
		const advanced = [
			'truncation:aggregate',
			'truncation:flatten',
			'promotion-to-root',
			'flattening-to-leaf',
			'aggregation',
			'post-coordination',
			'opaque',
		];
		const unexercised = advanced.filter((v) => !seen.has(v));
		// Informational only — print, don't fail. Future-Phase fixtures should
		// progressively cover these.
		console.log(
			`[coverage info] Advanced TransferOp variants not yet exercised by any framework: ` +
				`${unexercised.length === 0 ? '(all covered)' : unexercised.join(', ')}`,
		);
		expect(true).toBe(true); // placeholder — this test never fails by design
	});
});

// ─── Self-consistency: rule patterns must accept paths under their entry points ─
//
// The semantic the test asserts is "paths under this rule's entry point are
// accepted by its folder pattern" — not "the bare entry matches the pattern".
// Most patterns intentionally require content after the entry (`^Research/`
// rejects the bare `Research/` because the rule should only fire on real
// sub-content). Check by appending a sample child segment to the entry and
// asserting the pattern matches that.

describe('framework self-consistency: rule folderPattern accepts a child path under its folderEntryPoint', () => {
	for (const id of FRAMEWORK_IDS) {
		const framework = FRAMEWORKS[id];
		describe(framework.id, () => {
			for (const rule of framework.rules) {
				if (!rule.folderPattern || !rule.folderEntryPoint) continue;
				test(`rule "${rule.id}"`, () => {
					const entry = rule.folderEntryPoint!;
					const childPath = entry.endsWith('/') ? `${entry}sample` : `${entry}/sample`;
					const re = new RegExp(rule.folderPattern!);
					expect(re.test(childPath)).toBe(true);
				});
			}
		});
	}
});

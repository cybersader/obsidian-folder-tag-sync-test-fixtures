import { describe, expect, test } from 'bun:test';
import { FRAMEWORKS, FRAMEWORK_IDS } from './fixtures';
import type {
  Axis,
  FixtureFramework,
  FolderClassifier,
  HierarchyTransferRule,
  TagVocabulary,
} from './fixtures/types';
import { ALL_AXES } from './fixtures/types';
import { diffFixtures } from './sync';

// ─── Registry sanity ──────────────────────────────────────────────────────

describe('registry', () => {
  test('FRAMEWORK_IDS matches Object.keys(FRAMEWORKS) order-independently', () => {
    expect(new Set(FRAMEWORK_IDS)).toEqual(new Set(Object.keys(FRAMEWORKS)));
  });

  test('every framework self-reports its own id', () => {
    for (const id of FRAMEWORK_IDS) {
      expect(FRAMEWORKS[id].id).toBe(id);
    }
  });
});

// ─── Shape (per framework) ───────────────────────────────────────────────

describe.each(FRAMEWORK_IDS)('shape: %s', (id) => {
  const framework = FRAMEWORKS[id];

  test('has name + description + non-empty axesExercised', () => {
    expect(framework.name).toBeTruthy();
    expect(framework.description).toBeTruthy();
    expect(framework.axesExercised.length).toBeGreaterThan(0);
    for (const axis of framework.axesExercised) {
      expect(ALL_AXES).toContain(axis);
    }
  });

  test('has at least one fixture file', () => {
    expect(framework.files.length).toBeGreaterThan(0);
  });

  test('has at least one rule', () => {
    expect(framework.rules.length).toBeGreaterThan(0);
  });

  test('every file path is relative + ends in .md', () => {
    for (const f of framework.files) {
      expect(typeof f.path).toBe('string');
      expect(f.path.length).toBeGreaterThan(0);
      expect(f.path.startsWith('/')).toBe(false);
      expect(f.path.endsWith('.md')).toBe(true);
    }
  });

  test('every tag name is non-empty and has no leading #', () => {
    for (const f of framework.files) {
      for (const t of f.tags) {
        expect(t.name.length).toBeGreaterThan(0);
        expect(t.name.startsWith('#')).toBe(false);
      }
    }
  });
});

// ─── Axis closure ────────────────────────────────────────────────────────

describe.each(FRAMEWORK_IDS)('axis-closure: %s', (id) => {
  const framework = FRAMEWORKS[id];
  const declared = new Set<Axis>(framework.axesExercised);

  test('every FolderClassifier axis is in axesExercised', () => {
    for (const f of framework.files) {
      for (const axis of f.folder.axes) {
        expect(declared.has(axis)).toBe(true);
      }
    }
  });

  test('every tag vocab axis is in axesExercised', () => {
    for (const f of framework.files) {
      for (const t of f.tags) {
        expect(declared.has(t.vocab.axis)).toBe(true);
      }
    }
  });

  test('every rule\'s folder & tag axes are in axesExercised', () => {
    for (const r of framework.rules) {
      for (const axis of r.folder.axes) expect(declared.has(axis)).toBe(true);
      expect(declared.has(r.tag.axis)).toBe(true);
    }
  });

  test('literal warrant: every declared axis is expressed by some file OR rule', () => {
    const expressed = new Set<Axis>();
    for (const f of framework.files) {
      for (const a of f.folder.axes) expressed.add(a);
      for (const t of f.tags) expressed.add(t.vocab.axis);
    }
    for (const r of framework.rules) {
      for (const a of r.folder.axes) expressed.add(a);
      expressed.add(r.tag.axis);
    }
    for (const declaredAxis of declared) {
      expect(expressed.has(declaredAxis)).toBe(true);
    }
  });
});

// ─── Rule invariants ─────────────────────────────────────────────────────

describe.each(FRAMEWORK_IDS)('rule invariants: %s', (id) => {
  const framework = FRAMEWORKS[id];

  test('rule ids are unique', () => {
    const ids = framework.rules.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('priorities are unique within a framework', () => {
    const ps = framework.rules.map((r) => r.priority);
    expect(new Set(ps).size).toBe(ps.length);
  });

  test('folderPattern + tagPattern compile as regex when present', () => {
    for (const r of framework.rules) {
      if (r.folderPattern) expect(() => new RegExp(r.folderPattern!)).not.toThrow();
      if (r.tagPattern) expect(() => new RegExp(r.tagPattern!)).not.toThrow();
    }
  });

  test('marker-only rules have cardinality many:1 and bijective=false', () => {
    for (const r of framework.rules) {
      if (r.transfer.op === 'marker-only') {
        expect(r.cardinality).toBe('many:1');
        expect(r.bijective).toBe(false);
      }
    }
  });

  test('identity-bidirectional rules have identity inverseTransfer', () => {
    for (const r of framework.rules) {
      if (r.transfer.op === 'identity' && r.direction === 'bidirectional') {
        expect(r.inverseTransfer.op).toBe('identity');
      }
    }
  });

  test('truncation rules have matching depth in both directions when bidirectional', () => {
    for (const r of framework.rules) {
      if (r.transfer.op === 'truncation' && r.direction === 'bidirectional' && r.inverseTransfer.op === 'truncation') {
        expect(r.inverseTransfer.depth).toBe(r.transfer.depth);
      }
    }
  });
});

// ─── Path uniqueness WITHIN each framework ───────────────────────────────
// (Cross-framework overlap is fine — sync is whole-root sweep, one framework
// lives on disk at a time. SEACOW-JD and SEACOW-Cybersader intentionally
// share Entity/Cybersader paths.)

describe.each(FRAMEWORK_IDS)('path uniqueness within %s', (id) => {
  const framework = FRAMEWORKS[id];
  test('no two files in this framework share a path', () => {
    const paths = framework.files.map((f) => f.path);
    expect(new Set(paths).size).toBe(paths.length);
  });
});

// ─── Diff unit tests ─────────────────────────────────────────────────────

describe('diffFixtures()', () => {
  test('empty expected + empty actual → empty diff', () => {
    const r = diffFixtures({ expected: new Map(), actual: new Map() });
    expect(r.toWrite).toEqual([]);
    expect(r.toSkip).toEqual([]);
    expect(r.toRemove).toEqual([]);
  });

  test('new file (not on disk) → create', () => {
    const r = diffFixtures({
      expected: new Map([['a.md', 'hello']]),
      actual: new Map(),
    });
    expect(r.toWrite).toEqual([{ path: 'a.md', content: 'hello', kind: 'create' }]);
    expect(r.toSkip).toEqual([]);
    expect(r.toRemove).toEqual([]);
  });

  test('identical content → skip', () => {
    const r = diffFixtures({
      expected: new Map([['a.md', 'hello']]),
      actual: new Map([['a.md', 'hello']]),
    });
    expect(r.toWrite).toEqual([]);
    expect(r.toSkip).toEqual(['a.md']);
  });

  test('different content → update', () => {
    const r = diffFixtures({
      expected: new Map([['a.md', 'hello NEW']]),
      actual: new Map([['a.md', 'hello OLD']]),
    });
    expect(r.toWrite).toEqual([{ path: 'a.md', content: 'hello NEW', kind: 'update' }]);
    expect(r.toSkip).toEqual([]);
    expect(r.toRemove).toEqual([]);
  });

  test('extra on disk → remove', () => {
    const r = diffFixtures({
      expected: new Map(),
      actual: new Map([['orphan.md', 'stale']]),
    });
    expect(r.toWrite).toEqual([]);
    expect(r.toRemove).toEqual(['orphan.md']);
  });

  test('mixed: create + update + skip + remove in one pass', () => {
    const expected = new Map([
      ['new.md', 'new content'],
      ['updated.md', 'new content'],
      ['same.md', 'unchanged'],
    ]);
    const actual = new Map([
      ['updated.md', 'old content'],
      ['same.md', 'unchanged'],
      ['orphan.md', 'stale'],
    ]);
    const r = diffFixtures({ expected, actual });
    expect(r.toWrite.map((w) => ({ path: w.path, kind: w.kind }))).toEqual([
      { path: 'new.md', kind: 'create' },
      { path: 'updated.md', kind: 'update' },
    ]);
    expect(r.toSkip).toEqual(['same.md']);
    expect(r.toRemove).toEqual(['orphan.md']);
  });

  test('diff result ordering is stable (sorted by path)', () => {
    const r = diffFixtures({
      expected: new Map([
        ['z.md', 'z'],
        ['a.md', 'a'],
        ['m.md', 'm'],
      ]),
      actual: new Map(),
    });
    expect(r.toWrite.map((w) => w.path)).toEqual(['a.md', 'm.md', 'z.md']);
  });
});

// ─── Sanity helpers validate a few specific frameworks ──────────────────

describe('PARA specifics', () => {
  const para = FRAMEWORKS.para;

  test('has exactly 4 rules (one per bucket)', () => {
    expect(para.rules.length).toBe(4);
  });

  test('all rules are identity + bidirectional + 1:1', () => {
    for (const r of para.rules) {
      expect(r.transfer.op).toBe('identity');
      expect(r.direction).toBe('bidirectional');
      expect(r.cardinality).toBe('1:1');
      expect(r.bijective).toBe(true);
    }
  });
});

describe('SEACOW-JD specifics', () => {
  const seacow = FRAMEWORKS['seacow-jd'];

  test('has exactly 6 rules matching seacow-cyberbase.json priorities', () => {
    expect(seacow.rules.length).toBe(6);
  });

  test('exercises at least 3 distinct transfer op kinds', () => {
    const ops = new Set(seacow.rules.map((r) => r.transfer.op));
    expect(ops.size).toBeGreaterThanOrEqual(3);
  });

  test('capture-clip is truncation depth=2', () => {
    const rule = seacow.rules.find((r) => r.id === 'seacow-capture-clip');
    expect(rule).toBeDefined();
    expect(rule!.transfer.op).toBe('truncation');
    if (rule!.transfer.op === 'truncation') {
      expect(rule!.transfer.depth).toBe(2);
    }
  });

  test('inbox is marker-only + many:1 + non-bijective', () => {
    const rule = seacow.rules.find((r) => r.id === 'seacow-capture-inbox');
    expect(rule).toBeDefined();
    expect(rule!.transfer.op).toBe('marker-only');
    expect(rule!.cardinality).toBe('many:1');
    expect(rule!.bijective).toBe(false);
  });
});

describe('SEACOW-Cybersader specifics', () => {
  const sc = FRAMEWORKS['seacow-cybersader'];

  test('has two entity rules (demonstrates rule-explosion before wildcards)', () => {
    const entityRules = sc.rules.filter((r) => r.folder.scheme === 'authority-root');
    expect(entityRules.length).toBe(2);
  });

  test('contains poly-demo fixture with multiple relation tags', () => {
    const poly = sc.files.find((f) => f.path.endsWith('poly-demo.md'));
    expect(poly).toBeDefined();
    const relationTags = poly!.tags.filter((t) => t.vocab.axis === 'relation');
    expect(relationTags.length).toBeGreaterThanOrEqual(2);
  });
});

/**
 * Pure fixture diff.
 *
 * Given the expected content for a set of paths and the actual content on
 * disk (also by path), returns the write/skip/remove plan. Pure — no
 * Obsidian imports, no side effects — so it's directly unit-testable.
 *
 * "Write" includes both creates (path not in actual) and updates (path in
 * actual but content differs). "Skip" means the file exists and matches.
 * "Remove" means the file is under the sweep root but not in the expected
 * set; the caller decides whether to actually delete.
 */

export interface DiffInput {
  /** path → expected full file content (frontmatter + body) */
  expected: Map<string, string>;
  /** path → actual full file content currently on disk under the sweep root */
  actual: Map<string, string>;
}

export interface DiffResult {
  /** Paths to write (content included). Covers both creates and updates. */
  toWrite: Array<{ path: string; content: string; kind: 'create' | 'update' }>;
  /** Paths present in both with identical content — nothing to do. */
  toSkip: string[];
  /** Paths present on disk but not expected — candidates for deletion. */
  toRemove: string[];
}

/**
 * Compute the three-way diff. Stable ordering (sorted by path).
 */
export function diffFixtures(input: DiffInput): DiffResult {
  const toWrite: DiffResult['toWrite'] = [];
  const toSkip: string[] = [];
  const toRemove: string[] = [];

  const expectedPaths = [...input.expected.keys()].sort();
  for (const path of expectedPaths) {
    const expectedContent = input.expected.get(path)!;
    const actualContent = input.actual.get(path);
    if (actualContent === undefined) {
      toWrite.push({ path, content: expectedContent, kind: 'create' });
    } else if (actualContent === expectedContent) {
      toSkip.push(path);
    } else {
      toWrite.push({ path, content: expectedContent, kind: 'update' });
    }
  }

  const actualPaths = [...input.actual.keys()].sort();
  for (const path of actualPaths) {
    if (!input.expected.has(path)) {
      toRemove.push(path);
    }
  }

  return { toWrite, toSkip, toRemove };
}

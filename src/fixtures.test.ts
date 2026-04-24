import { describe, expect, test } from 'bun:test';
import { PARA_FILES, POLY_FILES, EDGE_FILES, PRESET_RULES } from './fixtures';

describe('fixture file shape', () => {
  for (const [label, set] of Object.entries({
    PARA: PARA_FILES,
    POLY: POLY_FILES,
    EDGE: EDGE_FILES,
  })) {
    describe(label, () => {
      test('has at least one entry', () => {
        expect(set.length).toBeGreaterThan(0);
      });

      test('every path is a non-empty relative string (no absolute roots)', () => {
        for (const f of set) {
          expect(typeof f.path).toBe('string');
          expect(f.path.length).toBeGreaterThan(0);
          expect(f.path.startsWith('/')).toBe(false);
          expect(f.path).not.toMatch(/^[A-Z]:\\/);
        }
      });

      test('every path ends in .md', () => {
        for (const f of set) {
          expect(f.path.endsWith('.md')).toBe(true);
        }
      });

      test('tags are tag paths (no leading #)', () => {
        for (const f of set) {
          expect(Array.isArray(f.tags)).toBe(true);
          for (const t of f.tags) {
            expect(typeof t).toBe('string');
            expect(t.startsWith('#')).toBe(false);
            expect(t.length).toBeGreaterThan(0);
          }
        }
      });
    });
  }
});

describe('POLY_FILES — polyhierarchy contract', () => {
  test('every poly file has at least 3 tags (one per preset rule)', () => {
    for (const f of POLY_FILES) {
      expect(f.tags.length).toBeGreaterThanOrEqual(3);
    }
  });

  test('poly tag namespaces cover projects/, time/, topics/', () => {
    const namespaces = new Set<string>();
    for (const f of POLY_FILES) {
      for (const t of f.tags) {
        const ns = t.split('/')[0];
        namespaces.add(ns);
      }
    }
    expect(namespaces.has('projects')).toBe(true);
    expect(namespaces.has('time')).toBe(true);
    expect(namespaces.has('topics')).toBe(true);
  });
});

describe('PRESET_RULES — canonical rule set', () => {
  const { rules } = PRESET_RULES;

  test('has exactly 3 rules (projects/time/topics)', () => {
    expect(rules.length).toBe(3);
  });

  test('priorities are unique and ordered', () => {
    const priorities = rules.map((r) => r.priority);
    const sorted = [...priorities].sort((a, b) => a - b);
    expect(priorities).toEqual(sorted);
    expect(new Set(priorities).size).toBe(priorities.length);
  });

  test('every rule has required fields', () => {
    for (const r of rules) {
      expect(r.id).toBeTruthy();
      expect(r.name).toBeTruthy();
      expect(typeof r.enabled).toBe('boolean');
      expect(typeof r.priority).toBe('number');
      expect(['folder-to-tag', 'tag-to-folder', 'bidirectional']).toContain(r.direction);
      expect(r.folderPattern).toBeTruthy();
      expect(r.tagPattern).toBeTruthy();
      expect(r.folderEntryPoint).toBeTruthy();
      expect(r.tagEntryPoint).toBeTruthy();
    }
  });

  test('folder/tag patterns are valid regexes', () => {
    for (const r of rules) {
      expect(() => new RegExp(r.folderPattern)).not.toThrow();
      expect(() => new RegExp(r.tagPattern)).not.toThrow();
    }
  });

  test('each rule has distinct folder root (priority actually decides folder placement)', () => {
    // The whole point of the priority demo is that each rule would place
    // the file in a DIFFERENT folder if it won. So folderEntryPoints must differ.
    const roots = rules.map((r) => r.folderEntryPoint);
    expect(new Set(roots).size).toBe(roots.length);
  });

  test('rules are bidirectional by default', () => {
    for (const r of rules) {
      expect(r.direction).toBe('bidirectional');
    }
  });
});

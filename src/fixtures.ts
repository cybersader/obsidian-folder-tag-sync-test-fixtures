/**
 * Pure fixture data — no Obsidian runtime imports so this module is easy
 * to unit-test and reason about independently of the plugin shell.
 *
 * Every fixture file has:
 *   - path   : relative to the fixtures root folder (e.g. "fixtures/")
 *   - tags   : array of tag strings (no leading '#')
 */

export interface FixtureFile {
  path: string;
  tags: string[];
}

export interface PresetRule {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  direction: 'bidirectional' | 'folder-to-tag' | 'tag-to-folder';
  folderPattern: string;
  tagPattern: string;
  folderEntryPoint: string;
  tagEntryPoint: string;
  folderTransforms: { caseTransform?: 'Title Case' | 'snake_case' | 'kebab-case' | 'camelCase' | 'PascalCase' | 'none'; stripEmoji?: boolean };
  tagTransforms:    { caseTransform?: 'Title Case' | 'snake_case' | 'kebab-case' | 'camelCase' | 'PascalCase' | 'none'; stripEmoji?: boolean };
}

/** PARA structure — canonical 4-bucket organizational system. */
export const PARA_FILES: FixtureFile[] = [
  { path: 'Projects/Q4-Roadmap/kickoff.md',  tags: ['projects/q4_roadmap'] },
  { path: 'Projects/Q4-Roadmap/brief.md',    tags: ['projects/q4_roadmap'] },
  { path: 'Projects/Q4-Roadmap/notes.md',    tags: ['projects/q4_roadmap'] },
  { path: 'Projects/Launch/plan.md',         tags: ['projects/launch'] },
  { path: 'Projects/Research/summary.md',    tags: ['projects/research'] },
  { path: 'Areas/Health/labs.md',            tags: ['areas/health'] },
  { path: 'Areas/Finance/budget.md',         tags: ['areas/finance'] },
  { path: 'Resources/Tools/obsidian-tips.md',tags: ['resources/tools'] },
  { path: 'Resources/Books/reading-list.md', tags: ['resources/books'] },
  { path: 'Archive/2023/old-project.md',     tags: ['archive/2023'] },
];

/**
 * Polyhierarchy set — files tagged under multiple rule hierarchies so the
 * same file matches all three preset rules. Exercises priority-based
 * conflict resolution in the main plugin.
 */
export const POLY_FILES: FixtureFile[] = [
  {
    path: 'Projects/Q4-Roadmap/kickoff.md',
    tags: ['projects/q4_roadmap', 'time/2024/q4/roadmap', 'topics/roadmaps/q4'],
  },
  {
    path: 'Projects/Q4-Roadmap/brief.md',
    tags: ['projects/q4_roadmap', 'time/2024/q4/roadmap', 'topics/roadmaps/q4'],
  },
];

/** Edge-case set — emojis, number prefixes, special chars, deep nesting. */
export const EDGE_FILES: FixtureFile[] = [
  { path: '📁 01 - Inbox/quick-capture.md',                  tags: ['inbox'] },
  { path: '98 - Archive/Old Notes (2019)/ancient.md',        tags: ['archive/2019'] },
  { path: 'Projects/Client — Acme Inc./weekly sync.md',      tags: ['projects/acme'] },
  { path: 'deeply/nested/folder/tree/very/far/down/leaf.md', tags: ['deep'] },
  { path: 'Mixed Case Folder/SNAKE_CASE_FILE.md',            tags: ['test/case'] },
];

/**
 * Canonical preset rules: three priority-ordered rules that map to three
 * different filesystem roots (Projects/, Time/, Topics/). Priority 10 wins
 * folder placement; the other rules still tag the file (polyhierarchy).
 */
export const PRESET_RULES: { rules: PresetRule[] } = {
  rules: [
    {
      id: 'rule-projects',
      name: 'Projects → #projects',
      enabled: true,
      priority: 10,
      direction: 'bidirectional',
      folderPattern: '^Projects/(.*)$',
      tagPattern: '^projects/(.*)$',
      folderEntryPoint: 'Projects/',
      tagEntryPoint: 'projects/',
      folderTransforms: { caseTransform: 'Title Case' },
      tagTransforms: { caseTransform: 'snake_case', stripEmoji: true },
    },
    {
      id: 'rule-time',
      name: 'Time → #time',
      enabled: true,
      priority: 20,
      direction: 'bidirectional',
      folderPattern: '^Time/(.*)$',
      tagPattern: '^time/(.*)$',
      folderEntryPoint: 'Time/',
      tagEntryPoint: 'time/',
      folderTransforms: { caseTransform: 'none' },
      tagTransforms: { caseTransform: 'snake_case' },
    },
    {
      id: 'rule-topics',
      name: 'Topics → #topics',
      enabled: true,
      priority: 30,
      direction: 'bidirectional',
      folderPattern: '^Topics/(.*)$',
      tagPattern: '^topics/(.*)$',
      folderEntryPoint: 'Topics/',
      tagEntryPoint: 'topics/',
      folderTransforms: { caseTransform: 'Title Case' },
      tagTransforms: { caseTransform: 'snake_case' },
    },
  ],
};

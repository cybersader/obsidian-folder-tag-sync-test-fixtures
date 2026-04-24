/**
 * Johnny Decimal (standalone).
 *
 * Axes: Work only. Scheme: enumerative (two-digit numbered prefix per
 * sibling). Naming: ordinal. Preserves the numeric prefix into tags
 * (identity transfer keeping numbers — `numberPrefixHandling: 'keep'`).
 */

import type { FixtureFramework, FolderClassifier, HierarchyTransferRule, TypedTag } from './types';

const JD_WORK_ROOT: FolderClassifier = {
  axes: ['work'],
  scheme: 'enumerative',
  naming: 'ordinal',
  subdivisionDepth: 2, // area / category / id, three digits = three levels
  siblingUniformity: 'parallel',
};

const tag = (name: string): TypedTag => ({
  name,
  vocab: {
    axis: 'work',
    coordination: 'pre-coordinated',
    prefixMarker: null,
    authority: 'mutual',
  },
});

/** Single rule covering any `NN - Whatever/…` subtree. */
const JD_RULE: HierarchyTransferRule = {
  id: 'jd-any',
  name: 'JD: any numbered area',
  description: 'Any `^\\d{2} - Name/...` folder syncs to a matching tag, preserving numbers.',
  priority: 10,
  direction: 'bidirectional',
  folder: JD_WORK_ROOT,
  tag: {
    axis: 'work',
    coordination: 'pre-coordinated',
    prefixMarker: null,
    authority: 'mutual',
  },
  transfer: { op: 'identity' },
  inverseTransfer: { op: 'identity' },
  cardinality: '1:1',
  bijective: true,
  folderPattern: '^(\\d{2} - [^/]+)(?:/(.*))?$',
  tagPattern: '^(\\d{2}-[a-z0-9-]+)(?:/(.*))?$',
  folderEntryPoint: '',
  tagEntryPoint: '',
  folderTransforms: { caseTransform: 'Title Case', numberPrefixHandling: 'keep' },
  tagTransforms: { caseTransform: 'kebab-case', numberPrefixHandling: 'keep' },
  options: {
    createFolders: true,
    addTags: true,
    removeOrphanedTags: false,
    syncOnFileCreate: true,
    syncOnFileMove: true,
    syncOnFileRename: true,
    onConflict: 'prompt',
    keepDestinationTag: true,
    keepRelationTags: true,
    handleFolderNote: false,
    moveAttachments: true,
  },
  enabled: true,
};

export const JD: FixtureFramework = {
  id: 'jd',
  name: 'Johnny Decimal',
  description: 'Numeric two-digit prefixes per sibling at each depth. Preserves prefix into tags.',
  axesExercised: ['work'],
  files: [
    { path: '10 - Projects/11 - Q4 Roadmap/kickoff.md', folder: JD_WORK_ROOT, tags: [tag('10-projects/11-q4-roadmap')] },
    { path: '10 - Projects/11 - Q4 Roadmap/brief.md', folder: JD_WORK_ROOT, tags: [tag('10-projects/11-q4-roadmap')] },
    { path: '10 - Projects/12 - Launch/plan.md', folder: JD_WORK_ROOT, tags: [tag('10-projects/12-launch')] },
    { path: '20 - Areas/21 - Health/labs.md', folder: JD_WORK_ROOT, tags: [tag('20-areas/21-health')] },
    { path: '20 - Areas/22 - Finance/budget.md', folder: JD_WORK_ROOT, tags: [tag('20-areas/22-finance')] },
    { path: '30 - Resources/31 - Tools/obsidian.md', folder: JD_WORK_ROOT, tags: [tag('30-resources/31-tools')] },
    { path: '90 - Archive/91 - 2023/old.md', folder: JD_WORK_ROOT, tags: [tag('90-archive/91-2023')] },
  ],
  rules: [JD_RULE],
};

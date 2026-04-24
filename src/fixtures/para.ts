/**
 * PARA (Tiago Forte) — Projects / Areas / Resources / Archive.
 *
 * Axes: Work only. Scheme: enumerative (four fixed buckets). Naming: word.
 * Every rule is `op: 'identity'` — pre-coordination preserved — since PARA's
 * whole premise is that folder structure === tag structure with a case
 * transform.
 */

import type { FixtureFramework, FolderClassifier, HierarchyTransferRule, TypedTag } from './types';

const WORK_AUTHORITY_ROOT: FolderClassifier = {
  axes: ['work'],
  scheme: 'enumerative',
  naming: 'word',
  subdivisionDepth: 'unbounded',
  siblingUniformity: 'parallel',
};

const tag = (name: string, axis: 'work' = 'work'): TypedTag => ({
  name,
  vocab: {
    axis,
    coordination: 'pre-coordinated',
    prefixMarker: null,
    authority: 'mutual',
  },
});

const makeRule = (bucket: string, priority: number): HierarchyTransferRule => ({
  id: `para-${bucket.toLowerCase()}`,
  name: `PARA: ${bucket}`,
  description: `${bucket}/ ↔ #${bucket.toLowerCase()}/* (identity, bidirectional, snake_case tags)`,
  priority,
  direction: 'bidirectional',
  folder: WORK_AUTHORITY_ROOT,
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
  folderPattern: `^${bucket}/(.*)$`,
  tagPattern: `^${bucket.toLowerCase()}/(.*)$`,
  folderEntryPoint: `${bucket}/`,
  tagEntryPoint: `${bucket.toLowerCase()}/`,
  folderTransforms: { caseTransform: 'Title Case', stripEmoji: true },
  tagTransforms: { caseTransform: 'snake_case', stripEmoji: true },
  options: {
    createFolders: true,
    addTags: true,
    removeOrphanedTags: false,
    syncOnFileCreate: true,
    syncOnFileMove: true,
    syncOnFileRename: true,
    onConflict: 'prompt',
    tagSpecificity: 'narrower',
    removeSourceTag: false,
    keepDestinationTag: true,
    keepRelationTags: true,
    handleFolderNote: false,
    moveAttachments: true,
  },
  enabled: true,
});

export const PARA: FixtureFramework = {
  id: 'para',
  name: 'PARA (Projects, Areas, Resources, Archive)',
  description: 'Tiago Forte\'s PARA method — four canonical Work buckets, identity transfer, bidirectional sync.',
  axesExercised: ['work'],
  files: [
    // Projects/
    { path: 'Projects/Q4-Roadmap/kickoff.md', folder: WORK_AUTHORITY_ROOT, tags: [tag('projects/q4_roadmap')] },
    { path: 'Projects/Q4-Roadmap/brief.md', folder: WORK_AUTHORITY_ROOT, tags: [tag('projects/q4_roadmap')] },
    { path: 'Projects/Q4-Roadmap/notes.md', folder: WORK_AUTHORITY_ROOT, tags: [tag('projects/q4_roadmap')] },
    { path: 'Projects/Launch/plan.md', folder: WORK_AUTHORITY_ROOT, tags: [tag('projects/launch')] },
    { path: 'Projects/Research/summary.md', folder: WORK_AUTHORITY_ROOT, tags: [tag('projects/research')] },

    // Areas/
    { path: 'Areas/Health/labs.md', folder: WORK_AUTHORITY_ROOT, tags: [tag('areas/health')] },
    { path: 'Areas/Finance/budget.md', folder: WORK_AUTHORITY_ROOT, tags: [tag('areas/finance')] },

    // Resources/
    { path: 'Resources/Tools/obsidian-tips.md', folder: WORK_AUTHORITY_ROOT, tags: [tag('resources/tools')] },
    { path: 'Resources/Books/reading-list.md', folder: WORK_AUTHORITY_ROOT, tags: [tag('resources/books')] },

    // Archive/
    { path: 'Archive/2023/old-project.md', folder: WORK_AUTHORITY_ROOT, tags: [tag('archive/2023')] },
  ],
  rules: [
    makeRule('Projects', 10),
    makeRule('Areas', 20),
    makeRule('Resources', 30),
    makeRule('Archive', 40),
  ],
};

/**
 * Zettelkasten (slip-box).
 *
 * Axes: Capture, Work, Relation. The stage buckets (Inbox / Fleeting /
 * Literature / Permanent / Structure) are containers — they classify their
 * contents only at the bucket level, so `op: 'marker-only'` is the right
 * transfer: one flat tag per bucket regardless of depth.
 *
 * Relation (cross-link keyword) tags are authored directly on files —
 * they're post-coordinated, don't derive from any folder path. `op: 'opaque'`
 * on the folder side for relation: the folder doesn't emit these tags.
 */

import type { FixtureFramework, FolderClassifier, HierarchyTransferRule, TypedTag } from './types';

const ZK_BUCKET: FolderClassifier = {
  axes: ['work'],
  scheme: 'container-only',
  naming: 'ordinal',
  subdivisionDepth: 0,
  siblingUniformity: 'parallel',
};

const ZK_CAPTURE_BUCKET: FolderClassifier = {
  ...ZK_BUCKET,
  axes: ['capture'],
};

const workTag = (name: string): TypedTag => ({
  name,
  vocab: { axis: 'work', coordination: 'flat-keyword', prefixMarker: null, authority: 'tag-authoritative' },
});
const captureTag = (name: string): TypedTag => ({
  name,
  vocab: { axis: 'capture', coordination: 'flat-keyword', prefixMarker: null, authority: 'tag-authoritative' },
});
const relationTag = (name: string): TypedTag => ({
  name,
  vocab: { axis: 'relation', coordination: 'flat-keyword', prefixMarker: null, authority: 'tag-authoritative' },
});

const markerRule = (bucket: string, axis: 'capture' | 'work', markerTag: string, priority: number): HierarchyTransferRule => ({
  id: `zk-${markerTag.replace(/[^a-z0-9]/g, '-')}`,
  name: `ZK: ${bucket} → #${markerTag}`,
  description: `${bucket}/ container — tag every file with flat #${markerTag} regardless of sub-path.`,
  priority,
  direction: 'bidirectional',
  folder: axis === 'capture' ? ZK_CAPTURE_BUCKET : ZK_BUCKET,
  tag: {
    axis,
    coordination: 'flat-keyword',
    prefixMarker: null,
    authority: 'tag-authoritative',
  },
  transfer: { op: 'marker-only', marker: markerTag },
  inverseTransfer: { op: 'marker-only', marker: markerTag },
  cardinality: 'many:1',
  bijective: false,
  folderPattern: `^${bucket}/.*$`,
  tagPattern: `^${markerTag}$`,
  folderEntryPoint: `${bucket}/`,
  tagEntryPoint: markerTag,
  folderTransforms: { caseTransform: 'Title Case' },
  tagTransforms: { caseTransform: 'lowercase' },
  options: {
    createFolders: true,
    addTags: true,
    removeOrphanedTags: false,
    syncOnFileCreate: true,
    syncOnFileMove: true,
    syncOnFileRename: false,
    onConflict: 'prompt',
    keepDestinationTag: true,
    keepRelationTags: true,
    handleFolderNote: false,
    moveAttachments: true,
  },
  enabled: true,
});

export const ZETTELKASTEN: FixtureFramework = {
  id: 'zettelkasten',
  name: 'Zettelkasten (slip-box)',
  description: 'Five-stage pipeline (Inbox/Fleeting/Literature/Permanent/Structure) with flat marker tags + post-coordinated relation tags.',
  axesExercised: ['capture', 'work', 'relation'],
  files: [
    {
      path: '0 - Inbox/raw-thought-2026-04-01.md',
      folder: ZK_CAPTURE_BUCKET,
      tags: [captureTag('zk-inbox'), relationTag('topic/ai')],
    },
    {
      path: '1 - Fleeting/idea-attention-finite.md',
      folder: ZK_BUCKET,
      tags: [workTag('zk-fleeting'), relationTag('topic/attention'), relationTag('topic/cognition')],
    },
    {
      path: '2 - Literature/kahneman-thinking-fast-and-slow.md',
      folder: ZK_BUCKET,
      tags: [workTag('zk-literature'), relationTag('author/kahneman'), relationTag('topic/cognition')],
    },
    {
      path: '3 - Permanent/attention-is-a-budget.md',
      folder: ZK_BUCKET,
      tags: [workTag('zk-permanent'), relationTag('topic/attention')],
    },
    {
      path: '3 - Permanent/analogy-mind-is-a-lens.md',
      folder: ZK_BUCKET,
      tags: [workTag('zk-permanent'), relationTag('topic/cognition'), relationTag('topic/metaphor')],
    },
    {
      path: '4 - Structure/moc-cognition.md',
      folder: ZK_BUCKET,
      tags: [workTag('zk-structure'), relationTag('moc')],
    },
  ],
  rules: [
    markerRule('0 - Inbox', 'capture', 'zk-inbox', 10),
    markerRule('1 - Fleeting', 'work', 'zk-fleeting', 20),
    markerRule('2 - Literature', 'work', 'zk-literature', 30),
    markerRule('3 - Permanent', 'work', 'zk-permanent', 40),
    markerRule('4 - Structure', 'work', 'zk-structure', 50),
  ],
};

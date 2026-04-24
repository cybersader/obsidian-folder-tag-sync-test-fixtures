/**
 * SEACOW with TWO Entity authority-roots — Cybersader + Username1.
 *
 * Stress-tests the wildcard challenge (cf. WILDCARD_MATCHING_CHALLENGE.md)
 * by creating two entities with parallel inner shape. Phase 1 handles this
 * via TWO explicit rules (one per entity), which works but demonstrates the
 * rule-explosion problem that Phase 3's wildcard support will eventually
 * solve.
 *
 * Also embeds the legacy `POLY_FILES` + `EDGE_FILES` test surfaces from the
 * pre-refactor `fixtures.ts`, annotated with their axis declarations so they
 * fit the new type system.
 */

import type {
  FixtureFramework,
  FolderClassifier,
  HierarchyTransferRule,
  TypedTag,
} from './types';

// ─── Classifiers (two parallel entity roots + edge-case leaves) ───────────

const ENTITY_ROOT: FolderClassifier = {
  axes: ['entity', 'work'],
  scheme: 'authority-root',
  naming: 'word',
  subdivisionDepth: 'unbounded',
  siblingUniformity: 'parallel',
};

const EDGE_FREEFORM: FolderClassifier = {
  axes: ['work'],
  scheme: 'faceted',
  naming: 'mixed',
  subdivisionDepth: 'unbounded',
  siblingUniformity: 'unique',
};

const entityTag = (name: string): TypedTag => ({
  name,
  vocab: { axis: 'entity', coordination: 'pre-coordinated', prefixMarker: '--', authority: 'mutual' },
});
const relationTag = (name: string): TypedTag => ({
  name,
  vocab: { axis: 'relation', coordination: 'flat-keyword', prefixMarker: null, authority: 'tag-authoritative' },
});
const workTag = (name: string): TypedTag => ({
  name,
  vocab: { axis: 'work', coordination: 'pre-coordinated', prefixMarker: null, authority: 'mutual' },
});

const entityRule = (entitySlug: string, folderPathSeg: string, priority: number): HierarchyTransferRule => ({
  id: `seacow-entity-${entitySlug}`,
  name: `ENTITY: ${folderPathSeg} workspace`,
  description: `Entity/${folderPathSeg} ↔ #--${entitySlug}/* — identity, bidirectional.`,
  priority,
  direction: 'bidirectional',
  folder: ENTITY_ROOT,
  tag: { axis: 'entity', coordination: 'pre-coordinated', prefixMarker: '--', authority: 'mutual' },
  transfer: { op: 'identity' },
  inverseTransfer: { op: 'identity' },
  cardinality: '1:1',
  bijective: true,
  folderPattern: `^Entity/${folderPathSeg}/(.*)$`,
  tagPattern: `^--${entitySlug}/(.*)$`,
  folderEntryPoint: `Entity/${folderPathSeg}/`,
  tagEntryPoint: `--${entitySlug}/`,
  folderTransforms: { caseTransform: 'Title Case', numberPrefixHandling: 'keep' },
  tagTransforms: { caseTransform: 'kebab-case', numberPrefixHandling: 'keep' },
  options: {
    createFolders: true,
    addTags: true,
    removeOrphanedTags: true,
    keepDestinationTag: true,
    keepRelationTags: true,
    moveAttachments: true,
    handleFolderNote: true,
  },
  enabled: true,
});

// ─── Framework ────────────────────────────────────────────────────────────

export const SEACOW_CYBERSADER: FixtureFramework = {
  id: 'seacow-cybersader',
  name: 'SEACOW (Cybersader + multi-entity)',
  description: 'SEACOW with two parallel Entity authority-roots (Cybersader + Username1). Demonstrates the rule-explosion problem wildcards will eventually solve.',
  axesExercised: ['entity', 'work', 'relation'],
  files: [
    // Two parallel Entity authority-roots with the same inner JD shape
    {
      path: 'Entity/Cybersader/10 - Projects/11 - Q4 Roadmap/kickoff.md',
      folder: ENTITY_ROOT,
      tags: [entityTag('--cybersader/10-projects/11-q4-roadmap'), relationTag('topic/roadmap')],
    },
    {
      path: 'Entity/Cybersader/10 - Projects/12 - Launch/plan.md',
      folder: ENTITY_ROOT,
      tags: [entityTag('--cybersader/10-projects/12-launch')],
    },
    {
      path: 'Entity/Username1/10 - Projects/11 - Q4 Roadmap/kickoff.md',
      folder: ENTITY_ROOT,
      tags: [entityTag('--username1/10-projects/11-q4-roadmap'), relationTag('topic/roadmap')],
    },
    {
      path: 'Entity/Username1/20 - Areas/21 - Research/notes.md',
      folder: ENTITY_ROOT,
      tags: [entityTag('--username1/20-areas/21-research')],
    },

    // Legacy POLY — one file carrying multiple preserving tags (polyhierarchy demo)
    {
      path: 'Entity/Cybersader/10 - Projects/11 - Q4 Roadmap/poly-demo.md',
      folder: ENTITY_ROOT,
      tags: [
        entityTag('--cybersader/10-projects/11-q4-roadmap'),
        relationTag('topic/roadmap'),
        relationTag('topic/planning'),
        relationTag('authored-by/cybersader'),
      ],
      note: 'Poly-hierarchy test: one physical file, four independent axis positions (entity×work + three relations).',
    },

    // Legacy EDGE — non-standard naming/nesting tests
    {
      path: 'Freeform/📁 01 - inbox/quick-capture.md',
      folder: { ...EDGE_FREEFORM, naming: 'emoji-prefixed' },
      tags: [workTag('freeform/inbox')],
      note: 'Edge: leading emoji + ordinal prefix.',
    },
    {
      path: 'Freeform/98 - Archive/Old Notes (2019)/ancient.md',
      folder: { ...EDGE_FREEFORM, naming: 'ordinal' },
      tags: [workTag('freeform/archive/2019')],
      note: 'Edge: ordinal prefix + parenthesized year + unicode space.',
    },
    {
      path: 'Freeform/deeply/nested/folder/tree/very/far/down/leaf.md',
      folder: { ...EDGE_FREEFORM, subdivisionDepth: 'unbounded' },
      tags: [workTag('freeform/deep')],
      note: 'Edge: very deep nesting.',
    },
  ],
  rules: [entityRule('cybersader', 'Cybersader', 10), entityRule('username1', 'Username1', 20)],
};

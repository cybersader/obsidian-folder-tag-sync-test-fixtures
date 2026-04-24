/**
 * SEACOW meta-framework with Johnny Decimal as the Work instantiation.
 *
 * Rules mirror seacow-cyberbase.json verbatim (same tag-prefix conventions,
 * same priorities) and cover 5 of 6 SEACOW axes:
 *   - system:  /template flat marker (container-only folder)
 *   - entity:  --entity/ identity transfer over Entity authority-root
 *   - capture: two rules — -inbox flat marker + -clip/ truncated-to-depth-2
 *   - output:  _publicTaxonomy/ identity transfer (deep hierarchical), _/ identity
 *   - work:    (handled inside Entity-scoped paths via the entity rule —
 *              JD-numbered subfolders Cybersader/10-projects/... get absorbed
 *              into the entity-rooted identity transfer)
 *
 * Relation axis is left for authored user tags (not derived from rules).
 */

import type {
  FixtureFramework,
  FolderClassifier,
  HierarchyTransferRule,
  TypedTag,
} from './types';

// ─── Classifiers ──────────────────────────────────────────────────────────

const SYSTEM_CLUSTER: FolderClassifier = {
  axes: ['system'],
  scheme: 'container-only',
  naming: 'word',
  subdivisionDepth: 0,
  siblingUniformity: 'unique',
};

const ENTITY_ROOT: FolderClassifier = {
  axes: ['entity', 'work'],
  scheme: 'authority-root',
  naming: 'word',
  subdivisionDepth: 'unbounded',
  siblingUniformity: 'parallel',
};

const CAPTURE_INBOX: FolderClassifier = {
  axes: ['capture'],
  scheme: 'container-only',
  naming: 'word',
  subdivisionDepth: 0,
  siblingUniformity: 'unique',
};

const CAPTURE_CLIPS: FolderClassifier = {
  axes: ['capture'],
  scheme: 'hierarchical',
  naming: 'word',
  subdivisionDepth: 2,
  siblingUniformity: 'unique',
};

const OUTPUT_MAIN: FolderClassifier = {
  axes: ['output'],
  scheme: 'hierarchical',
  naming: 'word',
  subdivisionDepth: 'unbounded',
  siblingUniformity: 'unique',
};

const OUTPUT_PUBLIC: FolderClassifier = {
  axes: ['output'],
  scheme: 'hierarchical',
  naming: 'word',
  subdivisionDepth: 'unbounded',
  siblingUniformity: 'unique',
};

// ─── Tag helpers ──────────────────────────────────────────────────────────

const systemTag = (name: string): TypedTag => ({
  name,
  vocab: { axis: 'system', coordination: 'flat-keyword', prefixMarker: '/', authority: 'tag-authoritative' },
});
const entityTag = (name: string): TypedTag => ({
  name,
  vocab: { axis: 'entity', coordination: 'pre-coordinated', prefixMarker: '--', authority: 'mutual' },
});
const captureFlatTag = (name: string): TypedTag => ({
  name,
  vocab: { axis: 'capture', coordination: 'flat-keyword', prefixMarker: '-', authority: 'tag-authoritative' },
});
const captureNestedTag = (name: string): TypedTag => ({
  name,
  vocab: { axis: 'capture', coordination: 'pre-coordinated', prefixMarker: '-', authority: 'tag-authoritative' },
});
const outputTag = (name: string): TypedTag => ({
  name,
  vocab: { axis: 'output', coordination: 'pre-coordinated', prefixMarker: '_', authority: 'mutual' },
});
const relationTag = (name: string): TypedTag => ({
  name,
  vocab: { axis: 'relation', coordination: 'flat-keyword', prefixMarker: null, authority: 'tag-authoritative' },
});

// ─── Rules (6 — all 8 transfer ops demonstrated except aggregation / promotion / post-coord, saved for edge-case fixtures) ──

const RULES: HierarchyTransferRule[] = [
  // 1. SYSTEM — container-only folder, flat marker tag
  {
    id: 'seacow-system',
    name: 'SYSTEM: Templates & config',
    description: 'System/Templates folder → flat #/template tag regardless of sub-path.',
    priority: 10,
    direction: 'tag-to-folder',
    folder: SYSTEM_CLUSTER,
    tag: { axis: 'system', coordination: 'flat-keyword', prefixMarker: '/', authority: 'tag-authoritative' },
    transfer: { op: 'marker-only', marker: '/template' },
    inverseTransfer: { op: 'marker-only', marker: '/template' },
    cardinality: 'many:1',
    bijective: false,
    folderPattern: '^System/.*$',
    tagPattern: '^/template$',
    folderEntryPoint: 'System/',
    tagEntryPoint: '/template',
    folderTransforms: { caseTransform: 'Title Case' },
    tagTransforms: { caseTransform: 'lowercase' },
    options: { createFolders: true, keepRelationTags: true, moveAttachments: true },
    enabled: true,
  },

  // 2. ENTITY — authority root, identity transfer (full depth preserved)
  {
    id: 'seacow-entity-cybersader',
    name: 'ENTITY: Cybersader workspace',
    description: 'Entity/Cybersader ↔ #--cybersader/* — identity transfer, bidirectional.',
    priority: 20,
    direction: 'bidirectional',
    folder: ENTITY_ROOT,
    tag: { axis: 'entity', coordination: 'pre-coordinated', prefixMarker: '--', authority: 'mutual' },
    transfer: { op: 'identity' },
    inverseTransfer: { op: 'identity' },
    cardinality: '1:1',
    bijective: true,
    folderPattern: '^Entity/Cybersader/(.*)$',
    tagPattern: '^--cybersader/(.*)$',
    folderEntryPoint: 'Entity/Cybersader/',
    tagEntryPoint: '--cybersader/',
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
  },

  // 3. CAPTURE INBOX — container, flat marker
  {
    id: 'seacow-capture-inbox',
    name: 'CAPTURE: Inbox flat marker',
    description: 'Capture/Inbox ↔ #-inbox — flat marker, many:1, lossy.',
    priority: 30,
    direction: 'tag-to-folder',
    folder: CAPTURE_INBOX,
    tag: { axis: 'capture', coordination: 'flat-keyword', prefixMarker: '-', authority: 'tag-authoritative' },
    transfer: { op: 'marker-only', marker: '-inbox' },
    inverseTransfer: { op: 'marker-only', marker: '-inbox' },
    cardinality: 'many:1',
    bijective: false,
    folderPattern: '^Capture/Inbox/.*$',
    tagPattern: '^-inbox$',
    folderEntryPoint: 'Capture/Inbox/',
    tagEntryPoint: '-inbox',
    folderTransforms: { caseTransform: 'Title Case' },
    tagTransforms: { caseTransform: 'lowercase' },
    options: { createFolders: true, keepRelationTags: true, moveAttachments: true },
    enabled: true,
  },

  // 4. CAPTURE CLIPS — hierarchical but depth-capped (truncation)
  {
    id: 'seacow-capture-clip',
    name: 'CAPTURE: Clips (depth 2)',
    description: 'Capture/Clips ↔ #-clip/* with max 2 sub-levels.',
    priority: 40,
    direction: 'tag-to-folder',
    folder: CAPTURE_CLIPS,
    tag: { axis: 'capture', coordination: 'pre-coordinated', prefixMarker: '-', authority: 'tag-authoritative' },
    transfer: { op: 'truncation', depth: 2 },
    inverseTransfer: { op: 'truncation', depth: 2 },
    cardinality: '1:1',
    bijective: true,
    folderPattern: '^Capture/Clips/(.*)$',
    tagPattern: '^-clip/(.*)$',
    folderEntryPoint: 'Capture/Clips/',
    tagEntryPoint: '-clip/',
    folderTransforms: { caseTransform: 'Title Case' },
    tagTransforms: { caseTransform: 'kebab-case' },
    options: { createFolders: true, keepRelationTags: true, moveAttachments: true },
    enabled: true,
  },

  // 5. OUTPUT MAIN — identity, deep
  {
    id: 'seacow-output-main',
    name: 'OUTPUT: Main facing',
    description: 'Output/Main ↔ #_/* — identity, bidirectional, deep hierarchy.',
    priority: 50,
    direction: 'bidirectional',
    folder: OUTPUT_MAIN,
    tag: { axis: 'output', coordination: 'pre-coordinated', prefixMarker: '_', authority: 'mutual' },
    transfer: { op: 'identity' },
    inverseTransfer: { op: 'identity' },
    cardinality: '1:1',
    bijective: true,
    folderPattern: '^Output/Main/(.*)$',
    tagPattern: '^_/(.*)$',
    folderEntryPoint: 'Output/Main/',
    tagEntryPoint: '_/',
    folderTransforms: { caseTransform: 'Title Case' },
    tagTransforms: { caseTransform: 'kebab-case' },
    options: {
      createFolders: true,
      addTags: true,
      removeOrphanedTags: false,
      keepDestinationTag: true,
      keepRelationTags: true,
      moveAttachments: true,
    },
    enabled: true,
  },

  // 6. OUTPUT PUBLIC TAXONOMY — identity, deep, distinct prefix
  {
    id: 'seacow-output-public',
    name: 'OUTPUT: Public taxonomy',
    description: 'Output/Public ↔ #_publicTaxonomy/* — identity, bidirectional.',
    priority: 60,
    direction: 'bidirectional',
    folder: OUTPUT_PUBLIC,
    tag: { axis: 'output', coordination: 'pre-coordinated', prefixMarker: '_', authority: 'mutual' },
    transfer: { op: 'identity' },
    inverseTransfer: { op: 'identity' },
    cardinality: '1:1',
    bijective: true,
    folderPattern: '^Output/Public/(.*)$',
    tagPattern: '^_publicTaxonomy/(.*)$',
    folderEntryPoint: 'Output/Public/',
    tagEntryPoint: '_publicTaxonomy/',
    folderTransforms: { caseTransform: 'Title Case' },
    tagTransforms: { caseTransform: 'kebab-case' },
    options: {
      createFolders: true,
      addTags: true,
      removeOrphanedTags: false,
      keepDestinationTag: true,
      keepRelationTags: true,
      moveAttachments: true,
    },
    enabled: true,
  },
];

export const SEACOW_JD: FixtureFramework = {
  id: 'seacow-jd',
  name: 'SEACOW (JD-instantiated)',
  description: 'Full SEACOW meta-framework with Johnny Decimal numbering inside Entity-scoped Work paths. Covers 5 of 6 axes via 6 rules, exercising 4 of 8 transfer operations.',
  axesExercised: ['system', 'entity', 'capture', 'output', 'work', 'relation'],
  files: [
    // System — flat cluster
    { path: 'System/Templates/meeting.md', folder: SYSTEM_CLUSTER, tags: [systemTag('/template')] },
    { path: 'System/Templates/weekly.md', folder: SYSTEM_CLUSTER, tags: [systemTag('/template')] },

    // Entity-scoped Work (JD inside Cybersader)
    {
      path: 'Entity/Cybersader/10 - Projects/11 - Q4 Roadmap/kickoff.md',
      folder: ENTITY_ROOT,
      tags: [entityTag('--cybersader/10-projects/11-q4-roadmap'), relationTag('topic/roadmap')],
    },
    {
      path: 'Entity/Cybersader/10 - Projects/11 - Q4 Roadmap/brief.md',
      folder: ENTITY_ROOT,
      tags: [entityTag('--cybersader/10-projects/11-q4-roadmap')],
    },
    {
      path: 'Entity/Cybersader/20 - Areas/21 - Ops/runbook.md',
      folder: ENTITY_ROOT,
      tags: [entityTag('--cybersader/20-areas/21-ops'), relationTag('topic/ops')],
    },

    // Capture — inbox (flat marker)
    { path: 'Capture/Inbox/quick-2026-04-24.md', folder: CAPTURE_INBOX, tags: [captureFlatTag('-inbox')] },
    { path: 'Capture/Inbox/screenshot-0231.md', folder: CAPTURE_INBOX, tags: [captureFlatTag('-inbox')] },

    // Capture — clips (depth-2 truncated)
    { path: 'Capture/Clips/Web/2026-04-01-article.md', folder: CAPTURE_CLIPS, tags: [captureNestedTag('-clip/web')] },
    { path: 'Capture/Clips/Video/yt-cognition.md', folder: CAPTURE_CLIPS, tags: [captureNestedTag('-clip/video')] },

    // Output — main
    { path: 'Output/Main/Essays/on-attention.md', folder: OUTPUT_MAIN, tags: [outputTag('_/essays/on-attention')] },
    { path: 'Output/Main/Newsletters/2026-04.md', folder: OUTPUT_MAIN, tags: [outputTag('_/newsletters/2026-04')] },

    // Output — public taxonomy
    { path: 'Output/Public/Security/threat-modeling.md', folder: OUTPUT_PUBLIC, tags: [outputTag('_publicTaxonomy/security/threat-modeling')] },
    { path: 'Output/Public/Security/zero-trust.md', folder: OUTPUT_PUBLIC, tags: [outputTag('_publicTaxonomy/security/zero-trust')] },
  ],
  rules: RULES,
};

/**
 * Type system for typed folder-tag fixtures.
 *
 * Vocabulary (all lifted from cybersader/crosswalker's documented prior art
 * rather than invented here):
 *   - `Axis`: SEACOW's orthogonal classification dimensions (System, Entity,
 *     Activities[Capture, Output, Work], relation). Knowledge has more axes
 *     than a folder tree can carry; tags carry the axes folders can't.
 *   - `FolderClassifier`: how a folder classifies content — its scheme,
 *     naming convention, subdivision depth, and sibling uniformity.
 *   - `TagVocabulary`: the tag-side mirror — a tag is a term in a controlled
 *     vocabulary, carrying one axis, with a coordination mode and authority
 *     relationship to the folder.
 *   - `HierarchyTransferRule`: how axes cross the folder↔tag boundary AND
 *     what happens to hierarchy depth in the process. The `transfer` field is
 *     one of eight library-science primitives (identity, truncation,
 *     promotion-to-root, flattening-to-leaf, post-coordination, aggregation,
 *     marker-only, opaque).
 */

// ─── The meta-dimension: SEACOW axes ──────────────────────────────────────

export type Axis =
  | 'system' // S — platform, tool, config
  | 'entity' // E — workspace owner, user, agent, authority
  | 'capture' // A.C — ingestion, inbox, clippings
  | 'output' // A.O — publishable, external-facing
  | 'work' // A.W — active processing, derivation (PARA, JD live here)
  | 'relation'; // r — flat cross-link keywords

export const ALL_AXES: Axis[] = [
  'system',
  'entity',
  'capture',
  'output',
  'work',
  'relation',
];

// ─── Folder side ──────────────────────────────────────────────────────────

export type FolderScheme =
  | 'enumerative' // numbered siblings (JD 10-, 20-); order-meaningful list
  | 'hierarchical' // strict subject tree (deep Output taxonomies)
  | 'faceted' // multiple independent sub-axes intermixed under one root
  | 'authority-root' // per-authority workspace (Cybersader/, Username1/)
  | 'container-only'; // clusters without classifying (Attachments/, Drafts/)

export type FolderNaming =
  | 'word' // Projects/
  | 'ordinal' // 10 - Projects/
  | 'symbol-prefixed' // --cybersader/, _public/
  | 'emoji-prefixed' // 📁 Projects/
  | 'mixed';

export type FolderSubdivisionDepth = number | 'unbounded';

export type SiblingUniformity = 'parallel' | 'unique';

/**
 * Describes a folder as a classification point. `axes` is usually one entry;
 * when a folder is nested inside another classifier (e.g. `Cybersader/01-Projects/`
 * is scoped by an Entity but itself classifies Work), we list both.
 */
export interface FolderClassifier {
  axes: Axis[];
  scheme: FolderScheme;
  naming: FolderNaming;
  subdivisionDepth: FolderSubdivisionDepth;
  siblingUniformity: SiblingUniformity;
}

// ─── Tag side ─────────────────────────────────────────────────────────────

export type TagCoordination =
  | 'pre-coordinated' // #projects/q4-roadmap — concepts fused in the term
  | 'post-coordinated' // #projects + #q4-roadmap — applied separately
  | 'flat-keyword'; // #urgent — single concept, no compounding

/**
 * SEACOW's documented tag-prefix conventions (from seacow-cyberbase.json +
 * UI_IMPROVEMENTS_SUMMARY.md ASCII-sort rationale):
 *   '/' : System
 *   '--': Entity
 *   '-' : Capture
 *   '_' : Output
 *   ''  : Work (no prefix)
 *   null: Relation (or any un-prefixed convention)
 */
export type TagPrefixMarker = '/' | '--' | '-' | '_' | '' | null;

export type TagAuthority =
  | 'folder-authoritative' // tag derived from folder (folder→tag)
  | 'tag-authoritative' // folder position derived from tag (tag→folder)
  | 'mutual'; // bidirectional; either side can edit

export interface TagVocabulary {
  axis: Axis;
  coordination: TagCoordination;
  prefixMarker: TagPrefixMarker;
  authority: TagAuthority;
}

// ─── Hierarchy transfer: the eight library-science primitives ─────────────

export type TransferOp =
  | { op: 'identity' } // pre-coordination preserved full depth
  | { op: 'truncation'; depth: number } // bounded specificity
  | { op: 'promotion-to-root' } // broader-term collection
  | { op: 'flattening-to-leaf' } // specific-term indexing
  | { op: 'post-coordination' } // axis split — N flat tags, one per level
  | { op: 'aggregation'; separator: string } // compressed descriptor (#a-b-c)
  | { op: 'marker-only'; marker: string } // flat controlled vocabulary (#inbox)
  | { op: 'opaque' }; // folder clustering-only; no tag produced

// ─── Transform pipeline (kept as existing plugin has it) ──────────────────

export type CaseTransform =
  | 'none'
  | 'snake_case'
  | 'kebab-case'
  | 'camelCase'
  | 'PascalCase'
  | 'Title Case'
  | 'lowercase'
  | 'UPPERCASE';

export interface TransformPipeline {
  caseTransform?: CaseTransform;
  stripEmoji?: boolean;
  numberPrefixHandling?: 'keep' | 'strip' | 'extract';
  customRegex?: Array<{ pattern: string; replacement: string; flags?: string }>;
}

export interface RuleOptions {
  createFolders?: boolean;
  addTags?: boolean;
  removeOrphanedTags?: boolean;
  syncOnFileCreate?: boolean;
  syncOnFileMove?: boolean;
  syncOnFileRename?: boolean;
  onConflict?: 'prompt' | 'auto-resolve' | 'skip';
  tagSpecificity?: 'broader' | 'narrower';
  removeSourceTag?: boolean;
  keepDestinationTag?: boolean;
  keepRelationTags?: boolean;
  handleFolderNote?: boolean;
  moveAttachments?: boolean;
}

// ─── The rule itself ──────────────────────────────────────────────────────

export type RuleDirection = 'folder-to-tag' | 'tag-to-folder' | 'bidirectional';

export type Cardinality = '1:1' | '1:many' | 'many:1';

/**
 * A typed folder↔tag sync rule.
 *
 * The `transfer` operation is the central field — it says what happens to
 * hierarchy as content crosses the boundary. `inverseTransfer` handles the
 * reverse direction (often but not always the same).
 *
 * `folderPattern` / `tagPattern` are kept as raw regex so Phase 1 fixtures
 * can ship without the main plugin needing to learn how to derive them from
 * the classifier + vocabulary — that derivation is a Phase 2 concern.
 */
export interface HierarchyTransferRule {
  id: string;
  name: string;
  description?: string;
  priority: number;
  direction: RuleDirection;

  folder: FolderClassifier;
  tag: TagVocabulary;

  transfer: TransferOp;
  inverseTransfer: TransferOp;

  cardinality: Cardinality;
  bijective: boolean;

  // Raw regex + entry points the main plugin currently expects.
  // Kept alongside the typed fields so rules round-trip through the main
  // plugin's data.json without loss.
  folderPattern?: string;
  tagPattern?: string;
  folderEntryPoint?: string;
  tagEntryPoint?: string;

  folderTransforms: TransformPipeline;
  tagTransforms: TransformPipeline;
  options: RuleOptions;

  enabled: boolean;
}

// ─── Fixture files and frameworks ─────────────────────────────────────────

export interface TypedTag {
  /** Raw tag string (no leading `#`). */
  name: string;
  vocab: TagVocabulary;
}

export interface FixtureFile {
  /** Path relative to the fixtures `rootFolder` setting. */
  path: string;
  /** Classifier of the folder CONTAINING this file. */
  folder: FolderClassifier;
  /** All tags to write into the file's frontmatter, axis-typed. */
  tags: TypedTag[];
  /** Optional freeform note explaining why this fixture exists. */
  note?: string;
}

export type FrameworkId =
  | 'para'
  | 'jd'
  | 'zettelkasten'
  | 'seacow-jd'
  | 'seacow-cybersader';

export interface FixtureFramework {
  id: FrameworkId;
  name: string;
  description: string;
  /** Which SEACOW axes this framework's files + rules collectively exercise. */
  axesExercised: Axis[];
  files: FixtureFile[];
  rules: HierarchyTransferRule[];
}

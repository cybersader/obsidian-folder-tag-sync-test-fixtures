/**
 * Compressed Index — three rules demonstrating the three "compress the
 * tail" operations: full aggregation, truncation with aggregated tail,
 * truncation with flattened (leaf-only) tail.
 *
 * Library-science framing: when one classification surface (the folder
 * tree) carries more depth than the destination surface (the tag
 * vocabulary) wants to expose, you compress. The three modes here are
 * the three principled ways to compress:
 *
 *   - aggregation:                   join everything with separator
 *   - truncation(tail: aggregate):   preserve depth N, join the rest
 *   - truncation(tail: flatten):     preserve depth N, replace tail with leaf
 *
 * Each mode is lossy — bijectivity is impossible by construction — but
 * each preserves a different aspect of the source: aggregation preserves
 * order + content fully (just denormalized), truncate-aggregate preserves
 * the head hierarchy + the tail content, truncate-flatten preserves the
 * head hierarchy + only the leaf identity.
 */

import type { FixtureFramework, FolderClassifier, HierarchyTransferRule, TypedTag } from './types';

const COMPRESSED: FolderClassifier = {
	axes: ['work'],
	scheme: 'hierarchical',
	naming: 'word',
	subdivisionDepth: 'unbounded',
	siblingUniformity: 'unique',
};

const tagFor = (name: string): TypedTag => ({
	name,
	vocab: { axis: 'work', coordination: 'pre-coordinated', prefixMarker: null, authority: 'mutual' },
});

// ─── Three rules, three compression modes ────────────────────────────────

const AGG_RULE: HierarchyTransferRule = {
	id: 'ci-aggregation',
	name: 'Compressed: full aggregation',
	description: 'Compressed/Bookmarks/<deep>/<path>/note.md → one tag #bm/<deep>-<path> (order-preserving join)',
	priority: 10,
	direction: 'folder-to-tag',
	folder: COMPRESSED,
	tag: { axis: 'work', coordination: 'pre-coordinated', prefixMarker: null, authority: 'mutual' },
	transfer: { op: 'aggregation', separator: '-' },
	inverseTransfer: { op: 'identity' }, // can't reverse aggregation; identity is a no-op fallback
	cardinality: '1:1',
	bijective: false,
	folderPattern: '^Compressed/Bookmarks/',
	tagPattern: '^bm/',
	folderEntryPoint: 'Compressed/Bookmarks',
	tagEntryPoint: 'bm',
	folderTransforms: { caseTransform: 'Title Case' },
	tagTransforms: { caseTransform: 'kebab-case' },
	options: { createFolders: false, addTags: true, removeOrphanedTags: false, syncOnFileCreate: true, syncOnFileMove: true, syncOnFileRename: false },
	enabled: true,
};

const TAGG_RULE: HierarchyTransferRule = {
	id: 'ci-truncation-aggregate',
	name: 'Compressed: truncation depth-2 with aggregated tail',
	description: 'Compressed/Clips/<head1>/<head2>/<tail...>/note.md → #tagg/<head1>/<head2>/<tail-joined>',
	priority: 11,
	direction: 'folder-to-tag',
	folder: { ...COMPRESSED, subdivisionDepth: 2 },
	tag: { axis: 'work', coordination: 'pre-coordinated', prefixMarker: null, authority: 'mutual' },
	transfer: { op: 'truncation', depth: 2, tailHandling: 'aggregate', separator: '-' },
	inverseTransfer: { op: 'truncation', depth: 2, tailHandling: 'aggregate', separator: '-' },
	cardinality: '1:1',
	bijective: false,
	folderPattern: '^Compressed/Clips/',
	tagPattern: '^tagg/',
	folderEntryPoint: 'Compressed/Clips',
	tagEntryPoint: 'tagg',
	folderTransforms: { caseTransform: 'Title Case' },
	tagTransforms: { caseTransform: 'kebab-case' },
	options: { createFolders: false, addTags: true, removeOrphanedTags: false, syncOnFileCreate: true, syncOnFileMove: true, syncOnFileRename: false },
	enabled: true,
};

const TFLAT_RULE: HierarchyTransferRule = {
	id: 'ci-truncation-flatten',
	name: 'Compressed: truncation depth-2 with leaf-only tail',
	description: 'Compressed/Snippets/<head1>/<head2>/<...>/<leaf>/note.md → #tflat/<head1>/<head2>/<leaf>',
	priority: 12,
	direction: 'folder-to-tag',
	folder: { ...COMPRESSED, subdivisionDepth: 2 },
	tag: { axis: 'work', coordination: 'pre-coordinated', prefixMarker: null, authority: 'mutual' },
	transfer: { op: 'truncation', depth: 2, tailHandling: 'flatten' },
	inverseTransfer: { op: 'truncation', depth: 2, tailHandling: 'flatten' },
	cardinality: 'many:1', // multiple folder shapes can map to same head + leaf
	bijective: false,
	folderPattern: '^Compressed/Snippets/',
	tagPattern: '^tflat/',
	folderEntryPoint: 'Compressed/Snippets',
	tagEntryPoint: 'tflat',
	folderTransforms: { caseTransform: 'Title Case' },
	tagTransforms: { caseTransform: 'kebab-case' },
	options: { createFolders: false, addTags: true, removeOrphanedTags: false, syncOnFileCreate: true, syncOnFileMove: true, syncOnFileRename: false },
	enabled: true,
};

export const COMPRESSED_INDEX: FixtureFramework = {
	id: 'compressed-index',
	name: 'Compressed Index (the three compression modes)',
	description: 'aggregation + truncation:aggregate + truncation:flatten — the three principled lossy compressions of folder hierarchy into tag vocabulary.',
	axesExercised: ['work'],
	files: [
		// aggregation rule
		{
			path: 'Compressed/Bookmarks/Web/Tools/Browser/note.md',
			folder: COMPRESSED,
			tags: [tagFor('bm/web-tools-browser')],
			note: 'aggregation: full path joined with `-` after entry.',
		},
		{
			path: 'Compressed/Bookmarks/Code/Editor/note.md',
			folder: COMPRESSED,
			tags: [tagFor('bm/code-editor')],
		},

		// truncation aggregate rule
		{
			path: 'Compressed/Clips/Web/Tutorials/React/Hooks/note.md',
			folder: { ...COMPRESSED, subdivisionDepth: 2 },
			tags: [tagFor('tagg/web/tutorials/react-hooks')],
			note: "truncation:aggregate(2): depth 2 preserved, deeper joined with '-'.",
		},
		{
			path: 'Compressed/Clips/Web/Tutorials/note.md',
			folder: { ...COMPRESSED, subdivisionDepth: 2 },
			tags: [tagFor('tagg/web/tutorials')],
			note: 'At depth 2 — no aggregation needed.',
		},

		// truncation flatten rule
		{
			path: 'Compressed/Snippets/Code/Languages/Python/Dataframes/note.md',
			folder: { ...COMPRESSED, subdivisionDepth: 2 },
			tags: [tagFor('tflat/code/languages/dataframes')],
			note: 'truncation:flatten(2): keep depth 2 (Code, Languages), then leaf only (Dataframes).',
		},
	],
	rules: [AGG_RULE, TAGG_RULE, TFLAT_RULE],
};

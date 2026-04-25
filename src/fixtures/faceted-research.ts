/**
 * Faceted Research — post-coordination.
 *
 * Each note's path embeds independent facets (topic / author / year). Each
 * facet becomes its own flat tag rather than a hierarchical one. This is
 * the canonical case for `post-coordination` transfer: a folder hierarchy
 * exists for filing convenience, but the user wants to filter by ANY
 * single facet and have all such notes show up — which only works with
 * flat per-facet tags.
 *
 * Library-science framing: post-coordinated descriptors apply concepts as
 * separate terms, so a note can be about kahneman AND cognition AND 2024
 * without committing to a fused subordination order.
 */

import type { FixtureFramework, FolderClassifier, HierarchyTransferRule, TypedTag } from './types';

const FACETED: FolderClassifier = {
	axes: ['work'],
	scheme: 'faceted',
	naming: 'word',
	subdivisionDepth: 'unbounded',
	siblingUniformity: 'unique',
};

const facetTag = (name: string): TypedTag => ({
	name,
	vocab: {
		axis: 'relation',
		coordination: 'post-coordinated',
		prefixMarker: null,
		authority: 'tag-authoritative',
	},
});

const RULE: HierarchyTransferRule = {
	id: 'fr-post-coordinate',
	name: 'Faceted Research: split path into independent flat tags',
	description: 'Research/<topic>/<author>/<year>/<note>.md → #<topic> + #<author> + #<year>',
	priority: 10,
	direction: 'folder-to-tag',
	folder: FACETED,
	tag: { axis: 'relation', coordination: 'post-coordinated', prefixMarker: null, authority: 'tag-authoritative' },
	transfer: { op: 'post-coordination' },
	// Inverse is undefined in the "general" sense — many tags can't reconstruct
	// one folder. We use flattening-to-leaf as a degenerate inverse: only the
	// "leaf" tag (last in declaration order) places the file. Real users
	// rarely want bidirectional sync on post-coordinated rules.
	inverseTransfer: { op: 'flattening-to-leaf' },
	cardinality: '1:many',
	bijective: false,
	folderPattern: '^Research/',
	tagPattern: '^[a-z][a-z0-9-]*$',
	folderEntryPoint: 'Research',
	tagEntryPoint: '',
	folderTransforms: { caseTransform: 'Title Case' },
	tagTransforms: { caseTransform: 'kebab-case' },
	options: {
		createFolders: false,
		addTags: true,
		removeOrphanedTags: false,
		syncOnFileCreate: true,
		syncOnFileMove: true,
		syncOnFileRename: false,
		keepRelationTags: true,
		moveAttachments: false,
	},
	enabled: true,
};

export const FACETED_RESEARCH: FixtureFramework = {
	id: 'faceted-research',
	name: 'Faceted Research (post-coordination)',
	description: 'Topic/author/year facets emitted as N separate flat tags per note.',
	axesExercised: ['work', 'relation'],
	files: [
		{
			path: 'Research/Cognition/Kahneman/2024/note.md',
			folder: FACETED,
			tags: [facetTag('cognition'), facetTag('kahneman'), facetTag('2024')],
			note: 'Three facets → three independent flat tags.',
		},
		{
			path: 'Research/Robotics/Karpathy/2023/note.md',
			folder: FACETED,
			tags: [facetTag('robotics'), facetTag('karpathy'), facetTag('2023')],
			note: '"AI" or "ML" would be split into a-i / m-l by kebab-case (adjacent uppercase). Picked Robotics to avoid that orthogonal transformer-quirk concern.',
		},
		{
			path: 'Research/Attention/Newport/2016/note.md',
			folder: FACETED,
			tags: [facetTag('attention'), facetTag('newport'), facetTag('2016')],
		},
		{
			path: 'Research/Cognition/Sutton/2024/note.md',
			folder: FACETED,
			tags: [facetTag('cognition'), facetTag('sutton'), facetTag('2024')],
			note: 'Sharing facets with another file demonstrates the post-coordination filter benefit.',
		},
	],
	rules: [RULE],
};

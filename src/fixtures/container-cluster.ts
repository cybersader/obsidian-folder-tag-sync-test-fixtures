/**
 * Container Cluster — opaque + promotion-to-root + flattening-to-leaf.
 *
 * Library-science framing: not every folder is a classification point. Some
 * folders just GROUP content. Three flavors of grouping:
 *
 *   - opaque:               folder exists for filing, emits no tag
 *                           (canonical: Attachments/, Drafts/)
 *   - promotion-to-root:    only the FIRST segment after the entry is the tag —
 *                           "this note belongs to project X" without committing
 *                           to the inner subdivision
 *   - flattening-to-leaf:   only the LAST segment (leaf folder) is the tag —
 *                           leaf-name indexing, ancestry discarded
 *
 * Each is many:1 (multiple inner shapes collapse to one tag, or to none),
 * and each is non-bijective by definition. Together they exercise the three
 * "less than identity" projections that classification theory has names for.
 */

import type { FixtureFramework, FolderClassifier, HierarchyTransferRule, TypedTag } from './types';

const ATTACHMENTS_CLUSTER: FolderClassifier = {
	axes: ['system'],
	scheme: 'container-only',
	naming: 'word',
	subdivisionDepth: 'unbounded',
	siblingUniformity: 'unique',
};

const PROJECTS_CLUSTER: FolderClassifier = {
	axes: ['work'],
	scheme: 'container-only',
	naming: 'word',
	subdivisionDepth: 'unbounded',
	siblingUniformity: 'parallel',
};

const TEMPLATES_CLUSTER: FolderClassifier = {
	axes: ['system'],
	scheme: 'container-only',
	naming: 'word',
	subdivisionDepth: 'unbounded',
	siblingUniformity: 'unique',
};

const workTag = (name: string): TypedTag => ({
	name,
	vocab: { axis: 'work', coordination: 'pre-coordinated', prefixMarker: null, authority: 'mutual' },
});
const sysTag = (name: string): TypedTag => ({
	name,
	vocab: { axis: 'system', coordination: 'pre-coordinated', prefixMarker: null, authority: 'mutual' },
});

// ─── Three rules, three projection modes ─────────────────────────────────

const OPAQUE_RULE: HierarchyTransferRule = {
	id: 'cc-opaque',
	name: 'Container: opaque (Attachments/)',
	description: 'Files under Attachments/ get no derived tag. Folder is purely organizational.',
	priority: 10,
	direction: 'folder-to-tag',
	folder: ATTACHMENTS_CLUSTER,
	tag: { axis: 'system', coordination: 'flat-keyword', prefixMarker: null, authority: 'tag-authoritative' },
	transfer: { op: 'opaque' },
	inverseTransfer: { op: 'opaque' },
	cardinality: 'many:1',
	bijective: false,
	folderPattern: '^Container/Attachments/',
	tagPattern: '^$', // no tag side
	folderEntryPoint: 'Container/Attachments',
	tagEntryPoint: '',
	folderTransforms: { caseTransform: 'Title Case' },
	tagTransforms: { caseTransform: 'none' },
	options: { createFolders: false, addTags: false, removeOrphanedTags: false, syncOnFileCreate: false, syncOnFileMove: false, syncOnFileRename: false },
	enabled: true,
};

const PROMOTE_RULE: HierarchyTransferRule = {
	id: 'cc-promotion-to-root',
	name: 'Container: promotion-to-root (Drafts/<project>/...)',
	description: 'Drafts/<project>/<inner>/<more>/note.md → #drafts/<project> only. Inner structure lost.',
	priority: 11,
	direction: 'folder-to-tag',
	folder: PROJECTS_CLUSTER,
	tag: { axis: 'work', coordination: 'pre-coordinated', prefixMarker: null, authority: 'mutual' },
	transfer: { op: 'promotion-to-root' },
	inverseTransfer: { op: 'promotion-to-root' },
	cardinality: 'many:1',
	bijective: false,
	folderPattern: '^Container/Drafts/',
	tagPattern: '^drafts/',
	folderEntryPoint: 'Container/Drafts',
	tagEntryPoint: 'drafts',
	folderTransforms: { caseTransform: 'Title Case' },
	tagTransforms: { caseTransform: 'kebab-case' },
	options: { createFolders: false, addTags: true, removeOrphanedTags: false, syncOnFileCreate: true, syncOnFileMove: true, syncOnFileRename: false },
	enabled: true,
};

const FLATTEN_RULE: HierarchyTransferRule = {
	id: 'cc-flattening-to-leaf',
	name: 'Container: flattening-to-leaf (Templates/<cat>/<item>)',
	description: 'Templates/<category>/<item>/<...>/note.md → #templates/<leaf> only. Ancestry lost.',
	priority: 12,
	direction: 'folder-to-tag',
	folder: TEMPLATES_CLUSTER,
	tag: { axis: 'system', coordination: 'pre-coordinated', prefixMarker: null, authority: 'mutual' },
	transfer: { op: 'flattening-to-leaf' },
	inverseTransfer: { op: 'flattening-to-leaf' },
	cardinality: 'many:1',
	bijective: false,
	folderPattern: '^Container/Templates/',
	tagPattern: '^templates/',
	folderEntryPoint: 'Container/Templates',
	tagEntryPoint: 'templates',
	folderTransforms: { caseTransform: 'Title Case' },
	tagTransforms: { caseTransform: 'kebab-case' },
	options: { createFolders: false, addTags: true, removeOrphanedTags: false, syncOnFileCreate: true, syncOnFileMove: true, syncOnFileRename: false },
	enabled: true,
};

export const CONTAINER_CLUSTER: FixtureFramework = {
	id: 'container-cluster',
	name: 'Container Cluster (opaque + promotion + flattening)',
	description: 'Three "less than identity" projections — folders that group rather than fully classify. Lossy by design.',
	axesExercised: ['system', 'work'],
	files: [
		// opaque rule — no derived tags
		{
			path: 'Container/Attachments/screenshots/2026/04/img.md',
			folder: ATTACHMENTS_CLUSTER,
			tags: [], // opaque emits NOTHING
			note: 'opaque: folder is purely organizational; no tag is derived.',
		},
		{
			path: 'Container/Attachments/diagrams/architecture.md',
			folder: ATTACHMENTS_CLUSTER,
			tags: [],
		},

		// promotion-to-root rule — only first segment
		{
			path: 'Container/Drafts/MyProject/SubArea/note.md',
			folder: PROJECTS_CLUSTER,
			tags: [workTag('drafts/my-project')],
			note: 'promotion-to-root: only "MyProject" survives; SubArea is dropped.',
		},
		{
			path: 'Container/Drafts/SideQuest/Phase1/details.md',
			folder: PROJECTS_CLUSTER,
			tags: [workTag('drafts/side-quest')],
		},

		// flattening-to-leaf rule — only leaf segment
		{
			path: 'Container/Templates/Notes/Daily/today.md',
			folder: TEMPLATES_CLUSTER,
			tags: [sysTag('templates/daily')],
			note: 'flattening-to-leaf: only "Daily" (the leaf) survives; "Notes" is dropped.',
		},
		{
			path: 'Container/Templates/Meetings/Standup/Recurring/agenda.md',
			folder: TEMPLATES_CLUSTER,
			tags: [sysTag('templates/recurring')],
			note: 'Three levels of folder ancestry collapse to just the leaf.',
		},
	],
	rules: [OPAQUE_RULE, PROMOTE_RULE, FLATTEN_RULE],
};

import { type } from 'arktype';

export const NodeProvenance = type.enumerated(
	'metadata.json',
	'metadata.csv',
	'images.cropped',
	'images.original'
);

/**
 * @import {MaybeLoading} from '$lib/LoadingText.svelte';
 */

/**
 * @typedef {typeof NodeProvenance.infer} NodeProvenance
 */
/**
 * @typedef {object} TreeLeaf
 * @property {string} filename
 * @property {string} help
 * @property {NodeProvenance} provenance
 */

/**
 * @typedef {Array<TreeLeaf | { folder: string; icon?: import('svelte').Component; children: TreeLeaf[] }>} TreeNode
 */

/**
 * @typedef {Array<MaybeLoading<TreeLeaf> | { folder: MaybeLoading<string>; icon?: import('svelte').Component; children: Array<MaybeLoading<TreeLeaf>> }>} TreeNodeMaybeLoading
 */

/**
 * Add new paths to the given tree (in-place).
 * @param {object} arg
 * @param {TreeNode} arg.tree
 * @param {string[]} arg.paths
 * @param {boolean} [arg.isDirectory=false] whether the path is a directory
 * @param {string} [arg.help]
 * @param {NodeProvenance} arg.provenance
 */
export function gatherToTree({ tree, paths, provenance, isDirectory = false, help = '' }) {
	for (const path of paths) {
		const [current, ...deeper] = splitPath(path);
		if (deeper.length === 0) {
			if (isDirectory) {
				tree.push({ folder: current, provenance, children: [] });
			} else {
				tree.push({ filename: current, help, provenance });
			}
			return;
		}

		let folder = tree.find((f) => 'folder' in f && f.folder === current);
		if (!folder) {
			tree.push({ folder: current, children: [] });
			folder = tree[tree.length - 1];
		}

		if (!('children' in folder)) {
			throw new Error(`Expected folder "${current}" to have a children array`);
		}

		gatherToTree({
			tree: folder.children,
			paths: [deeper.join('/')],
			provenance,
			help
		});
	}
}

/**
 * Split a path into parts (directory and basename), ignoring slashes inside {{}}
 * @param {string} path
 * @returns {string[]} fragments
 */
function splitPath(path) {
	let fragments = [];
	let fragment = '';
	let chars = path.split('');
	let insideBraces = false;

	/** @type {string} */
	let char;
	let previousChar = '';

	while (chars.length > 0) {
		// chars.length > 0 implies !undefined
		char = chars.shift() ?? '';

		if (char === '{' && previousChar === '{') {
			insideBraces = true;
		}

		if (insideBraces && char === '}' && previousChar === '}') {
			insideBraces = false;
		}

		if (!insideBraces && char === '/') {
			if (fragment) fragments.push(fragment);
			fragment = '';
		} else {
			fragment += char;
		}

		previousChar = char;
	}

	if (fragment) fragments.push(fragment);

	return fragments;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('splitPath', () => {
		it('should split a path into directory and basename', () => {
			expect(splitPath('/path/to/file.txt')).toEqual(['path', 'to', 'file.txt']);
			expect(splitPath('file.txt')).toEqual(['file.txt']);
			expect(splitPath('/path/to/')).toEqual(['path', 'to']);
			expect(splitPath('/path/with/{braces}/file.txt')).toEqual([
				'path',
				'with',
				'{braces}',
				'file.txt'
			]);
			expect(splitPath('/path/with/{{double-braces}}/file.txt')).toEqual([
				'path',
				'with',
				'{{double-braces}}',
				'file.txt'
			]);
			expect(splitPath('/path/with/{braces}/and/some/{{ 2 / 0 }}/file.txt')).toEqual([
				'path',
				'with',
				'{braces}',
				'and',
				'some',
				'{{ 2 / 0 }}',
				'file.txt'
			]);
			expect(
				splitPath('/path/with/{{double-braces}}/and/some/more/{{fallback file "/"}}.txt')
			).toEqual([
				'path',
				'with',
				'{{double-braces}}',
				'and',
				'some',
				'more',
				'{{fallback file "/"}}.txt'
			]);
		});
	});

	describe('gatherToTree', () => {
		it('should gather paths into a tree structure', () => {
			/** @type {TreeNode} */
			const tree = [];
			gatherToTree({
				tree,
				paths: ['images/cropped/{observation.id}/{image.exportedAs.original}'],
				provenance: 'images.cropped',
				help: 'Cropped image'
			});
			gatherToTree({
				tree,
				paths: ['images/original/{observation.id}/{image.exportedAs.original}'],
				provenance: 'images.original',
				help: 'Original image'
			});
			gatherToTree({
				tree,
				paths: ['metadata.json'],
				provenance: 'metadata.json',
				help: 'Metadata in JSON format'
			});
			gatherToTree({
				tree,
				paths: ['metadata.csv'],
				provenance: 'metadata.csv',
				help: 'Metadata in CSV format'
			});
			expect(tree).toEqual([
				{
					folder: 'images',
					children: [
						{
							folder: 'cropped',
							children: [
								{
									folder: '{observation.id}',
									children: [
										{
											filename: '{image.exportedAs.original}',
											help: 'Cropped image',
											provenance: 'images.cropped'
										}
									]
								}
							]
						},
						{
							folder: 'original',
							children: [
								{
									folder: '{observation.id}',
									children: [
										{
											filename: '{image.exportedAs.original}',
											help: 'Original image',
											provenance: 'images.original'
										}
									]
								}
							]
						}
					]
				},
				{
					filename: 'metadata.json',
					help: 'Metadata in JSON format',
					provenance: 'metadata.json'
				},
				{
					filename: 'metadata.csv',
					help: 'Metadata in CSV format',
					provenance: 'metadata.csv'
				}
			]);
		});
	});
}

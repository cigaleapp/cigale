/**
 * @typedef {`metadata.${'json'|'csv'}`|`images.${'cropped'|'original'}`} NodeProvenance
 */
/**
 * @typedef {object} TreeLeaf
 * @property {string} filename
 * @property {string} help
 * @property {NodeProvenance} provenance
 *
 * @typedef {Array<TreeLeaf | { folder: string; icon?: import('svelte').Component; children: TreeLeaf[] }>} TreeNode
 */

/**
 * Add a new path to the given tree (in-place).
 * @param {object} arg
 * @param {TreeNode} arg.tree
 * @param {string} arg.path
 * @param {boolean} [arg.isDirectory=false] whether the path is a directory
 * @param {string} [arg.help]
 * @param {NodeProvenance} arg.provenance
 */
export function gatherToTree({ tree, path, provenance, isDirectory = false, help = '' }) {
	console.log('gatherToTree', { tree, path, provenance, isDirectory, help });
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
		path: deeper.join('/'),
		provenance,
		help
	});
}

/**
 * Split a path into parts (directory and basename), ignoring slashes inside {{}}
 * @param {string} path
 * @returns {string[]} fragments
 */
export function splitPath(path) {
	let fragments = [];
	let fragment = '';
	let chars = path.split('');
	let previousChar = '';
	let char = '';
	let insideBraces = false;

	while (chars.length > 0) {
		// @ts-expect-error chars.length > 0 implies !undefined
		char = chars.shift();

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
}

import PO from 'pofile';

if (import.meta.main) {
	for (const path of process.argv.slice(2)) {
		console.info(`Sorting ${path}...`);
		await processFile(path);
	}
}

/**
 *
 * @param {string} filepath
 */
async function processFile(filepath) {
	const po = await Bun.file(filepath).text().then(PO.parse);

	po.items.sort(comparator((item) => [item.msgid, item.msgctxt, item.obsolete]));
	for (let i = 0; i < po.items.length; i++) {
		const before = [...po.items[i].references];
		po.items[i].references.sort();
	}

	await Bun.write(filepath, po.toString());

	/**
	 * @template T
	 * @param {(item: T) => Array<string | number>} keyFn
	 * @returns {(a: T, b: T) => number}
	 */
	function comparator(keyFn) {
		return (a, b) => {
			const aKeys = keyFn(a);
			const bKeys = keyFn(b);

			// Get first candidate key where a and b differ
			const [aKey, bKey] =
				Array.from({ length: Math.min(aKeys.length, bKeys.length) }).find(
					(_, i) => aKeys[i] !== bKeys[i]
				) ?? [];

			if (typeof aKey === 'number' && typeof bKey === 'number') {
				return aKey - bKey;
			}

			if (typeof aKey === 'number') return -1;
			if (typeof bKey === 'number') return 1;

			return String(aKey).localeCompare(String(bKey));
		};
	}
}

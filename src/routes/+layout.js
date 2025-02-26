import { BUILTIN_METADATA } from '$lib/database';
import { tables } from '$lib/idb';
import { getSetting } from '$lib/settings';

export async function load({ url }) {
	await fillBuiltinData(url);
	return {
		showInputHints: await getSetting('showInputHints')
	};
}

/**
 * @param {URL} url the url of the page we're requesting this on
 */
async function fillBuiltinData(url) {
	await Promise.all([
		...BUILTIN_METADATA.map(tables.Metadata.set),
		tables.Settings.set({
			layer: 'defaults',
			protocols: [],
			theme: 'auto',
			gridSize: 10,
			language: 'fr',
			showInputHints: true
		}),
		tables.Protocol.set({
			id: 'test',
			name: 'Test',
			source: url.href,
			authors: [],
			metadata: BUILTIN_METADATA.map(({ id }) => id)
		})
	]);
}

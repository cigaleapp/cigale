import { BUILTIN_METADATA } from '$lib/database';
import { tables } from '$lib/idb';
import { getSetting } from '$lib/settings';

export async function load() {
	await fillBuiltinData();
	return {
		showInputHints: await getSetting('showInputHints')
	};
}

async function fillBuiltinData() {
	await Promise.allSettled([
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
			source: null,
			author: { email: '', name: '' },
			metadata: BUILTIN_METADATA.map(({ id }) => id)
		})
	]);
}

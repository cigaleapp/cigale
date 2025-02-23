import { BUILTIN_METADATA } from '$lib/database';
import { set } from '$lib/idb';
import { getSetting } from '$lib/settings';

export async function load() {
	await fillBuiltinData();
	return {
		showInputHints: await getSetting('showInputHints')
	};
}

async function fillBuiltinData() {
	await Promise.allSettled([
		...BUILTIN_METADATA.map(async (m) => set('Metadata', m)),
		set('Settings', {
			layer: 'defaults',
			protocols: [],
			theme: 'auto',
			gridSize: 10,
			language: 'fr',
			showInputHints: true
		})
	]);
}

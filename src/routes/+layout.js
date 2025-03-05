import { BUILTIN_METADATA } from '$lib/database.js';
import { tables } from '$lib/idb.svelte.js';
import { getSetting } from '$lib/settings.svelte.js';
import { defineSpeciesMetadata } from '$lib/species.js';

export async function load() {
	await tables.initialize();
	await fillBuiltinData();
	await defineSpeciesMetadata('species');
	await tables.initialize();
	return {
		showInputHints: await getSetting('showInputHints')
	};
}

async function fillBuiltinData() {
	await Promise.all([
		...BUILTIN_METADATA.map(tables.Metadata.set),
		tables.Protocol.set({
			id: 'test',
			metadata: [...BUILTIN_METADATA.map((m) => m.id), 'species'],
			authors: [
				{ name: 'Feur', email: 'gwenn.elbikergre@gmai.com' },
				{ name: 'Incofeurgniote', email: 'igriuojgr@fokejofe.com' }
			],
			name: 'Test',
			source: 'https://gwen.works'
		}),
		tables.Settings.set({
			id: 'defaults',
			protocols: [],
			theme: 'auto',
			gridSize: 10,
			language: 'fr',
			showInputHints: true
		})
	]);
}

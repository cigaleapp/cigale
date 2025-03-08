import { dev } from '$app/environment';
import { BUILTIN_METADATA } from '$lib/database.js';
import { error } from '@sveltejs/kit';
import { tables } from '$lib/idb.svelte.js';
import { defineSpeciesMetadata } from '$lib/species.js';

export async function load() {
	try {
		await tables.initialize();
		await fillBuiltinData();
		await defineSpeciesMetadata('species');
		await tables.initialize();
	} catch (e) {
		console.error(e);
		error(400, {
			message: e?.toString() ?? 'Erreur inattendue'
		});
	}
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
			showInputHints: true,
			showTechnicalMetadata: dev
		})
	]);
}

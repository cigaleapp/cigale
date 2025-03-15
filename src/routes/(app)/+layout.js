import { dev } from '$app/environment';
import { BUILTIN_METADATA } from '$lib/database.js';
import { error } from '@sveltejs/kit';
import { openTransaction, tables } from '$lib/idb.svelte.js';
import { defineSpeciesMetadata } from '$lib/species.svelte.js';

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
	await openTransaction(['Metadata', 'Protocol', 'Settings'], {}, (tx) => {
		for (const metadata of BUILTIN_METADATA) {
			tx.objectStore('Metadata').put(metadata);
		}
		tx.objectStore('Protocol').put({
			id: 'test',
			metadata: [...BUILTIN_METADATA.map((m) => m.id), 'species'],
			authors: [
				{ name: 'Feur', email: 'gwenn.elbikergre@gmai.com' },
				{ name: 'Incofeurgniote', email: 'igriuojgr@fokejofe.com' }
			],
			exports: {
				images: {
					cropped:
						'{{ default image.metadata.species.valueLabel "(Unknown)" }}/{{ observation.label }}/{{ suffix image.filename "_cropped" }}',
					original:
						'{{ default image.metadata.species.valueLabel "(Unknown)" }}/{{ observation.label }}/{{ suffix image.filename "_original" }}'
				},
				metadata: {
					json: 'analysis.json',
					csv: 'metadata.csv'
				}
			},
			name: 'Test',
			source: 'https://gwen.works'
		});
		tx.objectStore('Settings').put({
			id: 'defaults',
			protocols: [],
			theme: 'auto',
			gridSize: 10,
			language: 'fr',
			showInputHints: true,
			showTechnicalMetadata: dev
		});
	});
}

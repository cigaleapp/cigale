import { tables } from './idb.svelte.js';
import { torawpath } from './inference.js';
import { initializeTaxonomy } from './taxonomy.js';

/**
 *
 * @param {string} id
 */
export async function defineSpeciesMetadata(id) {
	const names = await fetch(torawpath('class_mapping.txt'))
		.then((res) => res.text())
		.then((text) => text.split('\n'));

	await tables.Metadata.set({
		id,
		description: '',
		label: 'Espèce',
		mergeMethod: 'max',
		required: false,
		type: 'enum',
		options: names.filter(Boolean).map((name, i) => ({
			key: i.toString(),
			label: name,
			description: '',
			learnMore: `https://en.wikipedia.org/wiki/${encodeURIComponent(name)}`
		}))
	});

	const taxonomy = await initializeTaxonomy();

	await tables.Metadata.do((tx) => {
		const kingdoms = [...new Set(Object.values(taxonomy.items).map((t) => t.kingdom))];

		tx.put({
			id: 'kingdom',
			description: '',
			label: 'Règne',
			mergeMethod: 'max',
			required: false,
			type: 'enum',
			options: kingdoms.map((name, i) => ({
				key: i.toString(),
				label: name,
				description: '',
				learnMore: `https://en.wikipedia.org/wiki/${encodeURIComponent(name)}`
			}))
		});

		const phyla = [...new Set(Object.values(taxonomy.items).map((t) => t.phylum))];

		tx.put({
			id: 'phylum',
			description: '',
			label: 'Phylum',
			mergeMethod: 'max',
			required: false,
			type: 'enum',
			options: phyla.map((name, i) => ({
				key: i.toString(),
				label: name,
				description: '',
				learnMore: `https://en.wikipedia.org/wiki/${encodeURIComponent(name)}`
			}))
		});

		const classes = [...new Set(Object.values(taxonomy.items).map((t) => t.class))];

		tx.put({
			id: 'class',
			description: '',
			label: 'Classe',
			mergeMethod: 'max',
			required: false,
			type: 'enum',
			options: classes.map((name, i) => ({
				key: i.toString(),
				label: name,
				description: '',
				learnMore: `https://en.wikipedia.org/wiki/${encodeURIComponent(name)}`
			}))
		});

		const orders = [...new Set(Object.values(taxonomy.items).map((t) => t.order))];

		tx.put({
			id: 'order',
			description: '',
			label: 'Ordre',
			mergeMethod: 'max',
			required: false,
			type: 'enum',
			options: orders.map((name, i) => ({
				key: i.toString(),
				label: name,
				description: '',
				learnMore: `https://en.wikipedia.org/wiki/${encodeURIComponent(name)}`
			}))
		});

		const families = [...new Set(Object.values(taxonomy.items).map((t) => t.family))];

		tx.put({
			id: 'family',
			description: '',
			label: 'Famille',
			mergeMethod: 'max',
			required: false,
			type: 'enum',
			options: families.map((name, i) => ({
				key: i.toString(),
				label: name,
				description: '',
				learnMore: `https://en.wikipedia.org/wiki/${encodeURIComponent(name)}`
			}))
		});

		const genera = [...new Set(Object.values(taxonomy.items).map((t) => t.genus))];

		tx.put({
			id: 'genus',
			description: '',
			label: 'Genre',
			mergeMethod: 'max',
			required: false,
			type: 'enum',
			options: genera.map((name, i) => ({
				key: i.toString(),
				label: name,
				description: '',
				learnMore: `https://en.wikipedia.org/wiki/${encodeURIComponent(name)}`
			}))
		});
	});
}

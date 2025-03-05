import { tables } from './idb.svelte.js';

/**
 *
 * @param {string} id
 */
export async function defineSpeciesMetadata(id) {
	const names = await fetch(
		`https://git.inpt.fr/api/v4/projects/cigale%2Fapp/repository/files/models%2Fclass_mapping.txt/raw?lfs=true`
	)
		.then((res) => res.text())
		.then((text) => text.split('\n'));

	await tables.Metadata.set({
		id,
		description: "L'espèce de l'individu",
		label: 'Espèce',
		mergeMethod: 'max',
		required: false,
		type: 'enum',
		options: names.filter(Boolean).map((name, i) => ({
			key: i.toString(),
			label: name,
			description: ''
		}))
	});
}

import { BUILTIN_METADATA_IDS } from './database.js';
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

/** @param {undefined | import('./metadata.js').RuntimeValue} key  */
export function speciesDisplayName(key) {
	if (!key) return undefined;

	const options = $state.snapshot(
		tables.Metadata.state.find((m) => m.id === BUILTIN_METADATA_IDS.species)?.options
	);

	return options?.find((o) => o.key === key?.toString())?.label ?? key?.toString();
}

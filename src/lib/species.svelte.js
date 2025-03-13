import { BUILTIN_METADATA_IDS } from './database.js';
import { tables } from './idb.svelte.js';
import { torawpath } from './inference.js';

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
		description: "L'espèce de l'individu",
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
}

/** @param {undefined | import('./metadata.js').RuntimeValue} key  */
export function speciesDisplayName(key) {
	if (key === undefined) return undefined;

	const options = $state.snapshot(
		tables.Metadata.state.find((m) => m.id === BUILTIN_METADATA_IDS.species)?.options
	);

	return options?.find((o) => o.key === key?.toString())?.label ?? key?.toString();
}

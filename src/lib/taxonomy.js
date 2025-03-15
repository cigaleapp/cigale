import { type } from 'arktype';
import { keyOfEnumLabel, labelOfEnumKey, storeMetadataValue } from './metadata';
import { BUILTIN_METADATA_IDS } from './database';
import { openTransaction } from './idb.svelte';

export const Taxon = type({
	gbifId: 'number.integer',
	'gbifBackboneId?': 'number.integer',
	kingdom: 'string',
	phylum: 'string',
	order: 'string',
	family: 'string',
	species: 'string',
	genus: 'string',
	accepted: 'boolean',
	'notAcceptedWhy?': type.enumerated(
		'DOUBTFUL',
		'SYNONYM',
		'HETEROTYPIC_SYNONYM',
		'HOMOTYPIC_SYNONYM',
		'PROPARTE_SYNONYM',
		'MISAPPLIED'
	)
});

export const Taxonomy = type({ '[string]': Taxon });

/**
 * @type {typeof Taxonomy.infer}
 */
let _taxonomy = {};

/**
 * @import { IDBTransactionWithAtLeast } from './idb.svelte.js'
 * @import { RuntimeValue } from './metadata.js'
 */

/**
 *
 * @param {object} options
 * @param {string} options.subjectId id de l'image ou l'observation
 * @param {RuntimeValue<'enum'>} options.species l'espèce choisie/détectée
 * @param {number} [options.confidence=1] la confiance dans la valeur (proba que ce soit la bonne valeur)
 * @param {IDBTransactionWithAtLeast<["Image", "Observation"]>} [options.tx] transaction IDB pour effectuer plusieurs opérations d'un coup
 * @param {Array<{ value: RuntimeValue<'enum'>; confidence: number }>} [options.alternatives=[]] les autres valeurs possibles
 */
export async function setSpeciesWithLineage({ subjectId, species, confidence, alternatives, tx }) {
	await openTransaction(['Image', 'Observation'], { tx }, async (tx) => {
		await storeMetadataValue({
			tx,
			subjectId,
			metadataId: BUILTIN_METADATA_IDS.species,
			value: species,
			confidence,
			alternatives
		});

		const speciesName = await labelOfEnumKey(BUILTIN_METADATA_IDS.species, species);
		if (!speciesName) {
			throw new Error(`Species ${species} not found in taxonomy`);
		}
		const lineage = await lineageOfSpecies(speciesName);

		/**
		 *
		 * @param {string} id
		 * @param {string} value
		 * @returns
		 */
		const store = async (id, value) => {
			const key = await keyOfEnumLabel(id, value);
			if (!key) throw new Error(`Value ${value} not found in metadata ${id}`);
			await storeMetadataValue({ tx, subjectId, metadataId: id, value: key });
		};

		await store(BUILTIN_METADATA_IDS.kingdom, lineage.kingdom);
		await store(BUILTIN_METADATA_IDS.phylum, lineage.phylum);
		await store(BUILTIN_METADATA_IDS.order, lineage.order);
		await store(BUILTIN_METADATA_IDS.family, lineage.family);
		await store(BUILTIN_METADATA_IDS.genus, lineage.genus);
	});
}

/**
 * @param {string} species
 * @returns {Promise<typeof Taxon.infer>} The lineage of the species: kingdom, phylum, order, family, genus, species
 */
export async function lineageOfSpecies(species) {
	await ensureTaxonomyInitialized();
	const taxon = _taxonomy[species];
	if (!taxon) {
		throw new Error(`Species ${species} not found in taxonomy`);
	}
	return taxon;
}

export async function ensureTaxonomyInitialized() {
	if (Object.keys(_taxonomy).length === 0) {
		await initializeTaxonomy();
	}
}

export async function initializeTaxonomy() {
	const data = await fetch('/taxonomy.json').then((response) => response.json());
	_taxonomy = Taxonomy.assert(data);
	return _taxonomy;
}

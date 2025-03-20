import { type } from 'arktype';
import { BUILTIN_METADATA_IDS } from './builtins.js';

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
	'notAcceptedWhy?': 'string'
});

export const Taxonomy = type({
	items: Taxon.array(),
	phyla: type({ '[string]': 'string' }).describe('phyla -> kingdoms'),
	orders: type({ '[string]': 'string' }).describe('orders -> phyla'),
	families: type({ '[string]': 'string' }).describe('families -> orders'),
	genera: type({ '[string]': 'string' }).describe('genera -> families'),
	species: type({ '[string]': 'string' }).describe('species -> genera')
});

/**
 * In order of less to more specific
 */
export const CLADE_METADATA_IDS = /** @type {const} */ ([
	BUILTIN_METADATA_IDS.kingdom,
	BUILTIN_METADATA_IDS.phylum,
	BUILTIN_METADATA_IDS.order,
	BUILTIN_METADATA_IDS.family,
	BUILTIN_METADATA_IDS.genus,
	BUILTIN_METADATA_IDS.species
]);

/**
 * Map singular-case clade names to their plural-case names, as used in the taxonomy object
 */
export const CLADE_METADATA_IDS_PLURAL = /** @type {const} */ ({
	[BUILTIN_METADATA_IDS.kingdom]: 'kingdom',
	[BUILTIN_METADATA_IDS.phylum]: 'phyla',
	[BUILTIN_METADATA_IDS.order]: 'orders',
	[BUILTIN_METADATA_IDS.family]: 'families',
	[BUILTIN_METADATA_IDS.genus]: 'genera',
	[BUILTIN_METADATA_IDS.species]: 'species'
});

export const Clade = type.enumerated(...CLADE_METADATA_IDS);

/**
 * @type {typeof Taxonomy.infer}
 */
let _taxonomy = {
	species: {},
	phyla: {},
	orders: {},
	families: {},
	genera: {},
	items: []
};

/**
 * @import { IDBTransactionWithAtLeast } from './idb.svelte.js'
 * @import { RuntimeValue } from './metadata.js'
 */

/**
 *
 * @param {object} options
 * @param {string} options.subjectId id de l'image ou l'observation
 * @param {typeof Clade.infer} options.clade le clade à définir
 * @param {RuntimeValue<'enum'>} options.value l'espèce choisie/détectée
 * @param {number} [options.confidence=1] la confiance dans la valeur (proba que ce soit la bonne valeur)
 * @param {IDBTransactionWithAtLeast<["Image", "Observation"]>} [options.tx] transaction IDB pour effectuer plusieurs opérations d'un coup
 * @param {Array<{ value: RuntimeValue<'enum'>; confidence: number }>} [options.alternatives=[]] les autres valeurs possibles
 */
export async function setTaxonAndInferParents({
	subjectId,
	clade,
	value,
	confidence,
	alternatives,
	tx
}) {
	const { openTransaction } = await import('./idb.svelte.js');
	const { keyOfEnumLabel, labelOfEnumKey, storeMetadataValue } = await import('./metadata.js');

	await ensureTaxonomyInitialized();
	console.log(`Setting taxon on ${subjectId}: ${clade} = ${value}`);
	await storeMetadataValue({
		subjectId,
		metadataId: clade,
		value,
		confidence,
		alternatives
	});

	// Base case: kingdom clade
	if (clade === 'kingdom') return;

	// Recursive case: infer parent
	const parentClade = CLADE_METADATA_IDS[CLADE_METADATA_IDS.indexOf(clade) - 1];
	const valueName = await labelOfEnumKey(clade, value);
	if (!valueName) {
		throw new Error(`No ${clade} with key ${value} in taxonomy`);
	}
	const parentValueName = _taxonomy[CLADE_METADATA_IDS_PLURAL[clade]][valueName];
	if (!parentValueName) {
		throw new Error(`${valueName} has no ${parentClade} in taxonomy`);
	}

	const parentKey = await keyOfEnumLabel(parentClade, parentValueName);
	if (!parentKey) {
		throw new Error(`${parentValueName} not found in taxonomy`);
	}

	await setTaxonAndInferParents({
		subjectId,
		clade: parentClade,
		value: parentKey
	});
}

export async function ensureTaxonomyInitialized() {
	if (Object.keys(_taxonomy).length === 0) {
		await initializeTaxonomy();
	}
}

export async function initializeTaxonomy() {
	const { base } = await import('$app/paths');
	const data = await fetch(`${base}/taxonomy.json`).then((response) => response.json());
	_taxonomy = Taxonomy.assert(data);
	return _taxonomy;
}

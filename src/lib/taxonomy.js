import { type } from 'arktype';
import { BUILTIN_METADATA_IDS } from './builtins.js';

export const Taxon = type({
	gbifId: 'number.integer',
	'gbifBackboneId?': 'number.integer',
	kingdom: 'string',
	phylum: 'string',
	class: 'string',
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
	classes: type({ '[string]': 'string' }).describe('classes -> phyla'),
	orders: type({ '[string]': 'string' }).describe('orders -> class'),
	families: type({ '[string]': 'string' }).describe('families -> orders'),
	genera: type({ '[string]': 'string' }).describe('genera -> families'),
	species: type({ '[string]': 'string' }).describe('species -> genera')
});

/**
 * In order of less to more specific
 */
export const CLADE_NAMES_SINGULAR = /** @type {const} */ ([
	BUILTIN_METADATA_IDS.kingdom,
	BUILTIN_METADATA_IDS.phylum,
	BUILTIN_METADATA_IDS.class,
	BUILTIN_METADATA_IDS.order,
	BUILTIN_METADATA_IDS.family,
	BUILTIN_METADATA_IDS.genus,
	BUILTIN_METADATA_IDS.species
]);

/**
 * Map singular-case clade names to their plural-case names, as used in the taxonomy object
 */
export const CLADE_NAMES_PLURAL = /** @type {const} */ ({
	[BUILTIN_METADATA_IDS.kingdom]: 'kingdoms',
	[BUILTIN_METADATA_IDS.phylum]: 'phyla',
	[BUILTIN_METADATA_IDS.class]: 'classes',
	[BUILTIN_METADATA_IDS.order]: 'orders',
	[BUILTIN_METADATA_IDS.family]: 'families',
	[BUILTIN_METADATA_IDS.genus]: 'genera',
	[BUILTIN_METADATA_IDS.species]: 'species'
});

export const Clade = type.enumerated(...CLADE_NAMES_SINGULAR);
export const CladePlural = type.enumerated(...Object.values(CLADE_NAMES_PLURAL));

/**
 * @type {typeof Taxonomy.infer}
 */
let _taxonomy = {
	species: {},
	genera: {},
	families: {},
	orders: {},
	classes: {},
	phyla: {},
	items: []
};

/**
 * @import { IDBTransactionWithAtLeast } from './idb.svelte.js'
 * @import { RuntimeValue } from './metadata.js'
 */

/**
 *
 * @param {object} options
 * @param {import('$lib/database.js').Protocol} options.protocol le protocole utilisé
 * @param {string} options.subjectId id de l'image ou l'observation
 * @param {typeof Clade.infer} options.clade le clade à définir
 * @param {RuntimeValue<'enum'>} options.value l'espèce choisie/détectée
 * @param {number} [options.confidence=1] la confiance dans la valeur (proba que ce soit la bonne valeur)
 * @param {IDBTransactionWithAtLeast<["Image", "Observation"]>} [options.tx] transaction IDB pour effectuer plusieurs opérations d'un coup
 * @param {Array<{ value: RuntimeValue<'enum'>; confidence: number }>} [options.alternatives=[]] les autres valeurs possibles
 */
export async function setTaxonAndInferParents({
	protocol,
	subjectId,
	clade,
	value,
	confidence,
	alternatives
}) {
	const { keyOfEnumLabel, labelOfEnumKey, storeMetadataValue } = await import('./metadata.js');

	await ensureTaxonomyInitialized();
	console.log(`Setting taxon on ${subjectId}: ${clade} = ${value}`);
	await storeMetadataValue({
		subjectId,
		metadataId:
			(clade === protocol.inference?.classification?.taxonomic?.clade
				? protocol.inference?.classification?.metadata
				: protocol.inference?.classification?.taxonomic?.targets[
						CLADE_NAMES_PLURAL[clade]
					]) ?? BUILTIN_METADATA_IDS[clade],
		value,
		confidence,
		alternatives
	});

	// Base case: kingdom clade
	if (clade === 'kingdom') return;

	// Recursive case: infer parent
	const parentClade = CLADE_NAMES_SINGULAR[CLADE_NAMES_SINGULAR.indexOf(clade) - 1];
	const valueName = await labelOfEnumKey(clade, value);
	if (!valueName) {
		throw new Error(`No ${clade} with key ${value} in taxonomy`);
	}
	const parentValueName = _taxonomy[CLADE_NAMES_PLURAL[clade]][valueName];
	if (!parentValueName) {
		throw new Error(`${valueName} has no ${parentClade} in taxonomy`);
	}

	const parentKey = await keyOfEnumLabel(parentClade, parentValueName);
	if (!parentKey) {
		throw new Error(`${parentValueName} not found in taxonomy`);
	}

	await setTaxonAndInferParents({
		protocol,
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

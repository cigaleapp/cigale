import { type } from 'arktype';
import { BUILTIN_METADATA_IDS } from './builtins.js';
import { entries, invertRecord } from './utils.js';

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
 * @param {import('./database').Protocol} protocol
 * @param {string} metadataId id of the metadata to check
 */
export function isTaxonomicMetadata(protocol, metadataId) {
	// Check if it's the classification metadata target
	if (metadataId === protocol.inference?.classification?.metadata) return true;

	// Check if it's in the taxonomic targets
	if (
		Object.values(protocol.inference?.classification?.taxonomic?.targets ?? {}).includes(metadataId)
	)
		return true;

	return false;
}

/**
 *
 * @param {import('./database').Protocol} protocol
 * @param {string} metadataId
 * @returns {undefined | typeof Clade.infer}
 */
export function cladeRepresentedByMetadata(protocol, metadataId) {
	// If it's the classification metadata target, check taxonomic clade
	if (metadataId === protocol.inference?.classification?.metadata) {
		return protocol.inference?.classification?.taxonomic?.clade ?? 'species';
	}

	const defaultCladesMapping = {
		species: BUILTIN_METADATA_IDS.species,
		kingdoms: BUILTIN_METADATA_IDS.kingdom,
		phyla: BUILTIN_METADATA_IDS.phylum,
		classes: BUILTIN_METADATA_IDS.class,
		orders: BUILTIN_METADATA_IDS.order,
		families: BUILTIN_METADATA_IDS.family,
		genera: BUILTIN_METADATA_IDS.genus
	};

	// Get clade from taxonomic targets
	return entries({
		...defaultCladesMapping,
		...(protocol.inference?.classification?.taxonomic?.targets ?? {})
	})
		.map(([clade, metadata]) => ({
			clade: invertRecord(CLADE_NAMES_PLURAL)[clade],
			metadata
		}))
		.find(({ metadata }) => metadata === metadataId)?.clade;
}

/**
 *
 * @param {object} options
 * @param {import('$lib/database.js').Protocol} options.protocol le protocole utilisé
 * @param {string} options.subjectId id de l'image ou l'observation
 * @param {string} options.metadataId id de la métadonnée taxonomique
 * @param {RuntimeValue<'enum'>} options.value l'espèce choisie/détectée
 * @param {boolean} [options.manuallyModified=false] si la valeur a été modifiée manuellement
 * @param {number} [options.confidence=1] la confiance dans la valeur (proba que ce soit la bonne valeur)
 * @param {IDBTransactionWithAtLeast<["Image", "Observation"]>} [options.tx] transaction IDB pour effectuer plusieurs opérations d'un coup
 * @param {Array<{ value: RuntimeValue<'enum'>; confidence: number }>} [options.alternatives=[]] les autres valeurs possibles
 */
export async function setTaxonAndInferParents({
	protocol,
	subjectId,
	metadataId,
	value,
	confidence,
	alternatives,
	manuallyModified = false
}) {
	const { storeMetadataValue } = await import('./metadata.js');
	const { tables } = await import('./idb.svelte.js');

	// Get clade the metadata represents
	const clade = cladeRepresentedByMetadata(protocol, metadataId);
	if (!clade) {
		throw new Error(`Metadata ${metadataId} is not a taxonomic metadata`);
	}

	await ensureTaxonomyInitialized();
	console.log(`Setting taxon on ${subjectId}: ${clade} = ${value}`);

	const childCladeDef = await tables.Metadata.get(
		(clade === protocol.inference?.classification?.taxonomic?.clade
			? protocol.inference?.classification?.metadata
			: protocol.inference?.classification?.taxonomic?.targets[CLADE_NAMES_PLURAL[clade]]) ??
			BUILTIN_METADATA_IDS[clade]
	);
	if (!childCladeDef) {
		throw new Error(`No metadata definition for ${clade}`);
	}

	await storeMetadataValue({
		subjectId,
		metadataId: childCladeDef.id,
		value,
		confidence,
		alternatives,
		manuallyModified
	});

	// Base case: kingdom clade
	if (clade === 'kingdom') return;

	// Recursive case: infer parent
	const parentCladeName = CLADE_NAMES_SINGULAR[CLADE_NAMES_SINGULAR.indexOf(clade) - 1];

	const parentCladeDef = await tables.Metadata.get(
		protocol.inference?.classification?.taxonomic?.targets[CLADE_NAMES_PLURAL[clade]] ||
			BUILTIN_METADATA_IDS[parentCladeName]
	);

	if (!parentCladeDef) {
		throw new Error(`No metadata definition for ${parentCladeName}`);
	}

	console.log({ parentCladeDef });

	/**
	 *
	 * @param {string} childCladeKey
	 * @returns
	 */
	const parentCladeKey = (childCladeKey) => {
		// 1. Get label of clade key
		const childCladeLabel = childCladeDef.options?.find((o) => o.key === childCladeKey)?.label;
		if (!childCladeLabel) {
			throw new Error(`No label for ${clade} key ${childCladeKey}`);
		}

		// 2. Walk up the taxonomy to get parent clade label
		const parentCladeLabel = _taxonomy[CLADE_NAMES_PLURAL[clade]][childCladeLabel];

		// 3. Get key of parent clade
		return parentCladeDef.options?.find((o) => o.label === parentCladeLabel)?.key;
	};

	const parentKey = parentCladeKey(value);
	if (!parentKey) {
		throw new Error(`parent of ${value} not found in taxonomy`);
	}

	// Confidence is average of all values matching the parent clade in alternatives and value

	/** @param {number[]} arr */
	const avg = (arr) => {
		if (!arr.length) throw new Error('Cannot average an empty array');
		return arr.reduce((a, b) => a + b, 0) / arr.length;
	};

	/** @param {string} parentKey  */
	const confidenceForParentValue = (parentKey) =>
		avg(
			[...(alternatives ?? []), { value, confidence }]
				.filter(({ value }) => parentCladeKey(value) === parentKey)
				.map(({ confidence }) => confidence)
				.filter((x) => x !== undefined)
		);

	await setTaxonAndInferParents({
		protocol,
		subjectId,
		confidence: confidenceForParentValue(parentKey),
		alternatives: Object.values(alternatives ?? {})
			.map(({ value }) => parentCladeKey(value))
			.filter((x) => x !== undefined)
			.map((parentKey) => ({
				value: parentKey,
				confidence: confidenceForParentValue(parentKey)
			})),
		metadataId: parentCladeDef.id,
		value: parentKey,
		manuallyModified
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

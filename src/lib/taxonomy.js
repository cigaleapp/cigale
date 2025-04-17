import { type } from 'arktype';

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
	'kingdom',
	'phylum',
	'class',
	'order',
	'family',
	'genus',
	'species'
]);

/**
 * Map singular-case clade names to their plural-case names, as used in the taxonomy object
 */
export const CLADE_NAMES_PLURAL = /** @type {const} */ ({
	kingdom: 'kingdoms',
	phylum: 'phyla',
	class: 'classes',
	order: 'orders',
	family: 'families',
	genus: 'genera',
	species: 'species'
});

export const Clade = type.enumerated(...CLADE_NAMES_SINGULAR);
export const CladePlural = type.enumerated(...Object.values(CLADE_NAMES_PLURAL));

/**
 * @import { IDBTransactionWithAtLeast } from './idb.svelte.js'
 * @import { RuntimeValue } from './metadata.js'
 */

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
	const { toasts } = await import('./toasts.svelte.js');

	const metadata = await tables.Metadata.get(metadataId);
	if (!metadata) throw new Error(`Metadata ${metadataId} not found`);
	if (!('taxonomic' in metadata)) {
		throw new Error(`Metadata ${metadataId} is not taxonomic`);
	}

	const metadataOfProtocol = await tables.Metadata.list().then((defs) =>
		defs.filter((def) => protocol.metadata.includes(def.id))
	);

	const clade = metadata.taxonomic.clade;

	console.log(`Setting taxon on ${subjectId}: ${clade} = ${value}`);

	await storeMetadataValue({
		subjectId,
		metadataId,
		value,
		confidence,
		alternatives,
		manuallyModified
	});

	// Base case: kingdom clade
	if (clade === 'kingdom') return;

	// Recursive case: infer parent
	const parentCladeName = CLADE_NAMES_SINGULAR[CLADE_NAMES_SINGULAR.indexOf(clade) - 1];

	const parentCladeDef = metadataOfProtocol.find(
		(m) => m.type === 'enum' && 'taxonomic' in m && m.taxonomic.clade === parentCladeName
	);

	if (!parentCladeDef) {
		throw new Error(`No metadata definition for ${parentCladeName}`);
	}

	if (!('options' in parentCladeDef)) {
		throw new Error(`No options for ${parentCladeName} metadata`);
	}

	const parentKey = metadata.taxonomic.parent[value];
	if (!parentKey) {
		toasts.warn(
			`Impossible d'inférer lea ${parentCladeName} de ${metadata.options?.find((o) => o.key === value)?.label ?? value}`
		);
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
				.filter(({ value }) => metadata.taxonomic?.parent[value] === parentKey)
				.map(({ confidence }) => confidence)
				.filter((x) => x !== undefined)
		);

	await setTaxonAndInferParents({
		protocol,
		subjectId,
		confidence: confidenceForParentValue(parentKey),
		alternatives: Object.values(alternatives ?? {})
			.map(({ value }) => metadata.taxonomic?.parent[value])
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

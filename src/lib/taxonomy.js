import { type } from 'arktype';
import { keyOfEnumLabel, labelOfEnumKey, storeMetadataValue } from './metadata';
import { BUILTIN_METADATA_IDS } from './database';
import { openTransaction } from './idb.svelte';
import { base } from '$app/paths';

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

export const Taxonomy = type({
	species: { '[string]': Taxon },
	phyla: type({ '[string]': 'string' }).describe('phyla -> kingdoms'),
	orders: type({ '[string]': 'string' }).describe('orders -> phyla'),
	families: type({ '[string]': 'string' }).describe('families -> orders'),
	genera: type({ '[string]': 'string' }).describe('genera -> families')
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

export const Clade = type.enumerated(...CLADE_METADATA_IDS);

/**
 * @type {typeof Taxonomy.infer}
 */
let _taxonomy = {
	species: {},
	phyla: {},
	orders: {},
	families: {},
	genera: {}
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
	console.log(`Setting taxon on ${subjectId}: ${clade} = ${value}`);
	await openTransaction(['Image', 'Observation'], { tx }, async (tx) => {
		switch (clade) {
			case BUILTIN_METADATA_IDS.species: {
				await storeMetadataValue({
					tx,
					subjectId,
					metadataId: BUILTIN_METADATA_IDS.species,
					value,
					confidence,
					alternatives
				});

				const speciesName = await labelOfEnumKey(BUILTIN_METADATA_IDS.species, value);
				if (!speciesName) {
					throw new Error(`Species ${value} not found in taxonomy`);
				}

				const lineage = await lineageOfSpecies(speciesName);
				const key = await keyOfEnumLabel(BUILTIN_METADATA_IDS.genus, lineage.genus);
				if (!key) {
					throw new Error(`Genus ${lineage.genus} not found in taxonomy`);
				}
				await setTaxonAndInferParents({
					tx,
					subjectId,
					clade: BUILTIN_METADATA_IDS.genus,
					value: key
				});
				break;
			}

			case BUILTIN_METADATA_IDS.genus: {
				// Store genus
				await storeMetadataValue({
					tx,
					subjectId,
					metadataId: BUILTIN_METADATA_IDS.genus,
					value,
					confidence,
					alternatives
				});

				// Get genus name
				const genusName = await labelOfEnumKey(BUILTIN_METADATA_IDS.genus, value);
				if (!genusName) {
					throw new Error(`Genus ${value} not found in taxonomy`);
				}

				// Get associated family, walking up the taxonomy tree
				const family = _taxonomy.genera[genusName];
				if (!family) {
					throw new Error(`Genus ${value} has no family in taxonomy`);
				}

				// Get key in enum for family
				const key = await keyOfEnumLabel(BUILTIN_METADATA_IDS.family, family);
				if (!key) {
					throw new Error(`Family ${family} not found in taxonomy`);
				}

				// Continue walking up the taxonomy tree
				await setTaxonAndInferParents({
					tx,
					subjectId,
					clade: BUILTIN_METADATA_IDS.family,
					value: key
				});
				break;
			}

			case BUILTIN_METADATA_IDS.family: {
				// Store family
				await storeMetadataValue({
					tx,
					subjectId,
					metadataId: BUILTIN_METADATA_IDS.family,
					value,
					confidence,
					alternatives
				});

				// Get family name
				const familyName = await labelOfEnumKey(BUILTIN_METADATA_IDS.family, value);
				if (!familyName) {
					throw new Error(`Family ${value} not found in taxonomy`);
				}

				// Get associated order, walking up the taxonomy tree
				const order = _taxonomy.families[familyName];
				if (!order) {
					throw new Error(`Family ${value} has no order in taxonomy`);
				}

				// Get key in enum for order
				const key = await keyOfEnumLabel(BUILTIN_METADATA_IDS.order, order);
				if (!key) {
					throw new Error(`Order ${order} not found in taxonomy`);
				}

				// Continue walking up the taxonomy tree
				await setTaxonAndInferParents({
					tx,
					subjectId,
					clade: BUILTIN_METADATA_IDS.order,
					value: key
				});
				break;
			}

			case BUILTIN_METADATA_IDS.order: {
				// Store order
				await storeMetadataValue({
					tx,
					subjectId,
					metadataId: BUILTIN_METADATA_IDS.order,
					value,
					confidence,
					alternatives
				});

				// Get order name
				const orderName = await labelOfEnumKey(BUILTIN_METADATA_IDS.order, value);
				if (!orderName) {
					throw new Error(`Order ${value} not found in taxonomy`);
				}

				// Get associated phylum, walking up the taxonomy tree
				const phylum = _taxonomy.orders[orderName];
				if (!phylum) {
					throw new Error(`Order ${value} has no phylum in taxonomy`);
				}

				// Get key in enum for phylum
				const key = await keyOfEnumLabel(BUILTIN_METADATA_IDS.phylum, phylum);
				if (!key) {
					throw new Error(`Phylum ${phylum} not found in taxonomy`);
				}

				// Continue walking up the taxonomy tree
				await setTaxonAndInferParents({
					tx,
					subjectId,
					clade: BUILTIN_METADATA_IDS.phylum,
					value: key
				});
				break;
			}

			case BUILTIN_METADATA_IDS.phylum: {
				// Store phylum
				await storeMetadataValue({
					tx,
					subjectId,
					metadataId: BUILTIN_METADATA_IDS.phylum,
					value,
					confidence,
					alternatives
				});

				// Get phylum name
				const phylumName = await labelOfEnumKey(BUILTIN_METADATA_IDS.phylum, value);
				if (!phylumName) {
					throw new Error(`Phylum ${value} not found in taxonomy`);
				}

				// Get associated kingdom, walking up the taxonomy tree
				const kingdom = _taxonomy.phyla[phylumName];
				if (!kingdom) {
					throw new Error(`Phylum ${value} has no kingdom in taxonomy`);
				}

				// Get key in enum for kingdom
				const key = await keyOfEnumLabel(BUILTIN_METADATA_IDS.kingdom, kingdom);
				if (!key) {
					throw new Error(`Kingdom ${kingdom} not found in taxonomy`);
				}

				// Continue walking up the taxonomy tree
				await storeMetadataValue({
					tx,
					subjectId,
					metadataId: BUILTIN_METADATA_IDS.kingdom,
					value: key
				});
				break;
			}

			case BUILTIN_METADATA_IDS.kingdom: {
				// Store kingdom
				await storeMetadataValue({
					tx,
					subjectId,
					metadataId: BUILTIN_METADATA_IDS.kingdom,
					value,
					confidence,
					alternatives
				});
				break;
			}
		}
	});
}

/**
 * @param {string} species
 * @returns {Promise<typeof Taxon.infer>} The lineage of the species: kingdom, phylum, order, family, genus, species
 */
export async function lineageOfSpecies(species) {
	await ensureTaxonomyInitialized();
	const taxon = _taxonomy.species[species];
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
	const data = await fetch(`${base}/taxonomy.json`).then((response) => response.json());
	_taxonomy = Taxonomy.assert(data);
	return _taxonomy;
}

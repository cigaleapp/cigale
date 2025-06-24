import { readFile, writeFile } from 'node:fs/promises';
import protocol from '../examples/arthropods.cigaleprotocol.json' with { type: 'json' };
import oldProtocol from '../examples/old-arthropods.cigaleprotocol.json' with { type: 'json' };
import path from 'node:path';

const here = import.meta.dirname;

/**
 * @type {Record<number, GbifSpecies>}
 */
const cachedGbifData = await readFile(path.join(here, './gbif.json'), 'utf-8')
	.then((v) => JSON.parse(v))
	.catch(() => ({}));

/**
 *
 * @param {string|number} gbifId
 * @returns {Promise<GbifSpecies>}
 */
async function getSpecies(gbifId) {
	const cached = cachedGbifData[Number(gbifId)];
	if (cached) {
		return cached;
	}

	const response = await fetch(`https://api.gbif.org/v1/species/${gbifId}`);
	if (!response.ok) {
		throw new Error(`GBIF API request failed with status ${response.status}`);
	}

	const data = await response.json();
	cachedGbifData[gbifId] = data;
	return data;
}

const newProtocol = { ...protocol };

for (const [i, { key }] of protocol.metadata[
	'io.github.cigaleapp.arthropods.example__species'
].options.entries()) {
	const species = await getSpecies(key);
	if (!species) {
		console.warn(`No species found for GBIF ID ${key}`);
		continue;
	}

	const keys = {
		genus: species.genusKey?.toString(),
		family: species.familyKey?.toString(),
		order: species.orderKey?.toString(),
		class: species.classKey?.toString(),
		phylum: species.phylumKey?.toString(),
		kingdom: species.kingdomKey?.toString()
	};

	if (!Object.values(keys).every(Boolean)) {
		console.warn(
			`\nMissing some taxonomic keys for species ${species.canonicalName} (GBIF ID: ${key}): https://api.gbif.org/v1/species/${key}. Missing: ${Object.entries(
				keys
			)
				.filter(([_, v]) => !v)
				.map(([k]) => k)
				.join(', ')}`
		);
	}

	newProtocol.metadata['io.github.cigaleapp.arthropods.example__species'].taxonomic.parent[key] =
		keys.genus;
	newProtocol.metadata['io.github.cigaleapp.arthropods.example__genus'].taxonomic.parent[
		keys.genus
	] = keys.family;
	newProtocol.metadata['io.github.cigaleapp.arthropods.example__family'].taxonomic.parent[
		keys.family
	] = keys.order;
	newProtocol.metadata['io.github.cigaleapp.arthropods.example__order'].taxonomic.parent[
		keys.order
	] = keys.class;
	newProtocol.metadata['io.github.cigaleapp.arthropods.example__class'].taxonomic.parent[
		keys.class
	] = keys.phylum;
	newProtocol.metadata['io.github.cigaleapp.arthropods.example__phylum'].taxonomic.parent[
		keys.phylum
	] = keys.kingdom;

	await addToOptions('genus', keys.genus, species.genus);
	await addToOptions('family', keys.family, species.family);
	await addToOptions('order', keys.order, species.order);
	await addToOptions('class', keys.class, species['class']);
	await addToOptions('phylum', keys.phylum, species.phylum);
	await addToOptions('kingdom', keys.kingdom, species.kingdom);

	process.stdout.write(
		`\x1b[1K\rProcessed ${i + 1}/${protocol.metadata['io.github.cigaleapp.arthropods.example__species'].options.length} species: ${species.scientificName}`
	);
}

await writeFile(
	path.join(here, '../examples/arthropods.cigaleprotocol.json'),
	JSON.stringify(newProtocol, null, 2)
);

async function addToOptions(id, key, label, description = '') {
	const opts = newProtocol.metadata['io.github.cigaleapp.arthropods.example__' + id].options;
	if (opts.some((o) => o.key === key)) return;

	if (!key) {
		console.warn(`Skipping ${id} with empty key for label "${label}"`);
		return;
	}

	if (!label) {
		console.warn(`${id} / ${key} has empty label`);
	}

	opts.push(
		/** @type {import('$lib/database.js').MetadataEnumVariant} */ ({
			key,
			label,
			description,
			learnMore: `https://gbif.org/species/${key}`
		})
	);
}

/**
 * @typedef {object} GbifSpecies
 * @property {number} key
 * @property {number} nubKey
 * @property {number} nameKey
 * @property {string} taxonID
 * @property {number} sourceTaxonKey
 * @property {string} kingdom
 * @property {string} phylum
 * @property {string} order
 * @property {string} family
 * @property {string} genus
 * @property {string} species
 * @property {number} kingdomKey
 * @property {number} phylumKey
 * @property {number} classKey
 * @property {number} orderKey
 * @property {number} familyKey
 * @property {number} genusKey
 * @property {number} speciesKey
 * @property {string} datasetKey
 * @property {string} constituentKey
 * @property {number} parentKey
 * @property {string} parent
 * @property {number} basionymKey
 * @property {string} basionym
 * @property {string} scientificName
 * @property {string} canonicalName
 * @property {string} authorship
 * @property {string} nameType
 * @property {string} rank
 * @property {string} origin
 * @property {string} taxonomicStatus
 * @property {} nomenclaturalStatus
 * @property {string} remarks
 * @property {number} numDescendants
 * @property {string} lastCrawled
 * @property {string} lastInterpreted
 * @property {} issues
 * @property {string} class
 */

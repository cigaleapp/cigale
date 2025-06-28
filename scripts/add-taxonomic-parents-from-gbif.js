import { readFile, writeFile } from 'node:fs/promises';
import protocol from '../examples/arthropods.cigaleprotocol.json' with { type: 'json' };
import path from 'node:path';

const here = import.meta.dirname;

/**
 * @type {Record<number, GbifSpecies>}
 */
const cachedGbifData = await readFile(path.join(here, './gbif.json'), 'utf-8')
	.then((v) => JSON.parse(v))
	.catch(() =>
		fetch('https://github.com/cigaleapp/models/raw/refs/heads/main/gbif.json')
			.then((res) => res.json())
			.then((json) => {
				void (async () => {
					writeFile(path.join(here, './gbif.json'), JSON.stringify(json, null, 2));
				})();
				return json;
			})
	)
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

	await addToOptions('genus', keys.genus, species.genus);
	await addToOptions('family', keys.family, species.family);
	await addToOptions('order', keys.order, species.order);
	await addToOptions('class', keys.class, species['class']);
	await addToOptions('phylum', keys.phylum, species.phylum);
	await addToOptions('kingdom', keys.kingdom, species.kingdom);

	await setCascadeOnOption('species', key, 'genus', keys.genus);
	await setCascadeOnOption('genus', keys.genus, 'family', keys.family);
	await setCascadeOnOption('family', keys.family, 'order', keys.order);
	await setCascadeOnOption('order', keys.order, 'class', keys.class);
	await setCascadeOnOption('class', keys.class, 'phylum', keys.phylum);
	await setCascadeOnOption('phylum', keys.phylum, 'kingdom', keys.kingdom);

	process.stdout.write(
		`\x1b[1K\rProcessed ${i + 1}/${protocol.metadata['io.github.cigaleapp.arthropods.example__species'].options.length} species: ${species.scientificName}`
	);
}

Object.keys(protocol.metadata).forEach((id) => {
	protocol.metadata[id].options?.sort((a, b) => a.label.localeCompare(b.label));
});

await writeFile(path.join(here, './gbif.json'), JSON.stringify(cachedGbifData, null, 2));
await writeFile(
	path.join(here, '../examples/arthropods.cigaleprotocol.json'),
	JSON.stringify(newProtocol, null, 2)
);

async function setCascadeOnOption(id, key, parentId, parentKey) {
	const opts = newProtocol.metadata['io.github.cigaleapp.arthropods.example__' + id].options;
	const opt = opts.find((o) => o.key === key);
	if (!opt) {
		console.warn(`Option ${id} with key ${key} not found`);
		return;
	}

	if (!opt.cascade) {
		opt.cascade = {};
	}

	if (opt.cascade[parentId] && opt.cascade[parentId] !== parentKey) {
		console.warn(
			`Option ${id} with key ${key} already has a cascade for ${parentId} with value ${opt.cascade[parentId]}, but trying to set it to ${parentKey}`
		);
		return;
	}

	opt.cascade[parentId] = parentKey;
}

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

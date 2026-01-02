import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import protocol from '../examples/arthropods.cigaleprotocol.json' with { type: 'json' };
import lightProtocol from '../examples/arthropods.light.cigaleprotocol.json' with { type: 'json' };

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
const newLightProtocol = { ...lightProtocol };

for (const [i, { key }] of protocol.metadata[
	'io.github.cigaleapp.arthropods.example__species'
].options.entries()) {
	const species = await getSpecies(key);
	if (!species) {
		console.warn(`No species found for GBIF ID ${key}`);
		continue;
	}

	const addToLight = newLightProtocol.metadata[
		'io.github.cigaleapp.arthropods.example.light__species'
	].options.find((o) => o.key === key);

	const protocols = addToLight ? [newLightProtocol, newProtocol] : [newProtocol];

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

	await addToOptions(protocols, 'genus', keys.genus, species.genus);
	await addToOptions(protocols, 'family', keys.family, species.family);
	await addToOptions(protocols, 'order', keys.order, species.order);
	await addToOptions(protocols, 'class', keys.class, species['class']);
	await addToOptions(protocols, 'phylum', keys.phylum, species.phylum);
	await addToOptions(protocols, 'kingdom', keys.kingdom, species.kingdom);

	await setCascadeOnOption(protocols, 'species', key, 'genus', keys.genus);
	await setCascadeOnOption(protocols, 'genus', keys.genus, 'family', keys.family);
	await setCascadeOnOption(protocols, 'family', keys.family, 'order', keys.order);
	await setCascadeOnOption(protocols, 'order', keys.order, 'class', keys.class);
	await setCascadeOnOption(protocols, 'class', keys.class, 'phylum', keys.phylum);
	await setCascadeOnOption(protocols, 'phylum', keys.phylum, 'kingdom', keys.kingdom);

	process.stdout.write(
		`\x1b[1K\rProcessed ${i + 1}/${protocol.metadata['io.github.cigaleapp.arthropods.example__species'].options.length} species: ${species.scientificName}`
	);
}

const metadataToSort = ['species', 'genus', 'family', 'order', 'class', 'phylum', 'kingdom'];

metadataToSort
	.map((key) => `${protocol.id}__${key}`)
	.forEach((id) => {
		protocol.metadata[id].options?.sort((a, b) => a.label.localeCompare(b.label));
	});

await writeFile(path.join(here, './gbif.json'), JSON.stringify(cachedGbifData, null, 2));
await writeFile(
	path.join(here, '../examples/arthropods.cigaleprotocol.json'),
	JSON.stringify(newProtocol, null, 2)
);
await writeFile(
	path.join(here, '../examples/arthropods.light.cigaleprotocol.json'),
	JSON.stringify(newLightProtocol, null, 2)
);

async function setCascadeOnOption(protocols, id, key, parentId, parentKey) {
	const [protocol, ...rest] = protocols;
	const opts = protocol.metadata[`${protocol.id}__${id}`].options;
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

	if (rest.length > 0) {
		await setCascadeOnOption(rest, id, key, parentId, parentKey);
	}
}

async function addToOptions(protocols, id, key, label, description = '') {
	const [protocol, ...rest] = protocols;
	const opts = protocol.metadata[`${protocol.id}__${id}`].options;
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

	if (rest.length > 0) {
		await addToOptions(rest, id, key, label, description);
	}
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
 * @property {unknown} nomenclaturalStatus
 * @property {string} remarks
 * @property {number} numDescendants
 * @property {string} lastCrawled
 * @property {string} lastInterpreted
 * @property {unknown} issues
 * @property {string} class
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { warning } from '@actions/core';
import { Estimation as ETA } from 'arrival-time';
import { formatDistanceToNowStrict, millisecondsToHours } from 'date-fns';

import _protocol from '../examples/arthropods.cigaleprotocol.json' with { type: 'json' };
import _lightProtocol from '../examples/arthropods.light.cigaleprotocol.json' with { type: 'json' };
import { MetadataEnumVariant } from '../src/lib/database.js';
import { ExportedProtocol } from '../src/lib/schemas/protocols.js';

const protocol = _protocol as typeof ExportedProtocol.infer;
const lightProtocol = _lightProtocol as unknown as typeof ExportedProtocol.infer;

const here = import.meta.dirname;

const IUCN_GBIF_TO_TWO_LETTER_CODE = {
	EXTINCT: 'ex',
	EXTINCT_IN_THE_WILD: 'ew',
	REGIONALLY_EXTINCT: 're',
	CRITICALLY_ENDANGERED: 'cr',
	ENDANGERED: 'en',
	VULNERABLE: 'vu',
	NEAR_THREATENED: 'nt',
	LEAST_CONCERN: 'lc',
	DATA_DEFICIENT: 'dd',
	NOT_APPLICABLE: 'na',
	NOT_EVALUATED: 'ne'
} as const satisfies Record<GbifIucnRedListCategory['category'], string>;

const onlineCacheUrl = 'https://github.com/cigaleapp/models/raw/refs/heads/main/gbif.json';

const cachedGbifData: Record<number, GbifSpecies> &
	Record<`${number}/synonyms`, { results: GbifSpecies[] }> &
	Record<'#updatedAt', string> &
	Record<`${number}/iucnRedListCategory`, GbifIucnRedListCategory> = await readFile(
	path.join(here, './gbif.json'),
	'utf-8'
)
	.then((v) => JSON.parse(v))
	.catch(() =>
		fetch(onlineCacheUrl)
			.then((res) => res.json())
			.then((json) => {
				void (async () => {
					writeFile(path.join(here, './gbif.json'), JSON.stringify(json, null, 2));
				})();
				return json;
			})
	)
	.catch(() => ({}));

const cacheFreshness = Date.now() - new Date(cachedGbifData['#updatedAt']).valueOf();

if (cacheFreshness > millisecondsToHours(24 * 31)) {
	warning(
		`GBIF cache is older than 31 days (${formatDistanceToNowStrict(
			new Date(cachedGbifData['#updatedAt'])
		)} old). Cache will be ignored. Consider updating gbif.json manually at ${onlineCacheUrl}.`
	);
}

async function fetchWithCache<Path extends keyof typeof cachedGbifData>(
	path: Path
): Promise<(typeof cachedGbifData)[Path]> {
	if (cachedGbifData[path]) {
		return cachedGbifData[path];
	}

	const response = await fetch(`https://api.gbif.org/v1/species/${path}`);
	if (!response.ok) {
		console.error(`\n\nGBIF API request failed for ${path}:`, await response.text());
		throw new Error(`GBIF API request failed with status ${response.status}`);
	}

	const data = await response.json();
	cachedGbifData[path] = data;
	return data;
}

/**
 *
 * @param {string|number} gbifId
 * @returns {Promise<GbifSpecies | undefined>}
 */
async function getSpecies(gbifId: string | number): Promise<GbifSpecies | undefined> {
	if (gbifId === undefined || gbifId === null) {
		return undefined;
	}

	return fetchWithCache(Number(gbifId));
}

// async function resolveSynonyms(gbifId: number) {
// 	const taxon = await getSpecies(gbifId);
// 	if (!taxon) return undefined;

// 	switch (taxon.taxonomicStatus) {
// 		case 'ACCEPTED':
// 			return taxon;
// 		case 'DOUBTFUL':
// 		case 'SYNONYM':
// 		case 'HETEROTYPIC_SYNONYM':
// 		case 'HOMOTYPIC_SYNONYM':
// 		case 'PROPARTE_SYNONYM': {
// 			return await fetchWithCache(`${gbifId}/synonyms`).then((data) =>
// 				data.results.find((s) => s.taxonomicStatus === 'ACCEPTED')
// 			);
// 		}
// 	}
// }

const newProtocol = { ...protocol };
const newLightProtocol = { ...lightProtocol };

const options = protocol.metadata['io.github.cigaleapp.arthropods.example__species'].options!;

const eta = new ETA({ total: options.length });

for (const [i, { key }] of options.entries()) {
	const species = await getSpecies(key);
	if (!species) {
		console.warn(`No species found for GBIF ID ${key}`);
		continue;
	}

	const addToLight = newLightProtocol.metadata[
		'io.github.cigaleapp.arthropods.example.light__species'
	].options!.find((o) => o.key === key);

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
				.filter(([, v]) => !v)
				.map(([k]) => k)
				.join(', ')}`
		);
	}

	// const genus = await getSpecies(keys.genus);
	// const family = await getSpecies(keys.family);
	// const order = await getSpecies(keys.order);
	// const class_ = await getSpecies(keys.class);
	// const phylum = await getSpecies(keys.phylum);

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

	await setICUNStatus(protocols, 'species', key);

	eta.update(i + 1);

	process.stdout.write(
		`\x1b[1K\r ${formatDistanceToNowStrict(new Date(Date.now() + eta.estimate()))} Processed ${i + 1}/${protocol.metadata['io.github.cigaleapp.arthropods.example__species'].options!.length} species: ${species.scientificName}`
	);
}

const metadataToSort = ['species', 'genus', 'family', 'order', 'class', 'phylum', 'kingdom'];

metadataToSort
	.map((key) => `${protocol.id}__${key}`)
	.forEach((id) => {
		protocol.metadata[id].options?.sort((a, b) => a.label.localeCompare(b.label));
	});

cachedGbifData['#updatedAt'] = new Date().toISOString();

await writeFile(path.join(here, './gbif.json'), JSON.stringify(cachedGbifData, null, 2));
await writeFile(
	path.join(here, '../examples/arthropods.cigaleprotocol.json'),
	JSON.stringify(newProtocol, null, 2)
);
await writeFile(
	path.join(here, '../examples/arthropods.light.cigaleprotocol.json'),
	JSON.stringify(newLightProtocol, null, 2)
);

async function setICUNStatus(
	protocols: (typeof ExportedProtocol.infer)[],
	id: string,
	key: string
) {
	const [protocol, ...rest] = protocols;
	const opts = protocol.metadata[`${protocol.id}__${id}`].options!;
	const opt = opts.find((o) => o.key === key);
	if (!opt) {
		console.warn(`Option ${id} with key ${key} not found`);
		return;
	}

	const { category } = (await fetchWithCache(`${Number(key)}/iucnRedListCategory`)) ?? {
		category: 'NOT_EVALUATED'
	};

	const code = IUCN_GBIF_TO_TWO_LETTER_CODE[category] ?? 'ne';

	switch (code) {
		case 'dd':
		case 'na':
		case 'ne':
			return;
		default:
			opt.cascade!.conservation_status = code;
	}

	if (rest.length > 0) {
		await setICUNStatus(rest, id, key);
	}
}

async function setCascadeOnOption(
	protocols: (typeof ExportedProtocol.infer)[],
	id: string,
	key: string,
	parentId: string,
	parentKey: string
) {
	const [protocol, ...rest] = protocols;
	const opts = protocol.metadata[`${protocol.id}__${id}`].options!;
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

async function addToOptions(
	protocols: (typeof ExportedProtocol.infer)[],
	id: string,
	key: string,
	label: string,
	description = ''
) {
	const [protocol, ...rest] = protocols;
	const opts = protocol.metadata[`${protocol.id}__${id}`].options!;
	if (opts.some((o) => o.key === key)) return;

	if (!key) {
		console.warn(`Skipping ${id} with empty key for label "${label}"`);
		return;
	}

	if (!label) {
		console.warn(`${id} / ${key} has empty label`);
	}

	opts.push({
		key,
		label,
		description,
		learnMore: `https://gbif.org/species/${key}`
	} as MetadataEnumVariant);

	if (rest.length > 0) {
		await addToOptions(rest, id, key, label, description);
	}
}

interface GbifIucnRedListCategory {
	/** The taxonomic threat status as given in our https://api.gbif.org/v1/enumeration/basic/ThreatStatus[ThreatStatus enum]. */
	category:
		| 'EXTINCT'
		| 'EXTINCT_IN_THE_WILD'
		| 'REGIONALLY_EXTINCT'
		| 'CRITICALLY_ENDANGERED'
		| 'ENDANGERED'
		| 'VULNERABLE'
		| 'NEAR_THREATENED'
		| 'LEAST_CONCERN'
		| 'DATA_DEFICIENT'
		| 'NOT_APPLICABLE'
		| 'NOT_EVALUATED';
	usageKey: number;
	/** The name usage “taxon“ key to which this Red List category applies. */
	scientificName: string;
	/** The taxonomic status of the name. */
	taxonomicStatus:
		| 'ACCEPTED'
		| 'DOUBTFUL'
		| 'SYNONYM'
		| 'HETEROTYPIC_SYNONYM'
		| 'HOMOTYPIC_SYNONYM'
		| 'PROPARTE_SYNONYM'
		| 'MISAPPLIED';
	/** The accepted name, if the name is a synonym. */
	acceptedName: string;
	/** The accepted name's usage key, if the name is a synonym. */
	acceptedUsageKey: number;
	/** The original IUCN identifier used for the name usage. */
	iucnTaxonID: string;
	/** The code for the taxonomic threat status as given in our https://api.gbif.org/v1/enumeration/basic/ThreatStatus[ThreatStatus enum]. */
	code: string;
}

interface GbifSpecies {
	key: number;
	nubKey: number;
	nameKey: number;
	taxonID: string;
	sourceTaxonKey: number;
	kingdom: string;
	phylum: string;
	order: string;
	family: string;
	genus: string;
	species: string;
	kingdomKey: number;
	phylumKey: number;
	classKey: number;
	orderKey: number;
	familyKey: number;
	genusKey: number;
	speciesKey: number;
	datasetKey: string;
	constituentKey: string;
	parentKey: number;
	parent: string;
	basionymKey: number;
	basionym: string;
	scientificName: string;
	canonicalName: string;
	authorship: string;
	nameType: string;
	rank: string;
	origin: string;
	taxonomicStatus:
		| 'ACCEPTED'
		| 'DOUBTFUL'
		| 'SYNONYM'
		| 'HETEROTYPIC_SYNONYM'
		| 'HOMOTYPIC_SYNONYM'
		| 'PROPARTE_SYNONYM'
		| 'MISAPPLIED';
	nomenclaturalStatus: unknown;
	remarks: string;
	numDescendants: number;
	lastCrawled: string;
	lastInterpreted: string;
	issues: unknown;
	class: string;
}

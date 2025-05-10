import protocol from '../examples/arthropods.cigaleprotocol.json' with { type: 'json' };
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const here = import.meta.dirname;

/**
 * @import {MetadataEnumVariant} from '../src/lib/database.js';
 */

async function fetchTaxon(taxon) {
	const response = await fetch(
		`https://api.gbif.org/v1/species/search?datasetKey=d7dddbf4-2cf0-4f39-9b2a-bb099caae36c&q=${encodeURIComponent(taxon)}`
	);
	const data = await response.json();

	return data.results.find((r) => r.species === taxon) ?? data.results[0];
}

async function fetchPhoto(gbifId) {
	const url = `https://api.gbif.org/v1/occurrence/search?taxonKey=${gbifId}&limit=1`;
	const response = await fetch(url).then((r) => {
		if (!r.ok) throw new Error(`Error fetching ${url}: ${r.status} ${r.statusText}`);
		return r.json();
	});

	if (!response.results?.length) return undefined;

	const image = response.results
		.find((r) => r.media?.length > 0)
		?.media.find(
			(m) =>
				m.type === 'StillImage' &&
				[
					'http://creativecommons.org/licenses/by/4.0/',
					'https://creativecommons.org/publicdomain/zero/1.0/'
				].includes(m.license)
		);
	if (!image) return undefined;

	const photo = {
		url: image.identifier,
		license: image.license,
		source: image.references.toString(),
		credit: image.rightsHolder
	};

	return {
		...photo,
		attribution: `\n\n\nPhoto par ${photo.credit} [sur ${new URL(photo.source).hostname}](${photo.source}) (_via_ [GBIF.org](https://gbif.org/)), sous [license CC ${photo.license.includes('publicdomain') ? '0' : 'BY 4.0'}](${photo.license})`
	};
}

console.log(await fetchTaxon('Allacma fusca'));

const species = protocol.metadata['io.github.cigaleapp.arthropods.example__species'].options.map(
	(o) => o.label
);

const newProtocol = { ...protocol };

/**
 * @typedef {object} TreeItem
 * @prop {string} gbifId
 * @prop {string} gbifBackboneId
 * @prop {string} kingdom
 * @prop {number} kingdomKey
 * @prop {string} phylum
 * @prop {number} phylumKey
 * @prop {string} class
 * @prop {number} classKey
 * @prop {string} order
 * @prop {number} orderKey
 * @prop {string} family
 * @prop {number} familyKey
 * @prop {string} species
 * @prop {number} speciesKey
 * @prop {string} genus
 * @prop {number} genusKey
 * @prop {boolean} accepted
 * @prop {string} [notAcceptedWhy]
 */

/**
 * @typedef {object} Tree
 * @prop {Record<string, string>} phyla
 * @prop {Record<string, string>} classes
 * @prop {Record<string, string>} orders
 * @prop {Record<string, string>} families
 * @prop {Record<string, string>} genera
 * @prop {Record<string, string>} species
 * @prop {TreeItem[]} items
 */

/**
 * @type {Tree}
 */
let tree = {
	phyla: {},
	classes: {},
	orders: {},
	families: {},
	genera: {},
	species: {},
	items: []
};

const notfounds = new Map();

if (existsSync('treedump.json')) {
	tree = JSON.parse(readFileSync('treedump.json', 'utf8'));
} else {
	let done = 0;
	const total = species.length;

	process.stderr.write(`\x1b[KGot ${total} species\r`);

	for (const sp of species) {
		process.stderr.write(`\x1b[K${done}/${total} ${sp}\r`);
		const response = await fetchTaxon(sp);
		// writeFileSync(path.join(here, 'gbif ' + sp + '.json'), JSON.stringify(response, null, 2));
		const {
			key,
			nubKey,
			kingdom,
			kingdomKey,
			phylum,
			phylumKey,
			order,
			orderKey,
			family,
			familyKey,
			genus,
			genusKey,
			species,
			speciesKey,
			descriptions,
			vernacularNames,
			taxonomicStatus,
			class: klass,
			classKey
		} = response;

		if (species !== sp) {
			notfounds.set(sp, species);
		}

		const frenchVernacular = vernacularNames.find((v) => v.language === 'fra')?.vernacularName;

		tree.items.push({
			gbifId: key,
			gbifBackboneId: nubKey,
			kingdom,
			phylum,
			class: klass,
			order,
			family,
			species,
			genus,
			// ACCEPTED, DOUBTFUL, SYNONYM, HETEROTYPIC_SYNONYM, HOMOTYPIC_SYNONYM, PROPARTE_SYNONYM, MISAPPLIED
			accepted: taxonomicStatus === 'ACCEPTED',
			...(taxonomicStatus === 'ACCEPTED' ? {} : { notAcceptedWhy: taxonomicStatus }),
			kingdomKey,
			phylumKey,
			classKey,
			orderKey,
			familyKey,
			genusKey,
			description: [
				frenchVernacular ? `Nom vernaculaire : ${frenchVernacular}` : '',
				descriptions.sort((a, b) => a.description.length - b.description.length).at(-1)?.description
			]
				.map((s) => s?.trim())
				.filter(Boolean)
				.join('\n\n'),
			speciesKey
		});
		done++;
	}
}

for (const [sp, instead] of notfounds.entries()) {
	console.error(`\x1b[31m${sp} not found, GBIF gave ${instead} instead\x1b[0m`);
}

// writeFileSync(path.join(here, 'treedump.json'), JSON.stringify(tree, null, 2));

/***
 * @param {object} arg
 * @param {string} arg.parentMetadataId id of metadata to search for the parent label in
 * @param {string} arg.childMetadataId  id of metadata to set a taxonomic parent in (without the namespace, the function will add it)
 * @param {string} arg.parent label of the parent value
 * @param {number} arg.childGbifId gbif id of the parent value
 * @param {string} arg.child label of the child value
 * @param {string} arg.childDecsription description of the child value
 * @returns {string|undefined} id of the metadata found
 */
async function setParent({
	parentMetadataId,
	childMetadataId,
	childGbifId,
	parent,
	child,
	childDecsription = ''
}) {
	const parentMetadata = newProtocol.metadata[`${protocol.id}__${parentMetadataId}`];
	if (!parentMetadata) throw new Error(`parentMetadata not found from ${parentMetadataId}`);

	const parentKey =
		parentMetadata.options.find((o) => o.label === parent)?.key ??
		parent.toLowerCase().replaceAll(' ', '_');

	const childMetadata = newProtocol.metadata[`${protocol.id}__${childMetadataId}`];
	if (!childMetadata) throw new Error(`childMetadata not found from ${childMetadataId}`);

	const childKey =
		childMetadata.options.find((o) => o.label === child)?.key ??
		child.toLowerCase().replaceAll(' ', '_');

	newProtocol.metadata[`${protocol.id}__${childMetadataId}`].taxonomic.parent[childKey] = parentKey;

	if (childMetadata.options.some((o) => o.label === child)) {
		const i = childMetadata.options.findIndex((o) => o.label === child);
		const mid = `${protocol.id}__${childMetadataId}`;

		newProtocol.metadata[mid].options[i].learnMore ||= `https://gbif.org/species/${childGbifId}`;
		newProtocol.metadata[mid].options[i].description ||= childDecsription;
		if (childMetadataId === 'species' && !newProtocol.metadata[mid].options[i].image) {
			const photo = await fetchPhoto(childGbifId);
			if (photo) {
				newProtocol.metadata[mid].options[i].image = photo.url;
				newProtocol.metadata[mid].options[i].description += photo.attribution;
			}
		}
	} else {
		let photo;
		if (childMetadataId === 'species') {
			photo = await fetchPhoto(childGbifId);
		}

		newProtocol.metadata[`${protocol.id}__${childMetadataId}`].options.push(
			/** @satisfies {MetadataEnumVariant} */ ({
				label: child,
				key: childKey,
				description: childDecsription + (photo?.attribution ?? ''),
				learnMore: `https://gbif.org/species/${childGbifId}`,
				image: photo?.url
			})
		);
	}
}

process.stderr.write(`\x1b[KBuilding mapping species->genera...\r`);

for (const { genus, species, speciesKey, description } of tree.items) {
	if (!tree.species[species]) tree.species[species] = {};
	tree.species[species] = genus;
	try {
		await setParent({
			parentMetadataId: 'genus',
			childMetadataId: 'species',
			childGbifId: speciesKey,
			parent: genus,
			child: species,
			childDecsription: description
		});
	} catch (e) {
		console.error(e);
	}
}

process.stderr.write(`\x1b[KBuilding mapping genera->families...\r`);

for (const { genus, family, genusKey } of tree.items) {
	if (!tree.genera[genus]) tree.genera[genus] = {};
	tree.genera[genus] = family;
	try {
		await setParent({
			parentMetadataId: 'family',
			childMetadataId: 'genus',
			childGbifId: genusKey,
			parent: family,
			child: genus
		});
	} catch (e) {
		console.error(e);
	}
}

process.stderr.write(`\x1b[KBuilding mapping families->orders...\r`);

for (const { family, order, familyKey } of tree.items) {
	if (!tree.families[family]) tree.families[family] = {};
	tree.families[family] = order;
	try {
		await setParent({
			parentMetadataId: 'order',
			childMetadataId: 'family',
			childGbifId: familyKey,
			parent: order,
			child: family
		});
	} catch (e) {
		console.error(e);
	}
}

process.stderr.write(`\x1b[KBuilding mapping orders->classes...\r`);

for (const { order, class: klass, orderKey } of tree.items) {
	if (!tree.orders[order]) tree.orders[order] = {};
	tree.orders[order] = klass;
	try {
		await setParent({
			parentMetadataId: 'class',
			childMetadataId: 'order',
			childGbifId: orderKey,
			parent: klass,
			child: order
		});
	} catch (e) {
		console.error(e);
	}
}

process.stderr.write(`\x1b[KBuilding mapping classes->phyla...\r`);

for (const { class: klass, phylum, classKey } of tree.items) {
	if (!tree.classes[klass]) tree.classes[klass] = {};
	tree.classes[klass] = phylum;
	try {
		await setParent({
			parentMetadataId: 'phylum',
			childMetadataId: 'class',
			childGbifId: classKey,
			parent: phylum,
			child: klass
		});
	} catch (e) {
		console.error(e);
	}
}

process.stderr.write(`\x1b[KBuilding mapping phyla->kingdoms...\r`);

for (const { phylum, kingdom, phylumKey } of tree.items) {
	if (!tree.phyla[phylum]) tree.phyla[phylum] = {};
	tree.phyla[phylum] = kingdom;
	try {
		await setParent({
			parentMetadataId: 'kingdom',
			childMetadataId: 'phylum',
			childGbifId: phylumKey,
			parent: kingdom,
			child: phylum
		});
	} catch (e) {
		console.error(e);
	}
}

for (const { kingdom, kingdomKey } of tree.items) {
	const kingdoms = newProtocol.metadata[`${protocol.id}__kingdom`].options.map((o) => o.label);
	if (kingdoms.includes(kingdom)) continue;

	newProtocol.metadata[`${protocol.id}__kingdom`].options.push(
		/** @satisfies {MetadataEnumVariant} */ ({
			label: kingdom,
			key: kingdom.toLowerCase().replaceAll(' ', '_'),
			description: '',
			learnMore: `https://gbif.org/species/${kingdomKey}`
		})
	);
}

writeFileSync(
	path.join(here, '../examples/arthropods.cigaleprotocol.json'),
	JSON.stringify(newProtocol, null, 2)
);

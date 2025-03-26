const CLASSMAPPING_URL = 'https://cigaleapp.github.io/models/class_mapping.txt';

async function fetchTaxon(taxon) {
	const response = await fetch(
		`https://api.gbif.org/v1/species/search?datasetKey=d7dddbf4-2cf0-4f39-9b2a-bb099caae36c&q=${encodeURIComponent(taxon)}`
	);
	const data = await response.json();
	return data.results[0];
}

process.stderr.write(`Fetching species list from ${CLASSMAPPING_URL}...\r`);
const species = await fetch(CLASSMAPPING_URL)
	.then((response) => response.text())
	.then((text) =>
		text
			.split('\n')
			.map((sp) => sp.trim())
			.filter(Boolean)
	);

const out = {
	phyla: {},
	classes: {},
	orders: {},
	families: {},
	genera: {},
	species: {},
	items: []
};
let done = 0;
const total = species.length;

process.stderr.write(`\x1b[KGot ${total} species\r`);

for (const sp of species) {
	process.stderr.write(`\x1b[K${done}/${total} ${sp}\r`);

	const {
		key,
		nubKey,
		kingdom,
		phylum,
		order,
		family,
		genus,
		species,
		taxonomicStatus,
		class: klass
	} = await fetchTaxon(sp);

	out.items.push({
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
		...(taxonomicStatus === 'ACCEPTED' ? {} : { notAcceptedWhy: taxonomicStatus })
	});
	done++;
}

process.stderr.write(`\x1b[KBuilding mapping species->genera...\r`);

for (const { genus, species } of out.items) {
	if (!out.species[species]) out.species[species] = {};
	out.species[species] = genus;
}

process.stderr.write(`\x1b[KBuilding mapping genera->families...\r`);

for (const { genus, family } of out.items) {
	if (!out.genera[genus]) out.genera[genus] = {};
	out.genera[genus] = family;
}

process.stderr.write(`\x1b[KBuilding mapping families->orders...\r`);

for (const { family, order } of out.items) {
	if (!out.families[family]) out.families[family] = {};
	out.families[family] = order;
}

process.stderr.write(`\x1b[KBuilding mapping orders->classes...\r`);

for (const { order, class: klass } of out.items) {
	if (!out.orders[order]) out.orders[order] = {};
	out.orders[order] = klass;
}

process.stderr.write(`\x1b[KBuilding mapping classes->phyla...\r`);

for (const { class: klass, phylum } of out.items) {
	if (!out.classes[klass]) out.classes[klass] = {};
	out.classes[klass] = phylum;
}

process.stderr.write(`\x1b[KBuilding mapping phyla->kingdoms...\r`);

for (const { phylum, kingdom } of out.items) {
	if (!out.phyla[phylum]) out.phyla[phylum] = {};
	out.phyla[phylum] = kingdom;
}

console.log(JSON.stringify(out, null, 2));

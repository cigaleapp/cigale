// curl -X 'GET' 'https://api.gbif.org/v1/species/search?datasetKey=d7dddbf4-2cf0-4f39-9b2a-bb099caae36c&q=Allacma%20fusca'  -H 'accept: application/json'

async function fetchTaxon(taxon) {
	const response = await fetch(
		`https://api.gbif.org/v1/species/search?datasetKey=d7dddbf4-2cf0-4f39-9b2a-bb099caae36c&q=${encodeURIComponent(taxon)}`
	);
	const data = await response.json();
	return data.results[0];
}

const species = await fetch('https://media.gwen.works/cigale/models/class_mapping.txt')
	.then((response) => response.text())
	.then((text) =>
		text
			.split('\n')
			.map((sp) => sp.trim())
			.filter(Boolean)
	);

const out = {};
let done = 0;
const total = species.length;
for (const sp of species) {
	process.stderr.write(`\x1b[K${done}/${total} ${sp}\r`);
	const { key, nubKey, kingdom, phylum, order, family, genus, taxonomicStatus } =
		await fetchTaxon(sp);
	out[sp] = {
		gbifId: key,
		gbifBackboneId: nubKey,
		kingdom,
		phylum,
		order,
		family,
		genus,
		// ACCEPTED, DOUBTFUL, SYNONYM, HETEROTYPIC_SYNONYM, HOMOTYPIC_SYNONYM, PROPARTE_SYNONYM, MISAPPLIED
		accepted: taxonomicStatus === 'ACCEPTED',
		...(taxonomicStatus === 'ACCEPTED' ? {} : { notAcceptedWhy: taxonomicStatus })
	};
	done++;
}

console.log(JSON.stringify(out, null, 2));

// curl -X 'GET' 'https://api.gbif.org/v1/species/search?datasetKey=d7dddbf4-2cf0-4f39-9b2a-bb099caae36c&q=Allacma%20fusca'  -H 'accept: application/json'

async function fetchTaxon(taxon) {
	const response = await fetch(
		`https://api.gbif.org/v1/species/search?datasetKey=d7dddbf4-2cf0-4f39-9b2a-bb099caae36c&q=${encodeURIComponent(taxon)}`
	);
	const data = await response.json();
	return data.results[0];
}

const species = await fetch('https://media.gwen.works/cigale/models/class_mapping.txt').then(
	(response) => response.text()
);

const out = {};

for (const sp of species
	.split('\n')
	.map((sp) => sp.trim())
	.filter(Boolean)) {
	const taxon = await fetchTaxon(sp);
	out[sp] = taxon;
}

console.log(JSON.stringify(out, null, 2));

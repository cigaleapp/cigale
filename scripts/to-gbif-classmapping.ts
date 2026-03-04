/**
 * Convert a species names list to a GBIF IDs list
 * Not-found species will be added as empty lines.
 * Order is preserved.
 *
 * This script is mostly useful to convert classmapping files, which are often in species names
 *
 * Usage:
 * bun run to-gbif-classmapping.ts INPUT_FILE OUTPUT_FILE
 */

import { ArkErrors, type } from 'arktype';

async function gbifIdOf(name: string) {
	const response = await fetch(
		'https://api.gbif.org/v1/species/match?' +
			new URLSearchParams({
				scientificName: name
			})
	)
		.then((res) => res.json())
		.then((m) =>
			type({
				rank: "'GENUS' | 'SPECIES'",
				matchType: "'EXACT'",
				usageKey: 'number'
			})(m)
		);

	if (response instanceof ArkErrors) return undefined;
	// console.log(response)

	return response.usageKey.toString();
}

const input = await Bun.file(process.argv[2]).text();
const lines = input.split('\n');
if (!lines.at(-1)) lines.pop();

let output = '';

for (const name of lines) {
	const gbifId = await gbifIdOf(name);
	if (!gbifId) console.warn(`No GBIF ID found for "${name}"`);
	output += (gbifId ?? '') + '\n';
}

await Bun.write(process.argv[3], output);

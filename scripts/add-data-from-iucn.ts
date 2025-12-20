import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { ArkErrors, type } from 'arktype';
import { formatDuration } from 'date-fns';

import type { ExportedProtocol } from '../src/lib/schemas/protocols';
import { EtaCalculator } from './eta';

const token = process.env.IUCN_API_TOKEN;
if (!token) throw new Error('IUCN_API_TOKEN is not set in environment variables.');

const notFoundCache = new Set<string>();
try {
	const species = await fetch(
		'https://raw.githubusercontent.com/cigaleapp/models/main/iucn-not-found.json'
	)
		.then((res) => res.json())
		.then((data: Record<string, { name: string }>) => Object.values(data).map((s) => s.name));

	for (const s of species) {
		notFoundCache.add(s);
	}
} catch (e) {
	error(`Error fetching IUCN not-found cache: ${e}`);
}

const IUCNResponse = type.or(
	{
		error: 'string'
	},
	{
		assessments: type({
			latest: 'boolean',
			red_list_category_code: type.enumerated(
				'EX',
				'EW',
				'CR',
				'EN',
				'VU',
				'NT',
				'LC',
				'DD',
				'NE',
				'NA',
				'I',
				'LR/cd',
				'V',
				'E',
				'LR/nt',
				'LR/lc',
				'R'
			)
		}).array()
	}
);

if (import.meta.main) {
	await augmentProtocol(
		path.join(import.meta.dir, '../examples/arthropods.cigaleprotocol.json'),
		'species'
	);
}

async function augmentProtocol(filepath: string, metadata: string) {
	const protocol: typeof ExportedProtocol.inferOut = JSON.parse(readFileSync(filepath, 'utf8'));

	await augmentMetadata(protocol.metadata[`${protocol.id}__${metadata}`]);

	writeFileSync(filepath, JSON.stringify(protocol, null, 2), 'utf8');
}

async function augmentMetadata(metadata: (typeof ExportedProtocol.inferOut)['metadata'][string]) {
	if (!('options' in metadata) || !metadata.options)
		throw new Error(`No options found in metadata “${metadata.label}”`);

	const total = metadata.options.length;
	let done = 0;
	let added = 0;

	const eta = new EtaCalculator({
		averageOver: 2_000,
		totalSteps: total - notFoundCache.size
	});

	for (const [i, option] of metadata.options.entries()) {
		const progress = `${((done / (total - notFoundCache.size)) * 100).toFixed(0).padStart(3)}% [${(i + 1).toString().padStart(total.toString().length)}/${total} | ${added.toString().padStart(total.toString().length)}] → ${eta.display(done)} `;

		if (notFoundCache.has(option.label)) {
			// notice(`${progress} ${option.label} is known to be not found in IUCN, skipping.`);
			continue;
		}

		const { parsed: iucn, raw } = await fetchIUCNData(option.label);

		done++;
		eta.step();

		if (iucn instanceof ArkErrors) {
			error(
				`${progress} invalid response from IUCN for “${option.label}”: ${iucn.summary}. Response was ${raw}`
			);
			continue;
		}

		if ('error' in iucn) {
			if (iucn.error === 'Not found') {
				notice(`${progress} ${option.label} not found in IUCN`);
			} else {
				error(`${progress} error from IUCN for ${option.label}: ${iucn.error}`);
			}
			continue;
		}

		if (iucn.assessments.length === 0) {
			notice(`${progress} ${option.label} has no IUCN assessments`);
			continue;
		}

		let assessment = iucn.assessments.find((a) => a.latest);

		if (!assessment) {
			warning(
				`${progress} ${option.label} has no up-to-date IUCN assessment, using an outdated one.`
			);
			assessment = iucn.assessments[0];
		}

		if (assessment.red_list_category_code === 'NE') {
			warning(
				`${progress} ${option.label} has not been evaluated (NE) according to IUCN, not storing status.`
			);
			continue;
		}

		if (assessment.red_list_category_code === 'DD') {
			warning(
				`${progress} ${option.label} is data deficient (DD) according to IUCN, not storing status.`
			);
			continue;
		}

		if (assessment.red_list_category_code === 'NA') {
			warning(
				`${progress} ${option.label} has no applicable status (NA) according to IUCN, not storing status.`
			);
			continue;
		}

		if (assessment.red_list_category_code === 'I') {
			warning(
				`${progress} ${option.label} is indicated as Invasive (I) according to IUCN, not storing status.`
			);
			continue;
		}

		if (assessment.red_list_category_code === 'LR/cd') {
			warning(
				`${progress} ${option.label} has status Lower Risk/conservation dependent (LR/cd) according to IUCN, mapping to Near Threatened (NT).`
			);

			assessment.red_list_category_code = 'NT';
		}

		if (assessment.red_list_category_code === 'V') {
			warning(
				`${progress} ${option.label} has status Vulnerable (V) according to IUCN, mapping to Vulnerable (VU).`
			);

			assessment.red_list_category_code = 'VU';
		}

		if (assessment.red_list_category_code === 'E') {
			warning(
				`${progress} ${option.label} has status Endangered (E) according to IUCN, mapping to Endangered (EN).`
			);

			assessment.red_list_category_code = 'EN';
		}

		if (assessment.red_list_category_code === 'LR/nt') {
			warning(
				`${progress} ${option.label} has status Lower Risk/near threatened (LR/nt) according to IUCN, mapping to Near Threatened (NT).`
			);

			assessment.red_list_category_code = 'NT';
		}

		if (assessment.red_list_category_code === 'LR/lc') {
			warning(
				`${progress} ${option.label} has status Lower Risk/least concern (LR/lc) according to IUCN, mapping to Least Concern (LC).`
			);

			assessment.red_list_category_code = 'LC';
		}

		if (assessment.red_list_category_code === 'R') {
			warning(
				`${progress} ${option.label} has status Rare (R) according to IUCN, mapping to Near Threatened (NT).`
			);

			assessment.red_list_category_code = 'NT';
		}

		log(`${progress} ${option.label} has status ${assessment.red_list_category_code}`);
		added++;
		option.cascade = {
			...option.cascade,
			conservation_status: assessment.red_list_category_code.toLowerCase()
		};
	}
}

async function fetchIUCNData(speciesName: string, { rateLimitWait = 5_000 } = {}) {
	const [genus_name, species_name] = speciesName.split(' ');

	const response = await fetch(
		'https://api.iucnredlist.org/api/v4/taxa/scientific_name?' +
			new URLSearchParams({ genus_name, species_name }),
		{
			headers: {
				Authorization: `Bearer ${token}`
			}
		}
	);

	if (response.status === 429) {
		notice(
			`-- Rate limit exceeded, waiting ${formatDuration({ seconds: rateLimitWait * 1e-3 })}...`
		);
		await new Promise((resolve) => setTimeout(resolve, rateLimitWait));
		return fetchIUCNData(speciesName, { rateLimitWait: Math.floor(rateLimitWait * Math.E) });
	}

	const text = await response.text();

	try {
		return {
			raw: text,
			parsed: IUCNResponse(JSON.parse(text))
		};
	} catch (e) {
		return {
			raw: text,
			parsed: {
				error: `Response from IUCN could not be parsed as JSON. Got HTTP ${response.status} ${response.statusText} with body “${text}”. Error is ${e}`
			}
		};
	}
}

// ANSI control sequences
class CC {
	static clearline = '\x1b[2K';
	static red = '\x1b[31m';
	static reset = '\x1b[0m';
	static dim = '\x1b[2m';
	static blue = '\x1b[34m';
	static bold = '\x1b[1m';
	static yellow = '\x1b[33m';
	static cyan = '\x1b[36m';
}

function notice(message: string) {
	console.info(`${CC.dim}${message}${CC.reset}`);
}

function error(message: string) {
	console.info(`${CC.red}${message}${CC.reset}`);
}

function warning(message: string) {
	console.info(`${CC.yellow}${message}${CC.reset}`);
}

function log(message: string) {
	console.info(`${CC.blue}${message}${CC.reset}`);
}

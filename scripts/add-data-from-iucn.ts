import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { ArkErrors, type } from 'arktype';
import { formatDuration } from 'date-fns';

import { MetadataEnumVariant } from '../src/lib/schemas/metadata.js';
import { type ExportedProtocol } from '../src/lib/schemas/protocols.js';
import { EtaCalculator } from './eta.js';

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

const Assessment = type({
	taxon_scientific_name: 'string',
	'red_list_category_code?': type.enumerated(
		'A',
		'CR',
		'CT',
		'CUSTOM',
		'DD',
		'E',
		'EN',
		'EW',
		'Ex',
		'Ex?',
		'EX',
		'Ex/E',
		'I',
		'K',
		'LC',
		'LR/cd',
		'LR/lc',
		'LR/nt',
		'N/A',
		'NA',
		'NE',
		'NR',
		'nt',
		'NT',
		'O',
		'R',
		'RE',
		'T',
		'V',
		'VU'
	)
});

const IUCNResponse = type.or({ error: 'string' }, { assessments: Assessment.array() });

if (import.meta.main) {
	await augmentProtocol(path.join(import.meta.dir, '../examples/arthropods.cigaleprotocol.json'));
}

async function augmentProtocol(filepath: string) {
	const protocol: typeof ExportedProtocol.inferOut = JSON.parse(readFileSync(filepath, 'utf8'));

	const families = protocol.metadata[`${protocol.id}__family`].options!;
	const genii = protocol.metadata[`${protocol.id}__genus`].options!;
	const species = protocol.metadata[`${protocol.id}__species`].options!;

	await augmentMetadata({
		species: protocol.metadata[`${protocol.id}__species`],
		// Mapping species keys to their family's name
		groupName: 'family',
		group: Object.fromEntries(
			species.map((s) => [
				s.key,
				walkCascadeParents(s, { genus: genii }, { family: families })?.label
			])
		)
	});

	writeFileSync(filepath, JSON.stringify(protocol, null, 2), 'utf8');
}

type Metadata = (typeof ExportedProtocol.inferOut)['metadata'][string];

async function augmentMetadata({
	species: metadata,
	groupName,
	group
}: {
	species: Metadata;
	groupName: 'family' | 'order' | 'phylum';
	group: Record<string, string | undefined>;
}) {
	if (!('options' in metadata) || !metadata.options)
		throw new Error(`No options found in metadata “${metadata.label}”`);

	const groupedSpecies = Map.groupBy(metadata.options, (option) => group[option.key]);

	notice(`-- Fetching IUCN ${groupName} names...`);
	const iucnGroups = await fetch(`https://api.iucnredlist.org/api/v4/taxa/${groupName}/`, {
		headers: {
			Authorization: `Bearer ${token}`
		}
	})
		.then((res) => res.json())
		.then((data) => new Set<string>(data[`${groupName}_names`]));

	for (const groupName of groupedSpecies.keys()) {
		if (!groupName) continue;
		if (!iucnGroups.has(groupName.toUpperCase())) {
			warning(
				`-- Group "${groupName}" is not recognized by IUCN, species under this group will be skipped.`
			);
			groupedSpecies.delete(groupName);
		}
	}

	const total = groupedSpecies.size;
	let done = 0;
	let added = 0;

	const eta = new EtaCalculator({
		averageOver: Math.floor(groupedSpecies.size / 10 / 2),
		totalSteps: groupedSpecies.size
	});

	for (const [group, species] of groupedSpecies.entries()) {
		const progress = `${((done / total) * 100).toFixed(0).padStart(3)}% [${done.toString().padStart(total.toString().length)}/${total} | ${added.toString().padStart(total.toString().length)}] → ${eta.display(done)} `;

		if (!group) {
			error(
				`${progress} the following species have no order assigned, skipping IUCN fetch: ${species
					.map((s) => s.label)
					.join(', ')}`
			);
			done++;
			eta.step();
			continue;
		}

		const { raw, parsed: iucn } = await fetchIUCNData(groupName, group, {
			checkFor: species.map((s) => s.label)
		});

		done++;
		eta.step();

		if (iucn instanceof ArkErrors) {
			error(
				`${progress} invalid response from IUCN for “${group}”: ${iucn.summary}. Response was ${raw}`
			);
			continue;
		}

		if ('error' in iucn) {
			error(`${progress} error from IUCN for ${group}: ${iucn.error}`);
			continue;
		}

		if (iucn.assessments.length === 0) {
			warning(`${progress} ${group} has no IUCN assessments`);
			continue;
		}

		for (const option of species) {
			const assessment = iucn.assessments.find(
				(a) => a.taxon_scientific_name === option.label
			);

			if (!assessment) {
				// notice(`${progress} ${option.label} has no IUCN assessment`);
				continue;
			}

			if (!assessment.red_list_category_code) {
				warning(
					`${progress} ${option.label} has no red list category code in IUCN assessment, not storing status.`
				);
				continue;
			}

			const code = handleOldCodes(assessment.red_list_category_code);

			if (!code) {
				warning(
					`${progress} ${option.label} has status ${assessment.red_list_category_code}, not storing status`
				);
				continue;
			}

			log(
				`${progress} ${option.label} has status ${code} ${
					code !== assessment.red_list_category_code
						? `<- ${assessment.red_list_category_code}`
						: ''
				}`
			);

			added++;

			option.cascade = {
				...option.cascade,
				conservation_status: code?.toLowerCase()
			};
		}
	}
}

async function fetchIUCNData(
	group: 'order' | 'family' | 'phylum',
	name: string,
	{
		rateLimitWait = 5_000,
		checkFor = [] as string[],
		previousPages = [] as (typeof Assessment.infer)[][]
	} = {}
): Promise<{
	raw: string;
	parsed: ArkErrors | typeof IUCNResponse.inferOut;
}> {
	const response = await fetch(
		`https://api.iucnredlist.org/api/v4/taxa/${group}/${encodeURIComponent(name)}?latest=true&page=${previousPages.length + 1}`,
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
		return fetchIUCNData(group, name, {
			rateLimitWait: Math.floor(rateLimitWait * Math.E),
			previousPages,
			checkFor
		});
	}

	const text = await response.text();

	try {
		const parsed = IUCNResponse(JSON.parse(text));
		if (parsed instanceof ArkErrors) {
			return { raw: text, parsed };
		}

		if ('error' in parsed) {
			return { raw: text, parsed };
		}

		if (parsed.assessments.length >= 100) {
			// Check if we already have all the species we were looking for
			const allAssessments = new Set([
				...parsed.assessments.map((a) => a.taxon_scientific_name),
				...previousPages.flatMap((as) => as.map((a) => a.taxon_scientific_name))
			]);

			if (checkFor.every((s) => allAssessments.has(s))) {
				notice(
					`-- All requested species found for ${group} ${name}, not fetching further pages.`
				);
				return {
					raw: text,
					parsed: {
						assessments: [...previousPages.flatMap((as) => as), ...parsed.assessments]
					}
				};
			}

			notice(
				`-- Fetching next page for ${group} ${name} (page ${previousPages.length + 1 + 1})...`
			);

			return await fetchIUCNData(group, name, {
				rateLimitWait,
				checkFor,
				previousPages: [...previousPages, parsed.assessments]
			});
		}

		return {
			raw: text,
			parsed: {
				assessments: [...previousPages.flat(), ...parsed.assessments]
			}
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

function getOption(options: (typeof MetadataEnumVariant.infer)[], key: string) {
	return options.find((o) => o.key === key);
}

/**
 * Walk up a chain of cascades.
 * @param option The starting option
 * @param parents The parent options, from closest to furthest
 */
function walkCascadeParents(
	option: typeof MetadataEnumVariant.infer,
	...parents: Array<{ [metadataLabel: string]: (typeof MetadataEnumVariant.infer)[] }>
) {
	if (parents.length === 0) return option;

	const [parent, ...grandparents] = parents;
	const [parentLabel, parentOptions] = Object.entries(parent)[0];

	const parentKey = option.cascade?.[parentLabel];
	if (!parentKey) return undefined;
	const parentOption = getOption(parentOptions, parentKey);
	if (!parentOption) return undefined;

	return walkCascadeParents(parentOption, ...grandparents);
}

//   'A: Abundant',
//   'CR: Critically Endangered',
//   'CT: Commercially Threatened',
//   'CUSTOM: Unknown',
//   'DD: Data Deficient',
//   'E: Endangered',
//   'EN: Endangered',
//   'EW: Extinct in the Wild',
//   'Ex: Unknown',
//   'Ex: Extinct',
//   'Ex?: Extinct?',
//   'EX: Unknown',
//   'EX: Extinct',
//   'Ex/E: Extinct/Endangered',
//   'I: Indeterminate',
//   'K: Insufficiently Known',
//   'LC: Unknown',
//   'LR/cd: Lower Risk/conservation dependent',
//   'LR/lc: Unknown',
//   'LR/lc: Lower Risk/least concern',
//   'LR/nt: Lower Risk/near threatened',
//   'N/A: Unknown',
//   'N/A: Unknown',
//   'NE: Not Evaluated',
//   'NR: Not Recognized',
//   'NR: Not Recognized',
//   'nt: Not Threatened',
//   'NT: Unknown',
//   'NT: Unknown',
//   'O: Out of Danger',
//   'R: Rare',
//   'T: Threatened',
//   'V: Vulnerable',
//   'VU: Vulnerable'
function handleOldCodes(
	code: typeof Assessment.infer.red_list_category_code
): 'CR' | 'EN' | 'VU' | 'NT' | 'LC' | 'EX' | null {
	const mapping = {
		'A' : 'LC',
		'CR' : 'CR',
		'CT' : 'VU',
		'CUSTOM' : null,
		'DD' : null,
		'E' : 'EN',
		'EN' : 'EN',
		'EW' : 'EX',
		'Ex' : null,
		'EX' : 'EX',
		'Ex?' : null,
		'Ex/E' : 'EX',
		'I' : null,
		'K' : null,
		'LC' : 'LC',
		'LR/cd' : 'NT',
		'LR/lc' : 'LC',
		'LR/nt' : 'NT',
		'N/A' : null,
		'NA' : null,
		'NE' : null,
		'NR' : null,
		'nt' : 'NT',
		'NT' : 'NT',
		'O' : 'LC',
		'R' : 'NT',
		'RE' : 'EX',
		'T' : 'VU',
		'V' : 'VU',
		'VU' : 'VU',
	} as const

	return code ? mapping[code] : null
}

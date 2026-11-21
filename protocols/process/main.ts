import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type {
	Enricher,
	Identifier,
	NameProvider,
	Option,
	OptionExtra,
	Specializer,
	TaxonomyProvider,
} from './modules.js';

import exitHook from 'exit-hook';

import { BirdNetClassmapping } from './birdnet.js';
import { writeAllCaches } from './caching.js';
import { GBIFID, GBIFTaxonomy } from './gbif.js';
import { GoogleDriveSlides, GoogleSlides } from './gslides.js';
import { IRITModels } from './irit.js';
import { IUCN } from './iucn.js';
import { JessicaJoachim } from './jj.js';
import { logger, progress } from './progress.js';

await run({
	metadataId: (clade) => clade,
	output: { options: 'options', images: 'assets' },
	modules: {
		sources: [new GoogleDriveSlides(), new IRITModels(), new BirdNetClassmapping()],
		// sources: [new GoogleDriveSlides()],
		identifier: new GBIFID(),
		taxonomies: [new GBIFTaxonomy()],
		enrich: [new JessicaJoachim(), new IUCN(), new GoogleSlides()],
		specializations: [
			new (class implements Specializer {
				protocolId = 'com.example.all';
				name = 'debug-all' as const;

				include() {
					return true;
				}
			})(),
		],
	},
});

async function run(plan: {
	/** Construct metadata ID from the clade name. */
	metadataId: (clade: string) => string;
	output: {
		/** Directory where to output each specialization */
		options: string;
		/** Directory where to output images of each specialization */
		images: string;
	};
	modules: {
		sources: NameProvider[];
		identifier: Identifier;
		taxonomies: TaxonomyProvider[];
		enrich: Enricher[];
		specializations: Specializer[];
	};
}) {
	const removeExitHook = exitHook(() => {
		progress.stop();
		writeAllCaches();
	});

	/** clade:name */
	const names = new Map<`${string}:${string}`, Option>();

	logger.info(`Listing names from ${plan.modules.sources.length} sources`);

	await Promise.all(
		plan.modules.sources.map(async (source) => {
			for await (const option of source.scan()) {
				const { clade, name } = option;
				names.set(`${clade}:${name}`, {
					...option,
					provenance: source.name,
				});
			}

			progress.increment();
		})
	);

	logger.info(`Gathered ${names.size} names`);

	progress.phase('identify', names.size);

	/** Key is Option.id */
	const options = new Map<string, Option & { id: string }>();

	for (const option of names.values()) {
		const id = await plan.modules.identifier.identify(option);
		progress.increment();
		if (!id) continue;
		options.set(id, { ...option, id });
	}

	logger.info(`Identified ${options.size} names`);

	progress.phase('taxonomy', options.size * plan.modules.taxonomies.length);

	/** Find taxonomies then identify again */

	let done = 0;
	for (const taxonomy of plan.modules.taxonomies) {
		for (const option of options.values()) {
			const parents = await taxonomy.parents(option);

			progress.set(++done);

			for (const parent of parents) {
				const id = await plan.modules.identifier.identify(parent);
				if (!id) continue;

				options.set(id, {
					...parent,
					id,
					parents: selectHigherClades(parent, parents) as Array<Option & { id: string }>,
				});
			}

			options.set(option.id, {
				...option,
				parents: parents.map((p) => ({ id: p.id!, clade: p.clade })),
			});
		}
	}

	logger.info(`Found ${options.size - names.size} new taxa from taxonomies`);

	progress.phase('enrich', options.size * plan.modules.enrich.length);

	/** Enrich */

	await Promise.all(
		plan.modules.enrich.map(async (enricher) => {
			for (const option of options.values()) {
				option.extras ??= [];
				option.extras.push(await enricher.enrich(option));
				progress.increment();
			}
		})
	);

	logger.info(`Enriched options`);

	progress.phase('specialize', plan.modules.specializations.length);

	/** Specialize */

	await Promise.all(
		plan.modules.specializations.map(async (specializer) => {
			const specialized = [...options.values()].filter((option) =>
				specializer.include(option)
			);

			const clades = new Set(specialized.map((option) => option.clade));

			for (const clade of clades) {
				const variants = specialized
					.filter((option) => option.clade === clade)
					.map((option) => {
						const extra = mergeExtras(option);
						const implicitCascade = Object.fromEntries(
							(option.parents ?? []).map(
								(parent) =>
									[
										`${specializer.protocolId}__${plan.metadataId(parent.clade)}`,
										parent.id,
									] as const
							)
						);

						return {
							key: option.id,
							label: option.name,
							...extra,
							cascade: {
								...implicitCascade,
								...extra.cascade,
							},
						};
					});

				const output = path.resolve(
					plan.output.options,
					specializer.name,
					`${clade}.jsonl`
				);

				const header = { count: variants.length };

				// Output as JSON lines
				mkdirSync(path.dirname(output), { recursive: true });
				writeFileSync(
					output,
					[header, ...variants].map((option) => JSON.stringify(option)).join('\n')
				);

				logger.info(
					`Specialized ${clade} with ${specializer.name} to ${path.relative('.', output)}`
				);

				progress.increment();
			}
		})
	);

	removeExitHook();
	progress.stop();
	writeAllCaches();
}

function mergeExtras(option: Option): OptionExtra {
	if (!option.extras) return {};

	const keys = new Set<keyof OptionExtra>(
		option.extras.flatMap(({ extra }) => Object.keys(extra) as Array<keyof OptionExtra>)
	);

	// Resolve which extra (index) to use for every key

	const output = Object.fromEntries(
		[...keys].map((key) => {
			// Find greatest priority extra that has the key
			const { extra } = (option.extras ?? [])
				.filter(({ extra }) => key in extra)
				.sort((a, b) => -(b.priority - a.priority))
				.at(0)!;

			return [key, extra[key]] as const;
		})
	);

	// Cascades

	const allCascadeKeys = new Set(
		option.extras.flatMap(({ extra }) => Object.keys(extra.cascade ?? {}))
	);

	output.cascade = Object.fromEntries(
		[...allCascadeKeys].map((key) => {
			// Find greatest priority extra that has the key
			const { extra } = (option.extras ?? [])
				.filter(({ extra }) => extra.cascade && key in extra.cascade)
				.sort((a, b) => -(b.priority - a.priority))
				.at(0)!;

			return [key, extra.cascade![key]!] as const;
		})
	);

	// Synonyms & images (no priorities there! should we have some? maybe for the images order?)

	output.synonyms = [...new Set(option.extras.flatMap(({ extra }) => extra.synonyms ?? []))];

	output.images = [...new Set(option.extras.flatMap(({ extra }) => extra.images ?? []))];

	return output;
}

function selectHigherClades(option: Option, others: Option[]): Option[] {
	const order = [
		'kingdom',
		'phylum',
		'order',
		'class',
		'family',
		'genus',
		'species',
		'subspecies',
	];

	const specificity = (o: Option) => order.indexOf(o.clade);

	return others.filter((o) => specificity(o) > specificity(option));
}

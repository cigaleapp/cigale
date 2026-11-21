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

import { sum, zip } from 'es-toolkit';
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
		sources: [new GoogleDriveSlides(), new IRITModels('full'), new BirdNetClassmapping()],
		// sources: [new IRITModels('light'), new GoogleDriveSlides()],
		identifier: new GBIFID(),
		taxonomy: new GBIFTaxonomy(),
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
		// we only support one because of progress bar computations
		taxonomy: TaxonomyProvider;
		enrich: Enricher[];
		specializations: Specializer[];
	};
}) {
	const removeExitHook = exitHook(() => {
		writeAllCaches();
		progress.stop();
	});

	/** clade:name */
	const names = new Map<`${string}:${string}`, Option>();

	logger.info(`Listing names from ${plan.modules.sources.length} sources`);

	await Promise.all(
		plan.modules.sources.map(async (source) => {
			let count = 0;
			for await (const option of source.scan()) {
				const { clade, name } = option;
				count++;
				names.set(`${clade}:${name}`, {
					...option,
					provenance: source.name,
				});
			}

			progress.increment();
			logger.info(`Listed ${count} names via ${source.name}`);
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

	progress.phase('taxonomy', options.size);

	const queries = [...options.values()];

	// Find taxonomies then identify again
	for (const option of queries) {
		const parents = await plan.modules.taxonomy.parents(option);

		progress.increment();

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

	logger.info(`Found ${options.size - names.size} new taxa from taxonomies`);
	/** Enrich */

	progress.phase('enrichers', plan.modules.enrich.length);

	const optsPerModule: Array<Option[]> = [];

	for (const enricher of plan.modules.enrich) {
		await enricher.init();
		optsPerModule.push([...options.values()].filter((opt) => enricher.available(opt)));
		progress.increment();
		logger.info(
			`Initialized enricher ${enricher.name}: ${optsPerModule.at(-1)!.length} options available`
		);
	}

	progress.phase('enrich', sum(optsPerModule.map((opts) => opts.length)));

	const CHUNKSIZE = 5_000;
	await Promise.all(
		zip(plan.modules.enrich, optsPerModule).map(async ([enricher, options]) => {
			for (let i = 0; i < options.length; i += CHUNKSIZE) {
				const chunk = options.slice(i, i + CHUNKSIZE);

				for await (const { id, ...extra } of enricher.enrich(chunk)) {
					const option = options.find((o) => o.id === id);
					if (!option) throw new Error(`Option with id ${id} not found!`);

					option.extras ??= [];
					option.extras.push(extra);
				}

				progress.increment(chunk.length);
			}

			logger.info(`Finished with enricher ${enricher.name}`);
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

			// precomputed total assumes 1 clade per module
			progress.total += clades.size - 1;

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
	writeAllCaches();
	progress.stop();
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

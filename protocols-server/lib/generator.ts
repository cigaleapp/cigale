import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type {
	Enricher,
	IdentifierProvider,
	MetadataProvider,
	NameProvider,
	Option,
	OptionExtra,
	Specializer,
	TaxonomyProvider,
} from './modules.js';

import { sum } from 'es-toolkit';
import exitHook from 'exit-hook';

import { writeAllCaches } from './caching.js';
import { writeMetadataToProtocol } from './modules.js';
import { clearProgressFile, logger, progress } from './progress.js';
import { Metadata } from './types.js';

export async function run(plan: {
	/** Construct metadata ID from the clade name. */
	metadataId: (clade: string) => string;
	output: {
		/** Directory where to output each specialization */
		options: string;
		/** Directory where to output images of each specialization */
		images: string;
	};
	modules: {
		/** Where to get taxon names from */
		sources: NameProvider[];
		/** How to put a unique identifier on a taxon */
		identifier: IdentifierProvider;
		// we only support one because of progress bar computations
		/** How to find the taxonomical parents of a taxon */
		taxonomy: TaxonomyProvider;
		/** Ways to add additional info on the taxon */
		enrich: Enricher[];
		/** Ways to select some taxa and turn them into options for enum metadata */
		specializations: Specializer[];
		/** Ways to create new metadata for protocols */
		metadatabuilders: MetadataProvider[];
	};
}) {
	const removeExitHook = exitHook(() => {
		writeAllCaches();
		clearProgressFile();
		progress.stop();
	});

	/** clade:name */
	const names = new Map<`${string}:${string}`, Option>();

	logger.timed(`Listing names from ${plan.modules.sources.length} sources`);

	const nameCountsBySource = new Map<string, number>();
	await Promise.all(
		plan.modules.sources.map(async (source) => {
			progress.start(source.name);

			let count = 0;
			for await (const option of source.scan()) {
				const { clade, name } = option;
				count++;
				names.set(`${clade}:${name}`, {
					...option,
					provenance: source.name,
				});
			}

			progress.finish(source.name);
			nameCountsBySource.set(source.name, count);
			progress.increment();
		})
	);

	logger.timed(
		`Gathered ${names.size} names:\n` +
			[...nameCountsBySource]
				.map(([source, count]) => `- ${source}: ${count} names`)
				.join('\n')
	);

	progress.phase('identify', names.size);

	/** Key is Option.id */
	const options = new Map<string, Option & { id: string }>();

	/** Failure counts by worker */
	const failures = new Map<number, number>();
	await distributeOverThreads([...names.values()], async (option, worker) => {
		const id = await plan.modules.identifier.identify(option);
		progress.increment();

		if (!id) {
			failures.set(worker, (failures.get(worker) ?? 0) + 1);
			progress.ongoing = [
				`${sum([...failures.values()])} failures`,
				`${option.clade} ${option.name} not found`,
			];
			return;
		}

		options.set(id, { ...option, id });
	});

	progress.ongoing = [];

	logger.timed(`Identified ${options.size} names with ${plan.modules.identifier.name}`);

	progress.phase('taxonomy', options.size);

	const queries = [...options.values()];

	await distributeOverThreads(queries, async (option) => {
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
			parents: selectHigherClades(option, parents) as Array<Option & { id: string }>,
		});
	});

	logger.timed(
		`Classified into ${options.size} taxa (${options.size - names.size} added by ${plan.modules.taxonomy.name})`
	);
	/** Enrich */

	progress.phase('enrichers', plan.modules.enrich.length);

	/** Keys are module names */
	const optsPerModule = new Map<string, Option[]>();

	await Promise.all(
		plan.modules.enrich.map(async (enricher) => {
			progress.start(enricher.name);
			await enricher.init();

			optsPerModule.set(
				enricher.name,
				[...options.values()].filter((opt) => enricher.available(opt))
			);

			progress.finish(enricher.name);
			progress.increment();
		})
	);

	logger.timed(
		`Initialized ${optsPerModule.size} enrichers:\n` +
			[...optsPerModule]
				.map(([enricher, options]) => `- ${enricher}: ${options.length} available`)
				.join('\n')
	);

	progress.phase('enrich', sum([...optsPerModule].map(([, opts]) => opts.length)));

	const enriched = new Set<string>();
	const CHUNKSIZE = 5_000;
	await Promise.all(
		plan.modules.enrich.map(async (enricher) => {
			const options = optsPerModule.get(enricher.name) ?? [];
			progress.start(enricher.name);

			for (let i = 0; i < options.length; i += CHUNKSIZE) {
				const chunk = options.slice(i, i + CHUNKSIZE);

				for await (const { id, ...extra } of enricher.enrich(chunk)) {
					const option = options.find((o) => o.id === id);
					if (!option) throw new Error(`Option with id ${id} not found!`);

					option.extras ??= [];
					option.extras.push(extra);

					if (Object.keys(extra.extra).length > 0) enriched.add(id);
				}

				progress.increment(chunk.length);
			}

			progress.finish(enricher.name);
		})
	);

	logger.timed(`Enriched ${enriched.size} options`);

	progress.phase('metadata', plan.modules.metadatabuilders.length);

	const metadatasToAdd = new Map<string, { protocols: string[]; keys: string[] }>();

	await Promise.all(
		plan.modules.metadatabuilders.map(async (builder) => {
			progress.start(builder.name);

			await builder.init();

			metadatasToAdd.set(builder.name, {
				protocols: builder.addTo,
				keys: await Array.fromAsync(builder.list()),
			});

			progress.finish(builder.name);
			progress.increment();
		})
	);

	logger.timed(
		`Will write metadata to ${metadatasToAdd.size} protocols:\n` +
			[...metadatasToAdd]
				.map(([builder, { keys }]) => `- ${builder}: ${keys.length} new metadata`)
				.join('\n')
	);

	progress.phase(
		'metadata',
		sum([...metadatasToAdd].map(([, { protocols, keys }]) => protocols.length + keys.length))
	);

	const written = new Map<[filepath: string, builder: string], number>();
	await Promise.all(
		plan.modules.metadatabuilders.map(async (builder) => {
			progress.start(builder.name);

			const entry = metadatasToAdd.get(builder.name);
			if (!entry) throw new Error(`No entries for ${builder.name}`);

			const { keys, protocols } = entry;
			const metadatas: Metadata[] = [];

			for (const key of keys) {
				const metadata = await builder.build(key);
				if (!metadata) continue;
				metadatas.push(metadata);
				progress.increment();
			}

			for (const protocol of protocols) {
				const filepath = await writeMetadataToProtocol(protocol, ...metadatas);
				written.set([filepath, builder.name], metadatas.length);
				progress.increment();
			}

			progress.finish(builder.name);
		})
	);

	logger.timed(
		`Wrote additional metadata to protocols:\n` +
			[...Map.groupBy([...written], ([filepath]) => filepath)]
				.map(([[filepath], entries]) => {
					const total = sum(entries.map(([, count]) => count));

					const byBuilder = entries.map(
						([[, builder], count]) => `${count} from ${builder}`
					);

					return `- ${path.relative('.', filepath)}: ${total} metadatas added (${byBuilder.join(', ')})`;
				})
				.join('\n')
	);

	progress.phase('specialize', plan.modules.specializations.length);

	/** Specialize */

	const outputs = new Map<string, Map<string, string>>();
	await Promise.all(
		plan.modules.specializations.map(async (specializer) => {
			progress.start(specializer.name);
			const output = new Map<string, string>();

			await specializer.init();

			const specialized = [...options.values()].filter((opt) => specializer.include(opt));

			// Also include options that are parent of an included one
			// this prevents broken taxonomy cascades
			const includedParents = new Set(
				[...specialized.values()].flatMap(({ parents = [] }) => parents.map((p) => p.id))
			);
			for (const id of includedParents) {
				specialized.push(options.get(id)!);
			}

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

				const filepath = path.resolve(
					plan.output.options,
					specializer.name,
					`${clade}.jsonl`
				);

				const header = { count: variants.length };

				// Output as JSON lines
				mkdirSync(path.dirname(filepath), { recursive: true });
				writeFileSync(
					filepath,
					[header, ...variants].map((option) => JSON.stringify(option)).join('\n')
				);

				output.set(clade, filepath);

				progress.increment();
			}

			outputs.set(specializer.name, output);
			progress.finish(specializer.name);
		})
	);

	logger.timed(
		`Specialized into ${outputs.size} protocols:\n` +
			[...outputs]
				.map(
					([sp, files]) =>
						`- ${sp}: wrote ${files.size} clades (${[...files.keys()].join(', ')})`
				)
				.join('\n')
	);

	const longestFilepath = Math.max(
		...[...outputs].flatMap(([, files]) =>
			[...files].map(([, f]) => path.relative('.', f).length)
		)
	);

	if (process.env.VERBOSE) {
		logger.info(
			`Wrote ${sum([...outputs].map(([, files]) => files.size))} files:\n` +
				[...outputs]
					.flatMap(([sp, files]) =>
						[...files]
							.map(([, filepath]) => {
								const header = JSON.parse(
									readFileSync(filepath).toString().split('\n').at(0)!
								);

								return { ...header, filepath };
							})
							.sort((a, b) => -(a.count - b.count))
							.map(({ filepath, count }) =>
								[
									'-',
									count.toString().padStart(6),
									'entries in',
									path.relative('.', filepath).padEnd(longestFilepath),
									`(from ${sp})`,
								].join(' ')
							)
					)
					.join('\n')
		);
	}

	removeExitHook();
	writeAllCaches();
	clearProgressFile();
	progress.stop();
}

function mergeExtras({ extras }: Option): OptionExtra {
	if (!extras) return {};

	return {
		...prioritizedShallowMergeObjects(extras, (ex) => ex),
		cascade: prioritizedShallowMergeObjects(extras, (ex) => ex.cascade),
		narrowerWeights: prioritizedShallowMergeObjects(extras, (ex) => ex.narrowerWeights),
		synonyms: prioritizedShallowMergeArrays(extras, (ex) => ex.synonyms),
		images: prioritizedShallowMergeArrays(extras, (ex) => ex.images),
		extraKeys: prioritizedShallowMergeArrays(extras, (ex) => ex.extraKeys),
	};
}

function prioritizedShallowMergeObjects<V extends Record<string, unknown>>(
	extras: NonNullable<Option['extras']>,
	value: (extra: OptionExtra) => V | undefined
): V {
	const allCascadeKeys = new Set(
		extras.flatMap(({ extra }) => Object.keys(value(extra) ?? {}) as Array<keyof V>)
	);

	return Object.fromEntries(
		[...allCascadeKeys].map((propkey) => {
			// Find greatest priority extra that has the key
			const { extra } = (extras ?? [])
				.filter(({ extra }) => {
					const v = value(extra);
					if (!v) return false;
					return propkey in v;
				})
				.sort((a, b) => -(b.priority - a.priority))
				.at(0)!;

			return [propkey, value(extra)![propkey]!] as const;
		})
	) as V;
}

// TODO: support non-scalars too?
function prioritizedShallowMergeArrays<I extends string | boolean | number>(
	extras: NonNullable<Option['extras']>,
	value: (extra: OptionExtra) => I[] | undefined
): I[] {
	return [...extras]
		.sort((a, b) => b.priority - a.priority)
		.flatMap(({ extra }) => value(extra) ?? []);
}

function selectHigherClades(option: Option, others: Option[]): Option[] {
	/** Ordered from least specific to most specific */
	const CLADES = [
		'kingdom',
		'phylum',
		'order',
		'class',
		'family',
		'genus',
		'species',
		'subspecies',
	];

	const specificity = (o: Option) => CLADES.indexOf(o.clade);

	return others.filter((o) => specificity(o) < specificity(option));
}

async function distributeOverThreads<T>(
	all: T[],
	compute: (item: T, workerIndex: number) => Promise<void>
) {
	const cpuThreads = os.cpus().length;

	const batchsize = Math.ceil(all.length / cpuThreads);

	const indexRanges = Array.from({ length: cpuThreads }).map((_, i) => [
		i * batchsize,
		Math.min((i + 1) * batchsize, all.length),
	]);

	await Promise.all(
		indexRanges.map(async ([start, end], workerIndex) => {
			for (let i = start; i < end; i++) {
				await compute(all[i], workerIndex);
			}
		})
	);
}

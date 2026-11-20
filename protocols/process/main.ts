import { writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Option, OptionExtra } from './modules.js';

import { GBIFID, GBIFTaxonomy } from './gbif.js';
import { JessicaJoachim } from './jj.js';
import { Enrich, Identifier, Names, Specialize, Taxonomy } from './modules.js';

await run({
	metadataId: (clade) => clade,
	output: { options: 'options', images: 'assets' },
	modules: {
		sources: [],
		identifier: new GBIFID(),
		taxonomies: [new GBIFTaxonomy()],
		enrich: [new JessicaJoachim()],
		specializations: [],
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
		sources: Names[];
		identifier: Identifier;
		taxonomies: Taxonomy[];
		enrich: Enrich[];
		specializations: Specialize[];
	};
}) {
	/** clade:name */
	const names = new Map<`${string}:${string}`, Option>();

	await Promise.all(
		plan.modules.sources.map(async (source) => {
			for await (const { clade, name } of source.scan()) {
				names.set(`${clade}:${name}`, {
					clade,
					name,
					provenance: source.name,
				});
			}
		})
	);

	console.info(`Gathered ${names.size} names`);

	/** Key is Option.id */
	const options = new Map<string, Option & { id: string }>();

	for (const name of names.values()) {
		const id = await plan.modules.identifier.identify(name);
		options.set(id, { ...name, id });
	}

	console.info(`Identified names`);

	/** Find taxonomies then identify again */

	for (const taxonomy of plan.modules.taxonomies) {
		for (const option of options.values()) {
			const parents = await taxonomy.parents(option);

			for (const parent of parents) {
				parent.id = await plan.modules.identifier.identify(parent);

				options.set(parent.id, parent as Option & { id: string });
			}

			option.parents = parents.map((p) => ({ id: p.id!, clade: p.clade }));
		}
	}

	console.info(`Found ${options.size - names.size} new taxa from taxonomies`);

	/** Enrich */

	await Promise.all(
		plan.modules.enrich.map(async (enricher) => {
			for (const option of options.values()) {
				option.extras ??= [];
				option.extras.push(await enricher.enrich(option));
			}
		})
	);

	console.info(`Enriched options`);

	/** Specialize */

	await Promise.all(
		plan.modules.specializations.map(async (specializer) => {
			const specialized = [...options.values()]
				.filter((option) => specializer.include(option))
				.map((option) => {
					const extra = mergeExtras(option);
					const implicitCascade = Object.fromEntries(
						(option.parents ?? []).map(
							(parent) => [plan.metadataId(parent.clade), parent.id] as const
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

			const output = path.resolve(plan.output.options, `${specializer.name}.jsonl`);

			// Output as JSON lines
			writeFileSync(output, specialized.map((option) => JSON.stringify(option)).join('\n'));

			console.info(`Specialized to ${specializer.name} at ${output}`);
		})
	);
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

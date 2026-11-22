import { Metadata } from '#lib/schemas/metadata.js';
import { ensureArray, nonnull, slugify } from '#lib/utils.js';

import { PROTOCOL_ID } from './bees.js';
import { Datasource } from './datasource.js';
import { Enricher, MetadataProvider, NameProvider, Option } from './modules.js';
import { logger } from './progress.js';
import { Character, MediaObject, Xper3 } from './xper3.js';

export abstract class WithSDD {
	dataset: Xper3;

	supportsClade(clade: string) {
		return ['subspecies', 'species'].includes(clade);
	}

	constructor() {
		const sddurl = process.env.IDMYBEE_SDD_URL;
		if (!sddurl)
			throw new Error(
				`IDMyBee needs the SDD URL, set environment variable IDMYBEE_SDD_URL to the SDD (XML file)`
			);

		this.dataset = new Xper3('idmybee', new URL(sddurl));
	}

	async init() {
		await this.dataset.init();
	}
}

export class IDMyBeeDescriptions extends WithSDD implements Enricher {
	name = 'idmybee-descriptions' as const;

	names = new Set<string>();
	media = new Map<`m${string}`, MediaObject>();

	async init() {
		await this.init();
		const { taxa } = await this.dataset.one('taxa', {});
		for (const taxon of taxa) {
			this.names.add(taxon.Representation.Label);
		}
		const { media } = await this.dataset.one('mediaObjects', {});
		for (const object of media) {
			this.media.set(object.$id, object);
		}
	}

	available(option: Option) {
		if (!this.supportsClade(option.clade)) return;
		return this.names.has(option.name);
	}

	async *enrich(options: Option[]) {
		const { taxa } = await this.dataset.one('taxa', {});

		const descriptions = await this.dataset.many(
			'codedDescriptions',
			options.map(({ clade, name }) => ({ clade, name }))
		);

		for (const { name, description } of descriptions.filter(nonnull)) {
			const taxon = taxa.find((tx) => tx.Representation.Label === name);
			if (!taxon) continue;

			const option = options.find(
				(opt) => this.supportsClade(opt.clade) && opt.name === name
			);
			if (!option) continue;

			const summaries = [
				...(description.SummaryData.Categorical ?? []),
				...ensureArray(description.SummaryData.Quantitative ?? []),
			];

			const mediaObjects = ensureArray(taxon.Representation.MediaObject ?? [])
				.filter(nonnull)
				.map(({ $ref }) => this.media.get($ref))
				.filter(nonnull);

			const cascade: Record<`${PROTOCOL_ID}__${string}`, string | string[]> = {};
			const narrowerWeights: Record<`${PROTOCOL_ID}__${string}`, number> = {};

			for (const summary of summaries) {
				const character = await this.dataset.one('character', { $id: summary.$ref });
				if (!character) {
					logger.warn(
						`Character ${summary.$ref} not found for coded description ${description.$id}, skipping this metadata`
					);
					continue;
				}

				const id = `${PROTOCOL_ID}__${characterMetadataKey(character)}` as const;

				const rating = await Promise.resolve(summary.Ratings.Rating.$rating)
					.then((r) => r.replace(/Rating(\d)of5/, '$1'))
					.then((r) => Number.parseInt(r, 10))
					.then((r) => (r - 1) / 5);

				narrowerWeights[id] = rating;

				if ('State' in summary && summary.State && 'States' in character) {
					const cascadeStates = ensureArray(summary.State).map(({ $ref }) =>
						slug(
							ensureArray(character.States.StateDefinition).find(
								(s) => s.$id === $ref
							)!.$uniqueid
						)
					);

					cascade[id] = cascadeStates.length === 1 ? cascadeStates[0] : cascadeStates;
				} else if ('Measure' in summary && summary.Measure) {
					const range = constraintsToRange(ensureArray(summary.Measure));

					if (range) cascade[id] = range;
				}
			}

			yield {
				priority: 5,
				id: option.id,
				extra: {
					'x-generator': 'xper3',
					'x-xper3-declaration-index': taxa.findIndex((tx) => tx.$id === taxon.$id),
					cascade,
					narrowerWeights,
					description: noPlaceholder(taxon.Representation.Detail) || '',
					synonyms: noPlaceholder(
						ensureArray(taxon.Representation.AlternativeName ?? [])
					),
					images: mediaObjects.map(googledriveThumbnailUrl).filter(nonnull),
					// TODO: move to images
					'x-credits': Object.fromEntries(
						mediaObjects
							.filter((m) => m.Author !== undefined)
							.map((m) => [googledriveThumbnailUrl(m), m.Author!])
							.filter(([key, value]) => key !== undefined)
					),
				},
			};
		}
	}
}

export class IDMyBeeSpecies extends WithSDD implements NameProvider {
	name = 'idmybee-species' as const;

	async *scan() {
		await this.init();

		const { taxa } = await this.dataset.one('taxa', {});

		for (const taxon of taxa) {
			yield parseTaxonLabel(taxon.Representation.Label);
		}
	}
}

export class IDMyBeeCharacters extends WithSDD implements MetadataProvider {
	name = 'idmybee-characters' as const;

	addTo = ['io.github.cigaleapp.base.bees'];

	charactersByKey = new Map<string, { label: string; kind: 'categorical' | 'quantitative' }>();

	async *list() {
		await this.init();

		const characters = await this.dataset.one('characters', {});

		for (const character of characters.categorical) {
			const key = characterMetadataKey(character);
			this.charactersByKey.set(key, {
				label: character.Representation.Label,
				kind: 'categorical',
			});
			yield key;
		}

		for (const character of characters.quantitative) {
			const key = characterMetadataKey(character);
			this.charactersByKey.set(key, {
				label: character.Representation.Label,
				kind: 'quantitative',
			});
			yield key;
		}
	}

	async build(key: string) {
		const char = this.charactersByKey.get(key);
		if (!char) return;

		switch (char.kind) {
			case 'categorical':
				return this.buildCategorical(char.label);
			case 'quantitative':
				return this.buildQuantitative(char.label);
		}
	}

	buildCommon(character: Character) {
		const { Label, Detail, MediaObject } = character.Representation;

		return {
			id: characterMetadataKey(character),
			label: Label,
			group: 'andrena',
			mergeMethod: 'none',
			learnMore: this.dataset.mkeyUrl.toString(),
			'x-xper3-id': character.$id,
			required: false,
			description: noPlaceholder(Detail) ?? '',
			images: ensureArray(MediaObject ?? [])
				.map(googledriveThumbnailUrl)
				.filter(nonnull),
		} as const;
	}

	async buildCategorical(label: string): Promise<typeof Metadata.inferIn | undefined> {
		const character = await this.dataset.one('categoricalCharacter', { label });
		if (!character) return;

		const { StateDefinition } = character.States;

		return {
			...this.buildCommon(character),
			type: 'enum' as const,
			options: ensureArray(StateDefinition).map(
				({ $uniqueid, Representation: { Label, Detail, MediaObject } }) => ({
					label: Label,
					description: noPlaceholder(Detail) ?? '',
					key: slug($uniqueid),
					images: ensureArray(MediaObject ?? [])
						.map(googledriveThumbnailUrl)
						.filter(nonnull),
				})
			),
		};
	}

	async buildQuantitative(label: string): Promise<typeof Metadata.inferIn | undefined> {
		const character = await this.dataset.one('quantitativeCharacter', { label });
		if (!character) return;

		const result = await this.dataset.one('summaryDataOfCharacter', { label });
		if (!result) return;
		const summaries = result.summaryData;

		return {
			...this.buildCommon(character),
			type: 'float' as const,
			unit: character.MeasurementUnit.Label,
			range: constraintsToRange(
				summaries
					.flatMap((q) => ('Measure' in q ? ensureArray(q.Measure) : []))
					.filter(nonnull)
			),
		};
	}
}

class AndrenaModel extends Datasource<
	'classmapping',
	{ classmapping: {} },
	{ classmapping: { classes: string[] } }
> {
	name = 'andrena-model' as const;

	url =
		'https://huggingface.co/edgaremy/andrena-classifier/resolve/main/class-mapping-grouped.txt?download=true';

	async init() {}

	requests = {
		classmapping: async () => {
			const response = await fetch(this.url);
			const text = await response.text();
			if (!response.ok) throw new Error(text);
			return {
				classes: text
					.split(/\r?\n/)
					.map((line) => line.trim())
					.filter(Boolean),
			};
		},
	};
}

function characterMetadataKey(character: Character) {
	return slug(character.Representation.Label);
}

function noPlaceholder(s: undefined): undefined;
function noPlaceholder(s: string): string | undefined;
function noPlaceholder(s: string[]): string[];
function noPlaceholder(s: string | string[] | undefined): string | string[] | undefined {
	const PLACEHOLDERS = ['_', 'null'];
	if (!s) return s;
	if (typeof s === 'string') {
		return PLACEHOLDERS.includes(s) ? undefined : s;
	}
	return s.filter((str) => !PLACEHOLDERS.includes(str));
}

export function parseTaxonLabel(label: string) {
	const match = label.match(/^(?<genus>\w+)(?: \((?<subgenus>[^)]+)\))? (?<species>.+)$/);
	if (!match || !match.groups) {
		throw new Error(`Unexpected taxon label format: ${label}`);
	}
	return {
		clade: match.groups.subgenus ? 'subspecies' : 'species',
		name: label,
	};
}

function slug(s: string): string {
	return slugify(s).replaceAll('-', '_').toLowerCase();
}

// /download URLs are not CORS-enabled
function googledriveThumbnailUrl(mediaObject: MediaObject): string | undefined {
	const url = mediaObject.Source?.$href;

	if (!url) return undefined;

	// https://drive.usercontent.google.com/download?id=1vwm-X-uoCA_ZlmkwSa1yS5ZMOAz9OOQK
	const { hostname, pathname, searchParams } = new URL(url);
	if (hostname !== 'drive.usercontent.google.com') return url;
	if (pathname !== '/download') return url;
	const id = searchParams.get('id');
	if (!id) return url;

	return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
}

function constraintsToRange(
	constraints: Array<{ $type: 'Min' | 'Max'; $value: `${number}` }>
): string | undefined {
	const extrema = [...new Set(constraints.map((c) => Number.parseFloat(c.$value)))].toSorted(
		(a, b) => a - b
	);

	const minimum = extrema.at(0);
	const maximum = extrema.at(-1);

	if (minimum !== undefined && maximum !== undefined) {
		return `${minimum}..${maximum}`;
	}

	if (minimum !== undefined) {
		return `>= ${minimum}`;
	}

	if (maximum !== undefined) {
		return `<= ${maximum}`;
	}

	return undefined;
}

function formatMorphogroupKey(name: string) {
	return name.replaceAll(' ', '_').toLowerCase();
}

function formatMorphogroupLabel(key: string) {
	let out = key.replaceAll('_', ' ').replace(/^gpe /, 'Groupe ');
	out = out[0].toUpperCase() + out.slice(1);
	return out;
}

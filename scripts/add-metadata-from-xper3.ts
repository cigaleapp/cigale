import path from 'node:path';
import type { ExportedProtocol } from '../src/lib/schemas/protocols.js';

import { ArkErrors, type } from 'arktype';
import { Estimation as ETA } from 'arrival-time';
import { formatDistanceToNowStrict } from 'date-fns';
import { XMLParser } from 'fast-xml-parser';

import _protocol from '../examples/arthropods.cigaleprotocol.json' with { type: 'json' };
import lightweightProtocol from '../examples/arthropods.light.cigaleprotocol.json' with { type: 'json' };
import { ensureArray, nonnull, slugify } from '../src/lib/utils.js';
import {
	align,
	bold,
	cyan,
	dim,
	emitCheckrun,
	percentage,
	red,
	unique,
	updateCheckrunProgress,
} from './utils.js';

const here = import.meta.dir;

const SDD_URL =
	'https://app.xper3.fr:443/xper3GeneratedFiles/publish/identification/-8127384317153031006/IDMYBEE-Andrena.sdd.xml';

const MKEY_URL = SDD_URL.replace('/IDMYBEE-Andrena.sdd.xml', '/mkey.html');

console.info(`⁄ Fetching SDD from Xper3 at ${SDD_URL}…`);
const response = await fetch(SDD_URL);
console.info(`⁄ Response status: ${response.status} ${response.statusText}`);

const rawSDD = await response.text();
console.info(`⁄ Fetched SDD, size: ${rawSDD.length} characters`);

const parsed: SDD = new XMLParser({
	textNodeName: '_',
	ignoreAttributes: false,
	attributeNamePrefix: '$',
}).parse(rawSDD);

const sdd = parsed.Datasets.Dataset;

console.info(
	`⁄ Parsed SDD, found ${sdd.Characters.CategoricalCharacter.length} categorical characters`
);

console.info(`⁄ Indexing MediaObjects, TaxonNames and Characters from SDD…`);
const media = new Map(sdd.MediaObjects.MediaObject.map((m) => [m.$id, m]));
console.info(`⁄ Indexed ${media.size} media objects`);
const taxa = new Map(sdd.TaxonNames.TaxonName.map((t) => [t.$id, t]));
console.info(`⁄ Indexed ${taxa.size} taxa`);
const characters = new Map(
	[
		...sdd.Characters.CategoricalCharacter,
		...ensureArray(sdd.Characters.QuantitativeCharacter ?? []),
	].map((c) => [c.$id, c])
);
console.info(`⁄ Indexed ${characters.size} categorical characters`);

await augment(
	path.join(here, '../examples/arthropods.cigaleprotocol.json'),
	structuredClone(_protocol)
);

await augment(
	path.join(here, '../examples/arthropods.light.cigaleprotocol.json'),
	structuredClone(lightweightProtocol)
);

async function augment(protocolPath: string, protocol: typeof ExportedProtocol.inferIn) {
	const species = protocol.metadata[`${protocol.id}__species`] as Extract<
		(typeof ExportedProtocol.inferIn)['metadata'][string],
		{ type: 'enum' }
	>;

	if (import.meta.main) {
		await emitCheckrun('protocols', 'in_progress', 'Xper3', 'Starting…');

		protocol.authors = [
			...protocol.authors,
			// TODO: ask them to provide authors
			{ name: 'IDmyBee.com' },
		];

		protocol.description += `\n\nClés d'identification d'abeilles fournies par IDmyBee.com, extraites depuis [${sdd.Representation.Label} sur Xper3](${MKEY_URL}).`;

		protocol.metadataGroups ??= {};
		protocol.metadataGroups.andrena = {
			name: 'Andrènes',
			description:
				"Caractéristiques d'identification spécifiques aux abeilles du genre Andrena",
			collapsed: true,
			narrowable: true,
		};

		const descriptorMetadatas = new Map<
			`c${string}`,
			{ id: string } & (typeof ExportedProtocol.inferIn)['metadata'][string]
		>();

		for (const character of [
			...sdd.Characters.CategoricalCharacter,
			...ensureArray(sdd.Characters.QuantitativeCharacter),
		]) {
			const { $uniqueid, $id } = character;
			const { Label, Detail, MediaObject } = character.Representation;

			let id = slug(Label);
			if ([...descriptorMetadatas.values()].some((m) => m.id === id)) {
				id = slug($uniqueid);
			}

			protocol.metadataOrder?.push(id);

			const metadata = {
				id,
				label: Label,
				group: 'andrena',
				mergeMethod: 'none',
				learnMore: MKEY_URL,
				required: false,
				description: noPlaceholder(Detail) ?? '',
				images: ensureArray(MediaObject ?? [])
					.map(googledriveThumbnailUrl)
					.filter(nonnull),
			} as const;

			if ('States' in character) {
				const { StateDefinition } = character.States;

				descriptorMetadatas.set($id, {
					...metadata,
					type: 'enum',
					options: ensureArray(StateDefinition).map(
						({ $uniqueid, Representation: { Label, Detail, MediaObject } }) => ({
							label: Label,
							description: Detail,
							key: slug($uniqueid),
							images: ensureArray(MediaObject ?? [])
								.map(googledriveThumbnailUrl)
								.filter(nonnull),
						})
					),
				});
			} else if ('MeasurementUnit' in character) {
				const range = constraintsToRange(
					sdd.CodedDescriptions.CodedDescription.flatMap((desc) =>
						ensureArray(desc.SummaryData.Quantitative ?? [])
							.filter((q) => q.$ref === character.$id)
							.flatMap((q) => ensureArray(q.Measure))
							.filter(nonnull)
					)
				);

				descriptorMetadatas.set($id, {
					...metadata,
					type: 'float',
					unit: character.MeasurementUnit.Label,
					range,
				});
			}
		}

		console.info(`⁄ Added ${descriptorMetadatas.size} metadata from Xper3 descriptors:`);
		for (const [, descriptor] of descriptorMetadatas) {
			console.info(
				descriptor.type === 'enum'
					? `  - ${cyan(descriptor.label)}, ${descriptor.options?.length ?? 0} states: ${descriptor.options?.map((o) => o.key).join(', ')}`
					: descriptor.type === 'float'
						? `  - ${cyan(descriptor.label)}, range: ${descriptor.range}`
						: `  - ${cyan(descriptor.label)}: ${descriptor.type}-type`
			);
		}

		const totalsPerItem = new Map(
			sdd.CodedDescriptions.CodedDescription.map((item) => [
				item.$id,
				descriptorMetadatas.size,
			])
		);

		const total = () => [...totalsPerItem.values()].reduce((a, b) => a + b, 0);

		let done = 0;

		const eta = new ETA({ total: total() });

		for (const { id, ...metadata } of descriptorMetadatas.values()) {
			protocol.metadata[`${protocol.id}__${id}`] = metadata;
		}

		for (const item of sdd.CodedDescriptions.CodedDescription) {
			const taxon = taxa.get(item.Scope.TaxonName.$ref);
			if (!taxon) {
				console.warn(
					red(
						`Taxon ${item.Scope.TaxonName.$ref} not found for coded description ${item.$id}, moving to next`
					)
				);
				continue;
			}

			const header = makeHeader({ taxon, done, total, eta });

			const specie = await findGbifId(protocol, item);
			if (!specie) {
				console.error(
					`${header.red} ${red(bold("species not found in GBIF, can't set metadata"))}`
				);
				done += descriptorMetadatas.size;
				continue;
			}

			try {
				const cascades = [
					...(item.SummaryData.Categorical ?? []),
					...ensureArray(item.SummaryData.Quantitative ?? []),
				];

				totalsPerItem.set(item.$id, cascades.length);

				for (const cascade of cascades) {
					eta.update(done || 1, total());

					const character = characters.get(cascade.$ref);
					if (!character) {
						console.warn(
							red(
								`Character ${cascade.$ref} not found for coded description ${item.$id}, skipping this metadata`
							)
						);
						done++;
						continue;
					}

					const metadata = descriptorMetadatas.get(character.$id)!;
					const id = `${protocol.id}__${metadata.id}` as const;

					let optionIndex = species.options!.findIndex((o) => o.key === specie.key);
					if (optionIndex === -1) {
						const name = parseTaxonLabel(taxon.Representation.Label);

						const conflictingName = protocol.metadata[
							`${protocol.id}__species`
						].options!.find((o) => o.label === `${name.genus} ${name.species}`);
						if (conflictingName) {
							console.error(
								`${header.red} ${red(bold(`species ${taxon.Representation.Label} not found in protocol options, adding it with key ${specie.key}, but there's already an option with the same label (${conflictingName.key})`))}`
							);
						}

						optionIndex =
							protocol.metadata[`${protocol.id}__species`].options!.push({
								key: specie.key,
								label: `${name.genus} ${name.species}`,
							}) - 1;
					}

					const speciesOption =
						protocol.metadata[`${protocol.id}__species`].options![optionIndex];

					protocol.metadata[`${protocol.id}__species`].options![optionIndex] = {
						...speciesOption,
						// @ts-expect-error private field
						'x-generator': 'xper3',
						description:
							speciesOption.description ||
							noPlaceholder(taxon.Representation.Detail) ||
							'',
						synonyms: unique([
							...(speciesOption.synonyms ?? []),
							// This one contains a subgenus which we don't keep in the main label, so we add it as a synonym for search purposes (amongst other things)
							taxon.Representation.Label,
							...noPlaceholder(
								ensureArray(taxon.Representation.AlternativeName ?? [])
							),
						]),
						images: unique([
							...(speciesOption.images ?? []),
							...ensureArray(taxon.Representation.MediaObject ?? [])
								.map(googledriveThumbnailUrl)
								.filter(nonnull),
						]),
						'x-credits': Object.fromEntries([
							...ensureArray(taxon.Representation.MediaObject ?? [])
								.map((m) => media.get(m.$ref))
								.filter(nonnull)
								.filter((m) => m.Author !== undefined)
								.map((m) => [googledriveThumbnailUrl(m)!, m.Author!]),
						]),
					};

					if ('State' in cascade && cascade.State && 'States' in character) {
						const cascadeStates = ensureArray(cascade.State).map(({ $ref }) =>
							slug(
								ensureArray(character.States.StateDefinition).find(
									(s) => s.$id === $ref
								)!.$uniqueid
							)
						);

						protocol.metadata[`${protocol.id}__species`].options![optionIndex].cascade =
							{
								...species.options![optionIndex]?.cascade,
								[metadata.id]:
									cascadeStates.length === 1 ? cascadeStates[0] : cascadeStates,
							};
					} else if ('Measure' in cascade && cascade.Measure) {
						const range = constraintsToRange(ensureArray(cascade.Measure));

						if (range && protocol.metadata[id].type === 'float') {
							protocol.metadata[id].cascade = {
								...protocol.metadata[id].cascade,
								[`${protocol.id}__species:${speciesOption.key}`]: range,
							};
						}
					}

					done++;
					eta.update(done, total());

					await updateCheckrunProgress('protocols', done, total(), eta);

					if (
						process.env.VERBOSE ||
						done % Math.floor(total() / 20) === 0 ||
						done === total()
					) {
						const lhs = `${header} ${align(metadata.id, [...descriptorMetadatas.keys()])}`;
						if ('States' in character && 'State' in cascade && cascade.State) {
							console.info(
								`${lhs} = ${ensureArray(cascade.State)
									.map((state) =>
										ensureArray(character.States.StateDefinition).find(
											(s) => s.$id === state.$ref
										)
									)
									.filter(nonnull)
									.map((s) => dim(s.Representation.Label))
									.join(` ${cyan('+')} `)}`
							);
						} else if ('Measure' in cascade && cascade.Measure) {
							console.info(
								`${lhs} ∈ ${dim(constraintsToRange(ensureArray(cascade.Measure)) ?? 'n/a')}`
							);
						} else {
							console.info(`${lhs} ??`);
						}
					}
				}
			} catch (e) {
				console.error(
					red(
						`Failed to fetch description for ${item.$id}: ${e instanceof Error ? e.message : String(e)}`
					)
				);
				console.error(e);
				continue;
			}
		}

		await emitCheckrun('protocols', 'in_progress', null, 'Finishing…');

		await Bun.file(protocolPath).write(JSON.stringify(protocol, null, 2));

		await Bun.$`bun x prettier --write ${protocolPath}`;

		await emitCheckrun(
			'protocols',
			'in_progress',
			null,
			`Updated ${done} out of ${total()} descriptions`
		);

		console.info(
			cyan(
				`⁄ Finished processing, updated ${done} out of ${total()} (${percentage(done, total())}) descriptions for ${taxa.size} species and ${descriptorMetadatas.size} descriptors.`
			)
		);
	}
}

type ArrayOrSingle<T> = T | T[];

type SDD = {
	Datasets: {
		Dataset: {
			Representation: {
				Label: string;
			};
			TaxonNames: {
				TaxonName: Array<{
					$id: `t${string}`;
					Representation: {
						Label: string;
						Detail: string;
						AlternativeName: ArrayOrSingle<string>;
						MediaObject?: ArrayOrSingle<{ $ref: `m${string}` }>;
					};
				}>;
			};
			Characters: {
				QuantitativeCharacter: ArrayOrSingle<{
					$id: `c${string}`;
					$uniqueid: string;
					Representation: {
						Label: string;
						Detail: string;
						MediaObject?: ArrayOrSingle<{ $ref: `m${string}` }>;
					};
					MeasurementUnit: {
						Label: 'mm';
					};
				}>;
				CategoricalCharacter: Array<{
					$id: `c${string}`;
					$uniqueid: string;
					Representation: {
						Label: string;
						Detail: string;
						MediaObject?: ArrayOrSingle<{ $ref: `m${string}` }>;
					};
					States: {
						StateDefinition: ArrayOrSingle<{
							$uniqueid: string;
							$id: `s${string}`;
							Representation: {
								Label: string;
								Detail: string;
								MediaObject?: ArrayOrSingle<{ $ref: `m${string}` }>;
							};
						}>;
					};
				}>;
			};
			CharacterTrees: {
				CharacterTree: Array<{
					$id: `ct${string}`;
					Representation: {
						Label: string;
						Detail: string;
					};
					ShouldContainAllCharacters?: 'true';
					Nodes: {
						CharNode: Array<{
							Character: { $ref: `c${string}` };
							DependencyRules?: {
								InapplicableIf: {
									State: ArrayOrSingle<{ $ref: `s${string}` }>;
								};
							};
						}>;
					};
				}>;
			};
			CodedDescriptions: {
				CodedDescription: Array<{
					$id: `D${string}`;
					Representation: {
						Label: string;
						Detail: string;
						AlternativeName?: ArrayOrSingle<string>;
					};
					Scope: {
						TaxonName: { $ref: `t${string}` };
					};
					SummaryData: {
						Categorical: Array<{
							$ref: `c${string}`;
							Ratings: {
								Rating: {
									$context: 'ObservationConvenience';
									$rating: `Rating${1 | 2 | 3 | 4 | 5}of5`;
								};
							};
							State?: ArrayOrSingle<{ $ref: `s${string}` }>;
							Status?: { $code: 'DataUnavailable' };
						}>;
						Quantitative?: ArrayOrSingle<{
							$ref: `c${string}`;
							Ratings: {
								Rating: {
									$context: 'ObservationConvenience';
									$rating: `Rating${1 | 2 | 3 | 4 | 5}of5`;
								};
							};
							Measure?: ArrayOrSingle<{
								$type: 'Min' | 'Max';
								$value: `${number}`;
							}>;
						}>;
					};
				}>;
			};
			MediaObjects: {
				MediaObject: Array<{
					$id: `m${string}`;
					Type: 'Image';
					Source?: { $href: string };
					Author?: string;
					Representation: {
						Label: string;
						Detail?: string;
					};
				}>;
			};
		};
	};
};

function makeHeader({
	taxon,
	done,
	total,
	eta,
}: {
	taxon: SDD['Datasets']['Dataset']['TaxonNames']['TaxonName'][number];
	done: number;
	total: () => number;
	eta: ETA;
}) {
	return {
		text(colorfunc: (s: string) => string = cyan) {
			return `${align(done, total())} ${percentage(done, total())} ${colorfunc(
				`→ ${formatDistanceToNowStrict(new Date(Date.now() + eta.estimate()))}`
			)} [${colorfunc(alignToTaxon(taxon.Representation.Label))}]`;
		},
		get red() {
			return this.text(red);
		},
		toString() {
			return this.text();
		},
	};
}

function alignToTaxon(name: string) {
	return align(
		name,
		sdd.TaxonNames.TaxonName.map((t) => t.Representation.Label)
	);
}

async function findGbifId(
	protocol: typeof ExportedProtocol.inferIn,
	item: SDD['Datasets']['Dataset']['CodedDescriptions']['CodedDescription'][number]
) {
	const species = protocol.metadata[`${protocol.id}__species`];
	if (species.type !== 'enum') throw new Error('Unexpected metadata type for species');

	const taxon = taxa.get(item.Scope.TaxonName.$ref);
	if (!taxon) {
		console.warn(
			red(
				`Taxon ${item.Scope.TaxonName.$ref} not found for coded description ${item.$id}, can't find GBIF ID`
			)
		);
		return undefined;
	}

	const match = species.options?.find((option) =>
		[option.label, ...(option.synonyms ?? [])].includes(taxon.Representation.Label)
	);

	if (match) return { via: 'protocol', key: match.key, inProtocol: match };

	// console.log(`No match in protocol for ${item.name.species}, searching in GBIF…`);

	const name = parseTaxonLabel(taxon.Representation.Label);

	let response = await fetch(
		'https://api.gbif.org/v1/species/match?' +
			new URLSearchParams({
				scientificName: `${name.genus} ${name.species}`,
				genus: name.genus,
				subgenus: name.subgenus,
			})
	)
		.then((res) => res.json())
		.then((m) =>
			type({
				rank: "'GENUS' | 'SPECIES'",
				matchType: "'EXACT'",
				usageKey: 'number',
			})(m)
		);

	if (response instanceof ArkErrors) {
		// IDK why but GBIF API match doesn't find this one even though it's at https://gbif.org/species/318750100
		if (name.genus === 'Andrena' && name.species === 'nigropilosa') {
			response = {
				matchType: 'EXACT',
				rank: 'SPECIES',
				usageKey: 318750100,
			};
		} else {
			return undefined;
		}
	}

	return {
		via: 'gbif',
		key: response.usageKey.toString(),
		inProtocol: species.options?.find((option) => option.key === response.usageKey.toString()),
	};
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

function parseTaxonLabel(label: string) {
	const match = label.match(/^(?<genus>\w+)(?: \((?<subgenus>[^)]+)\))? (?<species>.+)$/);
	if (!match || !match.groups) {
		throw new Error(`Unexpected taxon label format: ${label}`);
	}
	return {
		genus: match.groups.genus,
		subgenus: match.groups.subgenus,
		species: match.groups.species,
	};
}

function slug(s: string): string {
	return slugify(s).replaceAll('-', '_').toLowerCase();
}

// /download URLs are not CORS-enabled
function googledriveThumbnailUrl(
	mediaObject:
		| { $ref: `m${string}` }
		| SDD['Datasets']['Dataset']['MediaObjects']['MediaObject'][number]
): string | undefined {
	const url = ('$ref' in mediaObject ? media.get(mediaObject.$ref) : mediaObject)?.Source?.$href;

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

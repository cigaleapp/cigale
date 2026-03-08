import path from 'node:path';
import type { ExportedProtocol } from '../src/lib/schemas/protocols.js';

import { ArkErrors, type } from 'arktype';
import { Estimation as ETA } from 'arrival-time';
import { formatDistanceToNowStrict } from 'date-fns';

import _protocol from '../examples/arthropods.cigaleprotocol.json' with { type: 'json' };
import { slugify } from '../src/lib/utils.js';
import {
	align,
	bold,
	cyan,
	dim,
	emitCheckrun,
	JSONPResponse,
	percentage,
	red,
	updateCheckrunProgress,
} from './utils.js';

function slug(s: string): string {
	return slugify(s).replaceAll('-', '_').toLowerCase();
}

// /download URLs are not CORS-enabled
function googledriveThumbnailUrl(url: string | URL | undefined): string | undefined {
	if (!url) return undefined;

	// https://drive.usercontent.google.com/download?id=1vwm-X-uoCA_ZlmkwSa1yS5ZMOAz9OOQK
	const { hostname, pathname, searchParams } = new URL(url);
	if (hostname !== 'drive.usercontent.google.com') return;
	if (pathname !== '/download') return;
	const id = searchParams.get('id');
	if (!id) return;

	return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
}

const here = import.meta.dir;

const protocolPath = path.join(here, '../examples/arthropods.cigaleprotocol.json');

const protocol = structuredClone(_protocol) as typeof ExportedProtocol.inferIn;

const species = protocol.metadata[`${protocol.id}__species`] as Extract<
	(typeof ExportedProtocol.inferIn)['metadata'][string],
	{ type: 'enum' }
>;

const SDD_URL =
	'https://app.xper3.fr:443/xper3GeneratedFiles/publish/identification/-8127384317153031006/IDMYBEE-Andrena.sdd.xml';

const APP_URL = SDD_URL.replace('/IDMYBEE-Andrena.sdd.xml', '/mkey.html');

// TODO: figure out what it is
const UNDERSCORE_NUMBER = 1772458526586;

const UnderscoreableString = type('string').pipe((s) => (s === '_' ? '' : s));

const Xper3Descriptor = type({
	name: 'string',
	detail: UnderscoreableString,
	uniqueid: 'string',
	stateIds: 'number[]',
	inapplicableState: 'null | number[]',
	unit: 'null',
	resourceIds: 'number[]',
	id: 'number',
	feedback: 'number[]',
	calculatedType: 'boolean',
	quantitativeType: 'boolean',
	categoricalType: 'boolean',
});

const Xper3Item = type({
	name: [
		/^Andrena \(.+\) .+$/,
		'=>',
		(name) => {
			const [, genus, subgenus, final] = /^(Andrena) \((.+?)\) (.+)$/.exec(name)!;

			return {
				genus,
				subgenus,
				species: `${genus} ${final}`,
				toString() {
					return name;
				},
			};
		},
	],
	alternativeName: 'null | string',
	detail: UnderscoreableString,
	uniqueid: 'string',
	resourceIds: 'number[]',
	taxaConfusion: 'number[]',
	id: 'number',
});

const Xper3State = type('null', '|', {
	/** Label */
	name: 'string',
	/** Description */
	detail: UnderscoreableString,
	/** Key */
	uniqueid: 'string',
	'resourceIds?': 'number[]',
	id: 'number',
}).pipe((s) => {
	if (s === null) return null;
	// TODO: figure out if we can process the object post-pipes
	// cuz here s.detail has been piped through UnderscoreableString yet
	if (s.detail === '_') s.detail = '';
	if (s.detail) return s;

	// Split name into name+detail
	const compoundPatterns = [
		/^(?<name>.+?)\s+:\s+(?<detail>.+)$/,
		/^(?<name>.+?)\s+\(\s*=\s*(?<detail>.+)\)$/,
	];

	const pattern = compoundPatterns.find((p) => p.test(s.name));
	if (!pattern) return s;

	const { name, detail } = pattern.exec(s.name)!.groups!;

	return { ...s, name, detail };
});

/** Images, mostly */
const Xper3Resource = type('null', '|', {
	id: 'number',
	name: 'string',
	// TODO: Extract a spdx license ID from this? it seems to start with either (CC-...) or "@...."
	author: 'null | string',
	type: "'image'",
	/** Alt */
	legend: ['null | string', '=>', (d: string | null) => d || ''],
	url: ['string.url', '=>', (u: string) => googledriveThumbnailUrl(u) ?? new URL(u)],
	keywords: 'null',
});

async function findGbifId(item: typeof Xper3Item.infer) {
	const species = protocol.metadata[`${protocol.id}__species`];
	if (species.type !== 'enum') throw new Error('Unexpected metadata type for species');

	const match = species.options?.find((option) =>
		[option.label, ...(option.synonyms ?? [])].includes(item.name.species)
	);

	if (match) return { via: 'protocol', key: match.key, inProtocol: match };

	// console.log(`No match in protocol for ${item.name.species}, searching in GBIF…`);

	const response = await fetch(
		'https://api.gbif.org/v1/species/match?' +
			new URLSearchParams({
				scientificName: item.name.species,
				genus: item.name.genus,
				subgenus: item.name.subgenus,
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

	if (response instanceof ArkErrors) return undefined;
	// console.log(response)

	return {
		via: 'gbif',
		key: response.usageKey.toString(),
		inProtocol: species.options?.find((option) => option.key === response.usageKey.toString()),
	};
}

async function requestDescriptiveData() {
	return fetch(
		'https://mkey.services.identificationkey.fr/identification/getDescriptiveData' +
			'?' +
			new URLSearchParams({
				// Removing callback doesnt work for this one
				// so we have to deal with a JSONP response, fun!
				callback: 'cb',
				sddURL: SDD_URL,
				withGlobalWeigth: 'true',
				_: UNDERSCORE_NUMBER.toString(),
			})
	)
		.then((response) => response.text())
		.then((text) =>
			JSONPResponse({
				Items: Xper3Item.array(),
				Descriptors: Xper3Descriptor.array(),
				States: Xper3State.array(),
				Resources: Xper3Resource.array(),
				DependancyTable: { '[string.integer]': 'number[]' },
				DescriptorRootId: 'number[]',
				InvertedDependancyTable: { '[string.integer]': 'number' },
				NameDataset: 'string',
				Authors: 'never[]',
				descriptorsScoreMap: { '[string.integer]': 'number' },
			}).assert(text)
		);
}

async function requestItemDescriptors(item: typeof Xper3Item.infer) {
	return fetch(
		'https://mkey.services.identificationkey.fr/identification/getDescription' +
			'?' +
			new URLSearchParams({
				callback: 'cb',
				sddURL: SDD_URL,
				itemName: item.name.toString(),
				_: UNDERSCORE_NUMBER.toString(),
			})
	)
		.then((response) => response.text())
		.then((text) =>
			JSONPResponse({
				innapDescriptorId: 'number[]',
				description: [
					{
						id: 'number',
						version: 'null',
						position: 'number',
						updateTime: 'null',
						resources: Xper3Resource.array(),
						states: Xper3State.array(),
						note: 'null',
						quantitativeMeasure: 'null',
						// TODO
						// calculatedStateEvaluations: 'object',
						unknown: 'boolean',
						contextualWeight: 'number',
					},
					'[]',
				],
			}).assert(text)
		);
}

if (import.meta.main) {
	await emitCheckrun('protocols', 'in_progress', 'Xper3', 'Starting…');

	const { Descriptors, States, Items, Resources, NameDataset, Authors } =
		await requestDescriptiveData();

	protocol.authors = [
		...protocol.authors,
		...(Authors.length === 0
			? // TODO: ask them to provide authors
				[{ name: 'IDmyBee.com' }]
			: Authors.map((a) => ({ name: `${a}` }))),
	];

	protocol.description += `\n\nClés d'identification d'abeilles fournies par IDmyBee.com, extraites depuis [${NameDataset} sur Xper3](${APP_URL}).`;

	protocol.metadataGroups ??= {};
	protocol.metadataGroups.andrena = {
		name: 'Andrènes',
		description: "Caractéristiques d'identification spécifiques aux abeilles du genre Andrena",
		collapsed: true,
	};

	const descriptorMetadatas = new Map<
		string,
		(typeof ExportedProtocol.inferIn)['metadata'][string]
	>();

	for (const { detail, name, uniqueid, stateIds, resourceIds } of Descriptors) {
		let id = slug(name);
		if (descriptorMetadatas.has(id)) {
			id = slug(uniqueid);
		}

		const image = Resources.filter((r) => r !== null).find((r) => resourceIds.includes(r.id));

		descriptorMetadatas.set(id, {
			label: name,
			group: 'andrena',
			description: detail,
			images: image ? [image.url.toString()] : undefined,
			type: 'enum',
			mergeMethod: 'none',
			learnMore: APP_URL,
			required: false,
			options: States.filter(
				(s): s is NonNullable<typeof s> => s !== null && stateIds.includes(s.id)
			).map(({ name, detail, uniqueid, resourceIds }) => {
				const resource = Resources.filter((r) => r !== null).find((r) =>
					resourceIds?.includes(r.id)
				);

				return {
					label: name,
					description: detail,
					key: slug(uniqueid),
					images: resource?.url ? [resource.url.toString()] : [],
				};
			}),
		});

		protocol.metadataOrder?.push(id);
	}

	console.info(`⁄ Added ${descriptorMetadatas.size} metadata from Xper3 descriptors:`);
	for (const [, descriptor] of descriptorMetadatas) {
		console.info(
			`  - ${cyan(descriptor.label)}, ${descriptor.options?.length ?? 0} states: ${descriptor.options?.map((o) => o.key).join(', ')}`
		);
	}

	const totalsPerItem = new Map(Items.map((item) => [item.id, descriptorMetadatas.size]));
	const total = () => [...totalsPerItem.values()].reduce((a, b) => a + b, 0);

	let done = 0;

	const eta = new ETA({ total: total() });

	for (const [key, metadata] of descriptorMetadatas) {
		protocol.metadata[`${protocol.id}__${key}`] = metadata;
	}

	for (const item of Items) {
		const header = {
			text(colorfunc: (s: string) => string = cyan) {
				return `${align(done, total())} ${percentage(done, total())} ${colorfunc(
					`→ ${formatDistanceToNowStrict(new Date(Date.now() + eta.estimate()))}`
				)} [${colorfunc(
					align(
						item.name.species,
						Items.map((i) => i.name.species)
					)
				)}]`;
			},
			get red() {
				return this.text(red);
			},
			toString() {
				return this.text();
			},
		};

		const specie = await findGbifId(item);
		if (!specie) {
			console.error(
				`${header.red} ${red(bold("species not found in GBIF, can't set metadata"))}`
			);
			done += descriptorMetadatas.size;
			continue;
		}

		try {
			const { description } = await requestItemDescriptors(item);
			const states = description.flatMap((d) => d.states).filter((s) => s !== null);
			totalsPerItem.set(item.id, states.length);

			for (const state of states) {
				eta.update(done || 1, total());

				if (!state) {
					continue;
				}

				const found = [...descriptorMetadatas].find(([, meta]) =>
					meta.options?.some((o) => o.key === slug(state.uniqueid))
				);

				if (!found) {
					console.error(
						`${header.red} ${red(bold(`no metadata associated with ${state.name}`))}`
					);
					continue;
				}

				const [metadataKey] = found;
				let optionIndex = species.options!.findIndex((o) => o.key === specie.key);
				if (optionIndex === -1) {
					optionIndex =
						protocol.metadata[`${protocol.id}__species`].options!.push({
							key: specie.key,
							label: item.name.species,
							synonyms: [item.name.toString()],
						}) - 1;
				}

				protocol.metadata[`${protocol.id}__species`].options![optionIndex].cascade = {
					...species.options![optionIndex]?.cascade,
					[metadataKey]: slug(state.uniqueid),
				};

				done++;
				eta.update(done, total());

				await updateCheckrunProgress('protocols', done, total(), eta);

				console.info(
					`${header} ${align(metadataKey, [...descriptorMetadatas.keys()])} = ${dim(state.name)}`
				);
			}
		} catch (e) {
			console.error(
				red(
					`Failed to fetch description for ${item.name.species}: ${e instanceof Error ? e.message : String(e)}`
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
			`⁄ Finished processing, updated ${done} out of ${total()} (${percentage(done, total())}) descriptions for ${Items.length} species and ${descriptorMetadatas.size} descriptors.`
		)
	);
}

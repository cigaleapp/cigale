import type { DatabaseHandle } from './idb.svelte.js';
import type { TypedMetadataValue } from './metadata/types.js';
import type { NamespacedMetadataID } from './schemas/common.js';
import type * as DB from '$lib/database.js';
import type { MaybePromise } from '$lib/utils.js';

import * as dates from 'date-fns';

import { Tables } from '$lib/database.js';
import { compareBy, entries, mapValues, orEmpty, orEmpty2, sum, switchValue } from '$lib/utils.js';

import { addValueLabels, metadataPrettyValue } from './metadata/display.js';
import { mergeMetadataFromImagesAndObservations } from './metadata/merging.js';
import { hasRuntimeType } from './metadata/types.js';
import {
	BUILTIN_DARWINCORE_NAMESPACES,
	BUILTIN_EXTRA_FIELDS,
	DarwinCoreFieldPayload,
	DarwinCoreFileScope,
} from './schemas/darwincore.js';
import { TemplatedString } from './schemas/expressions.js';
import { metadataOptionId, removeNamespaceFromMetadataId } from './schemas/metadata.js';
import { toMetadataRecord, withProtocolMetadata } from './schemas/results.js';
import { XmlNode } from './xml.js';
import { createZipArchive } from './zip.js';

export async function darwinCoreArchive({
	db,
	protocolId,
	sessionIds,
	onProgress,
}: {
	db: DatabaseHandle;
	protocolId: string;
	sessionIds: string[];
	onProgress: (done: number, total: number, phase: 'eml' | 'meta' | 'data' | 'zipping') => void;
}) {
	const protocol = Tables.Protocol.assert(await db.get('Protocol', protocolId));
	if (!protocol.darwincore) {
		throw new Error("Le protocole ne supporte pas l'export au format DarwinCore");
	}

	const metadataDefs = await Promise.all(
		protocol.metadata
			.toSorted(compareBy((id) => protocol.metadataOrder?.indexOf(id)))
			.map((m) => db.get('Metadata', m))
	).then((defs) =>
		defs
			.filter((def) => def && 'darwincore' in def && def.darwincore)
			.map((def) => Tables.Metadata.assert(def))
	);

	let done = 0;

	const data = await darwinCoreDataFiles({
		db,
		protocol,
		metadataDefs,
		sessionIds,
		onProgress(_done, total) {
			onProgress(_done, total + 3, 'data');
			done = _done;
		},
	});

	onProgress(done + 0, done + 3, 'meta');
	const meta = darwinCoreMetafile(protocol, metadataDefs);
	if (!meta) throw new Error('DwC-A: Impossible de générer meta.xml');

	onProgress(done + 1, done + 3, 'eml');
	const eml = darwinCoreEmlFile(protocol, metadataDefs, []);
	if (!eml) throw new Error('DwC-A: Impossible de générer eml.xml');

	onProgress(done + 2, done + 3, 'zipping');
	return createZipArchive({
		...data,
		'eml.xml': eml,
		'meta.xml': meta,
	});
}

async function darwinCoreDataFiles({
	db,
	protocol,
	metadataDefs,
	sessionIds,
	onProgress,
}: {
	db: DatabaseHandle;
	protocol: DB.Protocol;
	/** **Must be sorted!!** with `protocol.metadataOrder`  */
	metadataDefs: DB.Metadata[];
	sessionIds: string[];
	onProgress: (done: number, total: number) => void;
}) {
	if (!protocol.darwincore) return;
	const contents = {} as Record<string, string[][]>;

	let done = 0;
	const progress = (increment: number) => {
		done += increment;
		onProgress(done, protocol.darwincore!.files.length);
	};

	const countsPerSession = await Promise.all(
		sessionIds.map(async (sessionId) => ({
			observations: await db.countFromIndex('Observation', 'sessionId', sessionId),
			files: await db.countFromIndex('ImageFile', 'sessionId', sessionId),
		}))
	);

	const totalObservations = sum(countsPerSession.map((session) => session.observations));
	const totalImageFiles = sum(countsPerSession.map((session) => session.files));

	type Payloadable = { metadata: DB.MetadataValues; addedAt?: Date };
	async function intoPayload<T extends Payloadable>(
		subject: T[]
	): Promise<Array<T & { protocolMetadata: DB.MetadataValues }>>;
	async function intoPayload<T extends Payloadable>(
		subject: T
	): Promise<T & { protocolMetadata: DB.MetadataValues }>;
	async function intoPayload<T extends Payloadable>(subject: T | T[]) {
		if (Array.isArray(subject)) {
			return await Promise.all(subject.map((s) => intoPayload(s)));
		}

		return withProtocolMetadata(protocol, {
			...subject,
			...('addedAt' in subject && subject.addedAt instanceof Date
				? { addedAt: subject.addedAt.toISOString() }
				: {}),
			metadata: await addValueLabels(db, null, subject.metadata),
		});
	}

	for (const file of protocol.darwincore.files) {
		const layout = fileLayout(protocol, metadataDefs, file);

		// Header
		contents[file.path] = [
			layout.map((cell) => (cell.source === 'id' ? cell.name : removeNamespace(cell.field))),
		];

		for (const sessionId of sessionIds) {
			const rawSession = await db.get('Session', sessionId);
			const session = Tables.Session.assert(rawSession);

			const sessionPayload = {
				session: await intoPayload(session),
			};

			if (file.scope === 'session') {
				const cells = layout as Column<'session'>[];
				const row = [];

				for (const cell of cells) {
					switch (cell.source) {
						case 'id': {
							row.push(sessionId);
							break;
						}

						case 'metadata': {
							const value = session.metadata[cell.metadataId];
							// @ts-expect-error type is too precise and narrowing is near-impossible here
							row.push(value ? String(await cell.compute(value, db)) : '');
							break;
						}

						case 'extra': {
							row.push(cell.template.render(sessionPayload));
							break;
						}
					}
				}

				contents[file.path].push(row);

				progress(1 / sessionIds.length);
			} else if (file.scope === 'image') {
				const cells = layout as Column<'image'>[];

				const images = await db
					.getAllFromIndex('Image', 'sessionId', sessionId)
					.then((images) => images.map((i) => Tables.Image.assert(i)));

				for (const img of images) {
					const extraPayload = {
						...sessionPayload,
						image: await intoPayload(img),
					};

					const row = [];

					for (const cell of cells) {
						switch (cell.source) {
							case 'id': {
								row.push(sessionId);
								break;
							}
							case 'metadata': {
								const value = img.metadata[cell.metadataId];
								// @ts-expect-error type is too precise and narrowing is near-impossible here
								row.push(value ? String(await cell.compute(value, db)) : '');
								break;
							}
							case 'extra': {
								row.push(cell.template.render(extraPayload));
								break;
							}
						}
					}

					contents[file.path].push(row);

					progress(1 / totalObservations);
				}
			} else if (file.scope === 'media') {
				const cells = layout as Column<'media'>[];

				const images = await db
					.getAllFromIndex('Image', 'sessionId', sessionId)
					.then((images) => images.map((image) => Tables.Image.assert(image)));

				const imageFiles = await db.getAllFromIndex('ImageFile', 'sessionId', sessionId);

				for (const imageFile of imageFiles) {
					const extraPayload = {
						...sessionPayload,
						file: imageFile,
						images: await intoPayload(images.filter((i) => i.fileId === imageFile.id)),
					};

					const row = [];

					for (const cell of cells) {
						switch (cell.source) {
							case 'id': {
								row.push(sessionId);
								break;
							}
							case 'metadata': {
								// Not supported for media scope
								row.push('');
								break;
							}
							case 'extra': {
								row.push(cell.template.render(extraPayload));
								break;
							}
						}
					}

					contents[file.path].push(row);

					progress(1 / totalImageFiles);
				}
			}
		}
	}

	return mapValues(contents, (rows) => rows.map((row) => row.join('\t')).join('\n'));
}

type Column<Scope extends DarwinCoreFileScope> =
	| {
			source: 'id';
			name: string;
	  }
	| {
			[t in DB.MetadataType]: {
				source: 'metadata';
				field: string;
				metadataType: t;
				metadataId: NamespacedMetadataID;
				compute: (
					value: TypedMetadataValue<t>,
					db: DatabaseHandle
				) => MaybePromise<string | number>;
			};
	  }[DB.MetadataType]
	| {
			source: 'extra';
			field: string;
			provenance: string;
			template: {
				render: (data: (typeof DarwinCoreFieldPayload)[Scope]['inferIn']) => string;
			};
	  };

export function fileLayout<Scope extends DarwinCoreFileScope>(
	protocol: Pick<DB.Protocol, 'darwincore' | 'sessionMetadata' | 'metadataOrder'>,
	metadata: DB.Metadata[],
	file: { includes: string[]; scope: Scope }
): Array<Column<Scope>> {
	if (!protocol.darwincore) return [];

	return [
		{ name: 'sessionId', source: 'id' as const },
		...metadata
			.filter((m) =>
				switchValue(file.scope, {
					session: protocol.sessionMetadata.includes(m.id),
					observation: !protocol.sessionMetadata.includes(m.id),
					media: false,
				})
			)
			.sort(compareBy((m) => protocol.metadataOrder?.indexOf(m.id)))
			.flatMap((def): Column<Scope>[] => {
				const item = <Type extends DB.MetadataType>(
					field: string,
					compute: (
						value: TypedMetadataValue<Type>,
						db: DatabaseHandle
					) => MaybePromise<string | number>
				) => ({
					field,
					source: 'metadata' as const,
					metadataType: def.type as Type,
					metadataId: def.id,
					compute,
				});

				const itemValue = (field: string) =>
					item(field, (v) =>
						metadataPrettyValue(v.value, { language: 'en', type: def.type })
					);

				if (!('darwincore' in def)) return [];
				if (!def.darwincore) return [];

				switch (def.type) {
					case 'string':
					case 'boolean': {
						return [itemValue(def.darwincore)];
					}

					case 'integer':
					case 'float': {
						if (typeof def.darwincore === 'string') {
							return [itemValue(def.darwincore)];
						}

						const it = item<'integer' | 'float'>;
						const out = [];

						if (def.darwincore.value) {
							out.push(it(def.darwincore.value, (v) => v.value));
						}
						if (def.darwincore.unit) {
							out.push(it(def.darwincore.unit, (v) => v.unit ?? ''));
						}

						return out;
					}

					case 'date': {
						const it = item<'date'>;
						const out = [];
						if (def.darwincore.date) {
							out.push(
								it(def.darwincore.date, (v) => dates.format(v.value, 'yyyy-MM-dd'))
							);
						}

						if (def.darwincore.time) {
							out.push(
								it(def.darwincore.time, (v) => dates.format(v.value, 'HH:mm:ss'))
							);
						}

						if (def.darwincore.datetime) {
							out.push(it(def.darwincore.datetime, (v) => v.value.toISOString()));
						}

						return out;
					}

					case 'enum': {
						const it = item<'enum'>;
						const withOption = (
							field: string,
							computation: (
								opt: DB.MetadataEnumVariant
							) => MaybePromise<string | number>
						) =>
							it(field, async (v, db) => {
								const opt = await db.get(
									'MetadataOption',
									metadataOptionId(def.id, v.value)
								);

								if (!opt) return '';

								return computation(Tables.MetadataOption.assert(opt));
							});

						const out = [];

						if (def.darwincore.key) {
							out.push(it(def.darwincore.key, (v) => v.value.toString()));
						}

						if (def.darwincore.label) {
							out.push(withOption(def.darwincore.label, (opt) => opt.label));
						}

						if (def.darwincore.color) {
							out.push(withOption(def.darwincore.color, (opt) => opt.color ?? ''));
						}

						if (def.darwincore.image) {
							out.push(
								withOption(def.darwincore.image, (opt) => opt.images?.at(0) ?? '')
							);
						}

						if (def.darwincore.images) {
							out.push(
								withOption(
									def.darwincore.images,
									(opt) => opt.images?.join(' | ') ?? ''
								)
							);
						}

						return out;
					}

					case 'boundingbox': {
						const it = item<'boundingbox'>;
						const out = [];

						if (def.darwincore.cx) {
							out.push(it(def.darwincore.cx, (v) => v.value.x));
						}

						if (def.darwincore.sx) {
							out.push(it(def.darwincore.sx, (v) => v.value.x - v.value.w / 2));
						}

						if (def.darwincore.cy) {
							out.push(it(def.darwincore.cy, (v) => v.value.y));
						}

						if (def.darwincore.sy) {
							out.push(it(def.darwincore.sy, (v) => v.value.y - v.value.h / 2));
						}

						if (def.darwincore.h) {
							out.push(it(def.darwincore.h, (v) => v.value.h));
						}

						if (def.darwincore.w) {
							out.push(it(def.darwincore.w, (v) => v.value.w));
						}

						return out;
					}
				}

				return [];
			}),

		...entries(BUILTIN_EXTRA_FIELDS[file.scope])
			// Dont use builtin if the protocol re-defines it
			.filter(([field]) => !(field in (protocol.darwincore?.fields?.[file.scope] ?? {})))
			.map(([field, template]) => ({
				field,
				source: 'extra' as const,
				provenance: 'built-in',
				template: TemplatedString(DarwinCoreFieldPayload[file.scope]).assert(template),
			})),

		...Object.entries(protocol.darwincore.fields?.[file.scope] ?? {}).map(
			([field, template]) => ({
				field,
				source: 'extra' as const,
				provenance: `protocol (darwincore.fields.${file.scope}."${field}")`,
				template: template as Extract<Column<Scope>, { source: 'extra' }>['template'],
			})
		),
	].filter(
		(column) => column.source === 'id' || fieldIncludedInFile(protocol, file, column.field)
	);
}

/**
 * @see https://docs.gbif.org/survey-monitoring-quick-start/en/#data-mapping-template
 * @returns
 */
export function darwinCoreMetafile(
	protocol: Pick<DB.Protocol, 'darwincore' | 'sessionMetadata' | 'metadataOrder'>,
	metadata: DB.Metadata[]
) {
	if (!protocol.darwincore) return;

	const { files } = protocol.darwincore;

	function fileNode(file: (typeof files)[number]) {
		const layout = fileLayout(protocol, metadata, file);

		return new XmlNode(
			file.core ? 'core' : 'extension',
			{
				rowType: expandNamespaced(protocol, file.rowType),
				ignoreHeaderLines: '1',
				encoding: 'UTF-8',
				fieldsTerminatedBy: '\t',
				linesTerminatedBy: '\n',
				fieldsEnclosedBy: '',
			},
			XmlNode.nested('files', { location: file.path }),
			...layout.flatMap((cell, index) => {
				if (cell.source === 'id')
					return [new XmlNode(file.core ? 'id' : 'coreid', { index })];

				return [
					XmlNode.comment(
						cell.source === 'metadata'
							? `from metadata ${cell.metadataId}`
							: `from ${cell.provenance} extra field`
					),
					new XmlNode('field', {
						term: expandNamespaced(protocol, cell.field),
						index,
					}),
				];
			})
		);
	}

	return new XmlNode(
		'archive',
		{
			xmlns: 'http://rs.tdwg.org/dwc/text/',
			metadata: 'eml.xml',
		},
		...files.map(fileNode)
	).toString();
}

/**
 *
 * @see https://ipt.gbif.org/manual/en/ipt/latest/gbif-metadata-profile
 */
export function darwinCoreEmlFile(
	protocol: Pick<DB.Protocol, 'darwincore' | 'authors' | 'description' | 'logo'>,
	_metadata: DB.Metadata[],
	_sessions: Pick<DB.Session, 'metadata'>[]
) {
	if (!protocol.darwincore) return;
	const { eml } = protocol.darwincore;

	function keywordSet(thesaurus: string, ...keywords: string[]) {
		return new XmlNode(
			'keywordSet',
			...keywords.map((kw) => new XmlNode('keyword', kw)),
			new XmlNode('keywordThesaurus', thesaurus)
		);
	}

	return new XmlNode(
		'eml:eml',
		{
			'xmlns:eml': 'https://eml.ecoinformatics.org/eml-2.2.0',
		},
		new XmlNode(
			'dataset',
			new XmlNode('title', eml.title),
			// TODO: add roles to protocol authors to specify them here
			// TODO: add fields derived from session metadata with darwincore set to eml: . will be used for dataset authors, etc.
			// both preceidng TODOs should take care of creator, metadataProviedr, ... up to contact
			// TODO: pubDate: how???
			new XmlNode('language', eml.language),
			new XmlNode('abstract', eml.abstract),
			keywordSet('n/a', ...eml.keywords),
			...orEmpty2(eml.gbif, (gbif) => [
				keywordSet(
					'GBIF Dataset Type Vocabulary: http://rs.gbif.org/vocabulary/gbif/dataset_type_2015-07-10.xml',
					gbif.type
				),
				keywordSet(
					'GBIF Dataset Subtype Vocabulary: http://rs.gbif.org/vocabulary/gbif/dataset_subtype.xml',
					gbif.subtype
				),
			]).flat(),
			new XmlNode(
				'coverage',
				...orEmpty2(eml.taxonomy, (taxo) => {
					const [rank] = Object.entries(taxo.rank ?? {});

					return new XmlNode(
						'taxonomicCoverage',
						new XmlNode('generalTaxonomicCoverage', taxo.description),
						...orEmpty2(rank, ([name, value]) =>
							XmlNode.nested('taxonomicClassification', {
								taxonRankName: name,
								taxonRankValue: value,
							})
						)
					);
				}),
				...orEmpty2(
					eml.geography,
					(geo) =>
						new XmlNode(
							'geographicCoverage',
							new XmlNode('geographicDescription', geo.description),
							...orEmpty2(geo.coordinates, (coords) =>
								XmlNode.nested('boundingCoordinates', {
									westBoundingCoordinates: coords.west,
									eastBoundingCoordinates: coords.east,
									southBoundingCoordinates: coords.south,
									northBoundingCoordinates: coords.north,
								})
							)
						)
				),
				...orEmpty(
					Boolean(eml.beginsAt && eml.endsAt),
					XmlNode.nested('temporalCoverage', {
						rangeOfDates: {
							beginDate: {
								calendarDate: eml.beginsAt
									? dates.format(eml.beginsAt, 'yyyy-MM-dd')
									: undefined,
							},
							endDate: {
								calendarDate: eml.endsAt
									? dates.format(eml.endsAt, 'yyyy-MM-dd')
									: undefined,
							},
						},
					})
				)
			),
			XmlNode.nested('method', {
				sampling: {
					// TODO: https://ipt.gbif.org/manual/en/ipt/latest/gbif-metadata-profile#methods (improve protocol description, make it more structured )
					samplingDescription: protocol.description,
				},
			}),
			new XmlNode('intellectualRights', eml.license)
		),
		XmlNode.nested('additionalMetadata', {
			metadata: {
				gbif: {
					dateStamp: new Date().toISOString(),
					resourceLogoUrl: protocol.logo,
				},
			},
		})
	).toString();
}

function withNamespace(protocol: Pick<DB.Protocol, 'darwincore'>, ns: string, value: string) {
	if (!protocol.darwincore) throw new Error('Protocol has no darwincore support');
	const namespaces: Record<string, string> = {
		...BUILTIN_DARWINCORE_NAMESPACES,
		...(protocol.darwincore.namespaces ?? {}),
	};

	const baseUrl = namespaces[ns];
	if (!baseUrl) throw new Error(`Namespace DarwinCore ${JSON.stringify(ns)} inconnu`);

	return `${baseUrl.replace(/\/$/, '')}/${value}`;
}

function expandNamespaced(protocol: Pick<DB.Protocol, 'darwincore'>, key: string) {
	if (!/^\w+:\w+$/.test(key)) return key;

	const [ns, bare] = key.split(':');
	return withNamespace(protocol, ns, bare);
}

function removeNamespace(field: string) {
	return field.split(':')[1];
}

function fieldIncludedInFile(
	protocol: Pick<DB.Protocol, 'darwincore'>,
	file: { includes: string[] },
	field: string
) {
	for (const include of file.includes) {
		if (
			/^\w+:\*$/.test(include) &&
			/^\w+:\w+$/.test(field) &&
			include.split(':')[0] === field.split(':')[0]
		) {
			return true;
		}

		if (expandNamespaced(protocol, include) === expandNamespaced(protocol, field)) {
			return true;
		}
	}

	return false;
}

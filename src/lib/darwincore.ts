import type { DatabaseHandle } from './idb.svelte.js';
import type * as DB from '$lib/database.js';

import * as dates from 'date-fns';

import { Tables } from '$lib/database.js';
import { compareBy, entries, mapValues, orEmpty, orEmpty2, sum } from '$lib/utils.js';

import { addValueLabels, metadataPrettyValue } from './metadata/display.js';
import { mergeMetadataFromImagesAndObservations } from './metadata/merging.js';
import { BUILTIN_DARWINCORE_NAMESPACES, DarwinCoreProtocolConfig } from './schemas/darwincore.js';
import { metadataOptionId, removeNamespaceFromMetadataId } from './schemas/metadata.js';
import { toMetadataRecord, withProtocolMetadata } from './schemas/results.js';
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
		defs.filter((def) => def?.darwincore).map((def) => Tables.Metadata.assert(def))
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
			metadata: toMetadataRecord(await addValueLabels(db, null, subject.metadata)),
		});
	}

	for (const file of protocol.darwincore.files) {
		const metadata =
			file.scope === 'media'
				? []
				: metadataDefs.filter((def) =>
						fieldIncludedInFile(protocol, file, def.darwincore!)
					);

		const extra = Object.keys(protocol.darwincore.fields?.[file.scope] ?? {}).filter((field) =>
			fieldIncludedInFile(protocol, file, field)
		);

		// Header
		contents[file.path] = [
			[
				'sessionId',
				...metadata.map((def) => def.darwincore!.split(':')[1]),
				...extra.map((field) => field.split(':')[1]),
			],
		];

		for (const sessionId of sessionIds) {
			const rawSession = await db.get('Session', sessionId);
			const session = Tables.Session.assert(rawSession);

			if (file.scope === 'session') {
				const extra = entries(protocol.darwincore.fields?.session ?? {})
					.filter(([field]) => fieldIncludedInFile(protocol, file, field))
					.map(([field, template]) => ({ field, template }));

				const row = [sessionId];

				for (const def of metadata) {
					const value = session.metadata[def.id]?.value ?? null;
					row.push(
						metadataPrettyValue(value, {
							language: 'en',
							type: def.type,
							valueLabel:
								typeof value === 'string'
									? await db
											.get('MetadataOption', metadataOptionId(def.id, value))
											.then((opt) => opt?.label)
									: undefined,
						})
					);
				}

				for (const def of extra) {
					try {
						row.push(
							def.template.render({
								session: await intoPayload(session),
							})
						);
					} catch (e) {
						console.error(e);
						row.push('');
					}
				}

				contents[file.path].push(row);

				progress(1 / sessionIds.length);
			} else if (file.scope === 'observation') {
				const extra = entries(protocol.darwincore.fields?.observation ?? {})
					.filter(([field]) => fieldIncludedInFile(protocol, file, field))
					.map(([field, template]) => ({ field, template }));

				const rawObservations = await db.getAllFromIndex(
					'Observation',
					'sessionId',
					sessionId
				);

				const observations = rawObservations.map((o) => Tables.Observation.assert(o));

				const rawImages = await db.getAllFromIndex('Image', 'sessionId', sessionId);

				const images = rawImages.map((i) => Tables.Image.assert(i));

				for (const obs of observations) {
					const values = mergeMetadataFromImagesAndObservations({
						definitions: metadata,
						images: images.filter((img) => obs.images.includes(img.id)),
						observations: [obs],
					});

					const row = [sessionId];

					for (const def of metadata) {
						const value = values[def.id]?.value ?? null;
						row.push(
							metadataPrettyValue(value, {
								language: 'en',
								type: def.type,
								valueLabel:
									typeof value === 'string'
										? await db.get(
												'MetadataOption',
												metadataOptionId(def.id, value)
											)
										: undefined,
							})
						);
					}

					for (const def of extra) {
						try {
							row.push(
								def.template.render({
									session: await intoPayload(session),
									observation: await intoPayload(
										observations.find((o) => o.id === obs.id)!
									),
									images: await intoPayload(
										images.filter((i) => obs.images.includes(i.id))
									),
									allMetadata: toMetadataRecord(values),
									metadata: toMetadataRecord(values, (namespaced) =>
										protocol.metadata.includes(namespaced)
											? removeNamespaceFromMetadataId(namespaced)
											: undefined
									),
								})
							);
						} catch (err) {
							console.error(err);
							row.push('');
						}
					}

					contents[file.path].push(row);

					progress(1 / totalObservations);
				}
			} else if (file.scope === 'media') {
				const extra = entries(protocol.darwincore.fields?.media ?? {})
					.filter(([field]) => fieldIncludedInFile(protocol, file, field))
					.map(([field, template]) => ({ field, template }));

				const images = await db
					.getAllFromIndex('Image', 'sessionId', sessionId)
					.then((images) => images.map((image) => Tables.Image.assert(image)));

				const imageFiles = await db.getAllFromIndex('ImageFile', 'sessionId', sessionId);

				for (const imageFile of imageFiles) {
					contents[file.path].push([
						sessionId,
						...(await Promise.all(
							extra.map(async (def) => {
								try {
									return def.template.render({
										session: await intoPayload(session),
										file: imageFile,
										image: await intoPayload(
											images.find((i) => i.fileId === imageFile.id)!
										),
									});
								} catch (err) {
									console.error(err);
									return '';
								}
							})
						)),
					]);

					progress(1 / totalImageFiles);
				}
			}
		}
	}

	return mapValues(contents, (rows) => rows.map((row) => row.join('\t')).join('\n'));
}

/**
 * @see https://docs.gbif.org/survey-monitoring-quick-start/en/#data-mapping-template
 * @returns
 */
function darwinCoreMetafile(
	protocol: Pick<DB.Protocol, 'darwincore' | 'sessionMetadata' | 'metadataOrder'>,
	metadata: Pick<DB.Metadata, 'id' | 'darwincore'>[]
) {
	if (!protocol.darwincore) return;

	const { files } = protocol.darwincore;

	function fileNode(file: (typeof files)[number]) {
		const metadataFields = metadata.filter((m) =>
			fieldIncludedInFile(protocol, file, m.darwincore!)
		);

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
			new XmlNode(file.core ? 'id' : 'coreid', { index: 0 }),
			...metadataFields.map(
				(metadata, i) =>
					new XmlNode('field', {
						term: expandNamespaced(protocol, metadata.darwincore!),
						index: 1 + i,
					})
			),
			...Object.keys(protocol.darwincore!.fields?.[file.scope] ?? {})
				.filter((field) => fieldIncludedInFile(protocol, file, field))
				.map(
					(field, i) =>
						new XmlNode('field', {
							term: expandNamespaced(protocol, field),
							index: 1 + metadataFields.length + i,
						})
				)
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

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('darwinCoreMetafile', () => {
		expect(
			darwinCoreMetafile(
				{
					darwincore: DarwinCoreProtocolConfig.assert({
						eml: {
							language: 'English',
							title: 'Foo',
							geography: {},
							taxonomy: {},
							license: 'CC-BY-SA 4.0',
						},
						fields: {
							media: {
								'dc:identifier': 'helo',
							},
						},
					} satisfies (typeof DarwinCoreProtocolConfig)['inferIn']),
					sessionMetadata: ['foo__site', 'foo__when'],
					metadataOrder: ['foo__species', 'foo__genus'],
				},
				[
					{
						id: 'foo__site',
						darwincore: 'dwc:site',
					},
					{
						id: 'foo__genus',
						darwincore: 'dwc:genus',
					},
					{
						id: 'foo__when',
						darwincore: 'eco:transectStart',
					},
					{
						id: 'foo__species',
						darwincore: 'dwc:species',
					},
					{
						id: 'foo__confidence',
						darwincore: 'eco:confidence',
					},
				]
			)
		).toMatchInlineSnapshot(`
			"<?xml version="1.0" encoding="UTF-8"?>
			<archive xmlns="http://rs.tdwg.org/dwc/text/" metadata="eml.xml">
				<extension rowType="http://rs.tdwg.org/dwc/terms/Occurence" ignoreHeaderLines="1" encoding="UTF-8" fieldsTerminatedBy="\\t" linesTerminatedBy="\\n" fieldsEnclosedBy="">
					<files>
						<location>
							occurences.txt
						</location>
					</files>
					<coreid index="0" />
					<field term="http://rs.tdwg.org/dwc/terms/site" index="1" />
					<field term="http://rs.tdwg.org/dwc/terms/genus" index="2" />
					<field term="http://rs.tdwg.org/dwc/terms/species" index="3" />
				</extension>
				<extension rowType="http://rs.tdwg.org/eco/terms/Event" ignoreHeaderLines="1" encoding="UTF-8" fieldsTerminatedBy="\\t" linesTerminatedBy="\\n" fieldsEnclosedBy="">
					<files>
						<location>
							occurences_humboldt.txt
						</location>
					</files>
					<coreid index="0" />
					<field term="http://rs.tdwg.org/eco/terms/transectStart" index="1" />
					<field term="http://rs.tdwg.org/eco/terms/confidence" index="2" />
				</extension>
				<core rowType="http://rs.tdwg.org/dwc/terms/Event" ignoreHeaderLines="1" encoding="UTF-8" fieldsTerminatedBy="\\t" linesTerminatedBy="\\n" fieldsEnclosedBy="">
					<files>
						<location>
							events.txt
						</location>
					</files>
					<id index="0" />
					<field term="http://rs.tdwg.org/dwc/terms/site" index="1" />
					<field term="http://rs.tdwg.org/dwc/terms/genus" index="2" />
					<field term="http://rs.tdwg.org/dwc/terms/species" index="3" />
				</core>
				<extension rowType="http://rs.tdwg.org/dwc/terms/Event" ignoreHeaderLines="1" encoding="UTF-8" fieldsTerminatedBy="\\t" linesTerminatedBy="\\n" fieldsEnclosedBy="">
					<files>
						<location>
							events_humboldt.txt
						</location>
					</files>
					<coreid index="0" />
					<field term="http://rs.tdwg.org/eco/terms/transectStart" index="1" />
					<field term="http://rs.tdwg.org/eco/terms/confidence" index="2" />
				</extension>
				<extension rowType="http://rs.gbif.org/terms/1.0/Multimedia" ignoreHeaderLines="1" encoding="UTF-8" fieldsTerminatedBy="\\t" linesTerminatedBy="\\n" fieldsEnclosedBy="">
					<files>
						<location>
							media.txt
						</location>
					</files>
					<coreid index="0" />
					<field term="http://purl.org/dc/terms/identifier" index="1" />
				</extension>
			</archive>"
		`);
	});
}

/**
 *
 * @see https://ipt.gbif.org/manual/en/ipt/latest/gbif-metadata-profile
 */
function darwinCoreEmlFile(
	protocol: Pick<DB.Protocol, 'darwincore' | 'authors' | 'description' | 'logo'>,
	_metadata: Pick<DB.Metadata, 'id' | 'darwincore'>[],
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

if (import.meta.vitest) {
	const { test, expect, vi } = import.meta.vitest;

	test('darwinCoreEmlFile', () => {
		vi.useFakeTimers();
		vi.setSystemTime(597e9);

		const protocol = {
			authors: [],
			description: 'Some description right here',
			logo: 'https://cigaleapp.github.io/cigale/favicon-96x96.png',
			darwincore: DarwinCoreProtocolConfig.assert({
				eml: {
					language: 'en-US',
					geography: {
						description: 'Somewhere in Folk Valley',
						coordinates: {
							north: 67,
							east: 69,
							south: 420,
							west: 666,
						},
					},
					license: 'CC-BY-SA 4.0',
					taxonomy: {
						description: 'Just some bullshit with fur',
						rank: { genus: 'Bullshittus' },
					},
					abstract:
						'We take some goofy ahh measurements and measure them with colonel whatsapp',
					beginsAt: '2026-01-01',
					endsAt: '2029-01-01',
					designDescription: 'Designed in the worst software ever (GIMP)',
					funding: 'my sugar daddy',
					gbif: { type: 'trans', subtype: 'secte' },
					keywords: ['growth mindset', 'focus sur les kpi', 'leadership'],
					maintenance: 'annually',
					studyAreaDescription: 'idk anymore vro',
					title: 'Foo',
				},
			} satisfies (typeof DarwinCoreProtocolConfig)['inferIn']),
		};

		expect(darwinCoreEmlFile(protocol, [], [])).toMatchInlineSnapshot(`
			"<?xml version="1.0" encoding="UTF-8"?>
			<eml:eml xmlns:eml="https://eml.ecoinformatics.org/eml-2.2.0">
				<dataset>
					<title>
						Foo
					</title>
					<language>
						en-US
					</language>
					<abstract>
						We take some goofy ahh measurements and measure them with colonel whatsapp
					</abstract>
					<keywordSet>
						<keyword>
							growth mindset
						</keyword>
						<keyword>
							focus sur les kpi
						</keyword>
						<keyword>
							leadership
						</keyword>
						<keywordThesaurus>
							n/a
						</keywordThesaurus>
					</keywordSet>
					<keywordSet>
						<keyword>
							trans
						</keyword>
						<keywordThesaurus>
							GBIF Dataset Type Vocabulary: http://rs.gbif.org/vocabulary/gbif/dataset_type_2015-07-10.xml
						</keywordThesaurus>
					</keywordSet>
					<keywordSet>
						<keyword>
							secte
						</keyword>
						<keywordThesaurus>
							GBIF Dataset Subtype Vocabulary: http://rs.gbif.org/vocabulary/gbif/dataset_subtype.xml
						</keywordThesaurus>
					</keywordSet>
					<coverage>
						<taxonomicCoverage>
							<generalTaxonomicCoverage>
								Just some bullshit with fur
							</generalTaxonomicCoverage>
							<taxonomicClassification>
								<taxonRankName>
									genus
								</taxonRankName>
								<taxonRankValue>
									Bullshittus
								</taxonRankValue>
							</taxonomicClassification>
						</taxonomicCoverage>
						<geographicCoverage>
							<geographicDescription>
								Somewhere in Folk Valley
							</geographicDescription>
							<boundingCoordinates>
								<westBoundingCoordinates>
									666
								</westBoundingCoordinates>
								<eastBoundingCoordinates>
									69
								</eastBoundingCoordinates>
								<southBoundingCoordinates>
									420
								</southBoundingCoordinates>
								<northBoundingCoordinates>
									67
								</northBoundingCoordinates>
							</boundingCoordinates>
						</geographicCoverage>
						<temporalCoverage>
							<rangeOfDates>
								<beginDate>
									<calendarDate>
										2026-01-01
									</calendarDate>
								</beginDate>
								<endDate>
									<calendarDate>
										2029-01-01
									</calendarDate>
								</endDate>
							</rangeOfDates>
						</temporalCoverage>
					</coverage>
					<method>
						<sampling>
							<samplingDescription>
								Some description right here
							</samplingDescription>
						</sampling>
					</method>
					<intellectualRights>
						CC-BY-SA 4.0
					</intellectualRights>
				</dataset>
				<additionalMetadata>
					<metadata>
						<gbif>
							<dateStamp>
								1988-12-01T17:20:00.000Z
							</dateStamp>
							<resourceLogoUrl>
								https://cigaleapp.github.io/cigale/favicon-96x96.png
							</resourceLogoUrl>
						</gbif>
					</metadata>
				</additionalMetadata>
			</eml:eml>"
		`);
	});
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

function fileOfMetadata(
	protocol: Pick<DB.Protocol, 'darwincore' | 'sessionMetadata'>,
	metadata: Pick<DB.Metadata, 'darwincore' | 'id'>
) {
	for (const file of protocol.darwincore?.files ?? []) {
		if (!metadata.darwincore) continue;

		const sessionwide = protocol.sessionMetadata.includes(metadata.id);
		if (file.scope === 'session' && !sessionwide) continue;
		if (file.scope === 'observation' && sessionwide) continue;

		if (!fieldIncludedInFile(protocol, file, metadata.darwincore)) continue;

		return file;
	}

	return;
}

function fieldOfMetadata(
	protocol: Pick<DB.Protocol, 'darwincore' | 'sessionMetadata' | 'metadataOrder'>,
	allMetadata: Pick<DB.Metadata, 'darwincore' | 'id'>[],
	metadata: Pick<DB.Metadata, 'darwincore' | 'id'>
) {
	const file = fileOfMetadata(protocol, metadata);
	if (!file) return;
	// Get all metadata of that file, in order

	const all = allMetadata
		.filter((m) => fileOfMetadata(protocol, m)?.path === file.path)
		.sort(compareBy((m) => protocol.metadataOrder?.indexOf(m.id)));

	return {
		file,
		key: metadata.darwincore!,
		// First field is the id
		index: all.findIndex((m) => m.id === metadata.id) + 1,
	};
}

type ScalarTree = XmlNode | undefined | string | number | boolean | { [key: string]: ScalarTree };

class XmlNode {
	children: XmlNode[];
	textContent = '';
	attributes: Record<string, string | number | undefined> = {};
	tag: '#text' | (string & {});

	constructor(tag: typeof this.tag, ...children: XmlNode[]);
	constructor(tag: typeof this.tag, text: string);
	constructor(tag: typeof this.tag, attributes: typeof this.attributes, ...children: XmlNode[]);
	constructor(tag: typeof this.tag, attributes: typeof this.attributes, text: string);
	constructor(
		tag: typeof this.tag,
		...args:
			| XmlNode[]
			| [string]
			| [typeof this.attributes, ...XmlNode[]]
			| [typeof this.attributes, string]
	) {
		this.tag = tag;
		const [second, third, ...rest] = args;
		this.children = [];
		this.attributes = {};
		if (!second) return;

		if (typeof second === 'string' || second instanceof XmlNode) {
			return new XmlNode(tag, {}, ...args);
		}

		this.attributes = second;
		if (typeof third === 'string') {
			this.children = [XmlNode.text(third)];
		} else if (third) {
			this.children = [third, ...rest];
		}
	}

	static text(text: string) {
		const node = new XmlNode('#text');
		node.textContent = text;
		return node;
	}

	static nested(tag: string, tree: Record<string, ScalarTree>): XmlNode {
		return new XmlNode(
			tag,
			...Object.entries(tree).flatMap(([key, value]) => {
				if (value === undefined) return [];
				if (value instanceof XmlNode) return [value];
				if (typeof value === 'object') return [XmlNode.nested(key, value)];
				return [new XmlNode(key, value.toString())];
			})
		);
	}

	get selfClosing() {
		return this.children.length === 0;
	}

	/**
	 *
	 * @param inner don't add <?xml ?> marker at the start if this is false
	 * @returns
	 */
	toString(inner = false): string {
		const marker = inner ? '' : '<?xml version="1.0" encoding="UTF-8"?>\n';

		if (this.tag === '#text') {
			return this.textContent;
		}

		const attributes = Object.entries(this.attributes)
			.filter(([, value]) => value !== undefined)
			.map(([key, value]) => `${key}=${JSON.stringify(value!.toString())}`)
			.join(' ');

		const opening = attributes ? `${this.tag} ${attributes}` : this.tag;

		if (this.selfClosing) {
			return marker + `<${opening} />`;
		}

		const children = this.children
			.map((child) => '\t' + child.toString(true).replaceAll('\n', '\n\t'))
			.join('\n');

		return marker + `<${opening}>\n${children}\n</${this.tag}>`;
	}
}

if (import.meta.vitest) {
	const { test, describe, expect } = import.meta.vitest;

	describe('XmlNode', () => {
		test('no children', () => {
			expect(new XmlNode('example', { a: 3, foo: 'bar' }).toString()).toMatchInlineSnapshot(`
				"<?xml version="1.0" encoding="UTF-8"?>
				<example a="3" foo="bar" />"
			`);
		});

		test('text fragment', () => {
			expect(XmlNode.text('an example right there').toString()).toMatchInlineSnapshot(
				`"an example right there"`
			);
		});

		test('nested', async () => {
			const tree = new XmlNode(
				'wrapper',
				{ 'some-thing': 'here' },
				new XmlNode('inner', 'some text here'),
				new XmlNode('another', { hmmm: 'yes' })
			);

			expect(tree.toString()).toMatchInlineSnapshot(`
				"<?xml version="1.0" encoding="UTF-8"?>
				<wrapper some-thing="here">
					<inner>
						some text here
					</inner>
					<another hmmm="yes" />
				</wrapper>"
			`);

			const { XMLParser } = await import('fast-xml-parser');

			const parsed = new XMLParser().parse(tree.toString());
			expect(parsed).toMatchInlineSnapshot(`
				{
				  "?xml": "",
				  "wrapper": {
				    "another": "",
				    "inner": "some text here",
				  },
				}
			`);
		});
	});
}

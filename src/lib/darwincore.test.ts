import 'fake-indexeddb/auto';

import * as fflate from 'fflate';

import { beforeEach, expect, test, vi } from 'vitest';

import { darwinCoreArchive, darwinCoreEmlFile, darwinCoreMetafile, fileLayout } from './darwincore.js';
import { nukeDatabase, openDatabase } from './idb.svelte.js';
import { DarwinCoreProtocolConfig } from './schemas/darwincore.js';
import { metadataOptionId } from './schemas/metadata.js';

beforeEach(() => {
	nukeDatabase();
});

const mbase = {
	label: 'Foo',
	description: '',
	mergeMethod: 'none',
	required: false,
	images: [],
	sortable: false,
	groupable: false,
} as const;

const mockMetadatas = [
	{
		...mbase,
		type: 'string',
		id: 'foo__site',
		darwincore: 'dwc:site',
	},
	{
		...mbase,
		type: 'enum',
		id: 'foo__genus',
		darwincore: { key: 'dwc:genus' },
	},
	{
		...mbase,
		type: 'date',
		id: 'foo__when',
		darwincore: { datetime: 'eco:transectStart' },
	},
	{
		...mbase,
		type: 'enum',
		id: 'foo__species',
		darwincore: { key: 'dwc:species' },
	},
	{
		...mbase,
		type: 'number',
		id: 'foo__confidence',
		darwincore: 'eco:confidence',
	},
];

const mockProtocol = {
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
	sessionMetadata: ['foo__site' as const, 'foo__when' as const],
	metadataOrder: ['foo__species' as const, 'foo__genus' as const],
};

test('darwincoreDataFiles', async () => {
	const db = await openDatabase();

	const protocolId = 'proto';
	const sessionId = 'session-1';
	const metadataSiteId = `${protocolId}__site`;
	const metadataSpeciesId = `${protocolId}__species`;

	await db.put('Protocol', {
		id: protocolId,
		name: 'Darwin Core protocol',
		description: 'Testing darwin core archive export',
		metadata: [metadataSiteId, metadataSpeciesId],
		sessionMetadata: [metadataSiteId],
		metadataOrder: [metadataSpeciesId, metadataSiteId],
		importedMetadata: [],
		authors: [],
		darwincore: {
			eml: {
				language: 'en',
				title: 'Darwin Core protocol',
				license: 'CC-BY-SA 4.0',
			},
			namespaces: {
				ex: 'https://example.org/dwc',
			},
			fields: {
				session: {
					'dwc:eventID': '{{ session.id }}',
				},
				image: {
					'ex:imageName': '{{ image.filename }}',
				},
				media: {
					'dc:identifier': 'file-{{ file.id }}',
				},
			},
			files: [
				{
					core: true,
					scope: 'session',
					includes: ['dwc:*'],
					rowType: 'dwc:Event',
					path: 'events.txt',
				},
				{
					scope: 'image',
					includes: ['dwc:*', 'ex:*'],
					rowType: 'dwc:Occurence',
					path: 'occurences.txt',
				},
				{
					scope: 'media',
					includes: ['dc:*'],
					rowType: 'http://rs.gbif.org/terms/1.0/Multimedia',
					path: 'media.txt',
				},
			],
		},
	});

	await db.put('Metadata', {
		id: metadataSiteId,
		label: 'Site',
		description: '',
		mergeMethod: 'none',
		required: false,
		images: [],
		sortable: false,
		groupable: false,
		type: 'string',
		darwincore: 'dwc:locationID',
	});

	await db.put('Metadata', {
		id: metadataSpeciesId,
		label: 'Species',
		description: '',
		mergeMethod: 'none',
		required: false,
		images: [],
		sortable: false,
		groupable: false,
		type: 'enum',
		darwincore: {
			key: 'dwc:species',
			label: 'dwc:vernacularName',
		},
	});

	await db.put('MetadataOption', {
		id: metadataOptionId(metadataSpeciesId, 'sp1'),
		metadataId: metadataSpeciesId,
		key: 'sp1',
		label: 'Species one',
		confidence: 1,
		aliases: [],
		images: [],
		synonyms: [],
		dependsOn: {},
	});

	await db.put('Session', {
		id: sessionId,
		name: 'Session',
		description: '',
		createdAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
		openedAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
		protocol: protocolId,
		metadata: {
			[metadataSiteId]: {
				value: '"Forest"',
				confidences: {},
			},
		},
	});

	await db.put('ImageFile', {
		id: 'file-1',
		sessionId,
		bytes: 'migrated',
		filename: 'one.jpeg',
		contentType: 'image/jpeg',
		dimensions: { width: 10, height: 10 },
	});
	await db.put('ImageFile', {
		id: 'file-2',
		sessionId,
		bytes: 'migrated',
		filename: 'two.jpeg',
		contentType: 'image/jpeg',
		dimensions: { width: 10, height: 10 },
	});

	await db.put('Image', {
		id: '1_0',
		sessionId,
		fileId: 'file-1',
		filename: 'one.jpeg',
		addedAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
		dimensions: { width: 10, height: 10 },
		contentType: 'image/jpeg',
		metadataErrors: {},
		metadata: {
			[metadataSpeciesId]: {
				value: '"sp1"',
				confidences: {},
			},
		},
	});
	await db.put('Image', {
		id: '1_1',
		sessionId,
		fileId: 'file-2',
		filename: 'two.jpeg',
		addedAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
		dimensions: { width: 10, height: 10 },
		contentType: 'image/jpeg',
		metadataErrors: {},
		metadata: {
			[metadataSpeciesId]: {
				value: '"sp1"',
				confidences: {},
			},
		},
	});

	await db.put('Observation', {
		id: 'obs-1',
		sessionId,
		label: 'Observation 1',
		addedAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
		metadataOverrides: {},
		metadataErrors: {},
		images: ['1_0'],
	});
	await db.put('Observation', {
		id: 'obs-2',
		sessionId,
		label: 'Observation 2',
		addedAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
		metadataOverrides: {},
		metadataErrors: {},
		images: ['1_1'],
	});

	const progress = vi.fn<[number, number, 'eml' | 'meta' | 'data' | 'zipping'], void>();
	const zip = await darwinCoreArchive({
		db,
		protocolId,
		sessionIds: [sessionId],
		onProgress: progress,
	});

	const files = fflate.unzipSync(new Uint8Array(zip));
	const text = (path: string) => fflate.strFromU8(files[path]);
	const tsv = (path: string) => text(path).split('\n').map((row) => row.split('\t'));

	expect(Object.keys(files).toSorted()).toEqual([
		'eml.xml',
		'events.txt',
		'media.txt',
		'meta.xml',
		'occurences.txt',
	]);

	expect(tsv('events.txt')).toEqual([
		['sessionId', 'locationID', 'eventID'],
		[sessionId, 'Forest', sessionId],
	]);

	expect(tsv('occurences.txt')).toEqual([
		['sessionId', 'species', 'vernacularName', 'imageName'],
		[sessionId, 'sp1', 'Species one', 'one.jpeg'],
		[sessionId, 'sp1', 'Species one', 'two.jpeg'],
	]);

	const mediaRows = tsv('media.txt');
	expect(mediaRows[0]).toEqual(['sessionId', 'type', 'format', 'subtype', 'identifier']);
	expect(mediaRows.slice(1)).toEqual([
		[
			sessionId,
			'StillImage',
			'image/jpeg',
			'http://rs.tdwg.org/acsubtype/values/Photograph',
			'file-file-1',
		],
		[
			sessionId,
			'StillImage',
			'image/jpeg',
			'http://rs.tdwg.org/acsubtype/values/Photograph',
			'file-file-2',
		],
	]);

	expect(text('meta.xml')).toContain('<core rowType="http://rs.tdwg.org/dwc/terms/Event"');
	expect(text('eml.xml')).toContain('Darwin Core protocol');

	expect(progress.mock.calls.at(-1)).toEqual([5, 6, 'zipping']);
	expect(progress).toHaveBeenCalledWith(3, 6, 'meta');
	expect(progress).toHaveBeenCalledWith(4, 6, 'eml');
});

test('fileLayout', () => {
	expect(fileLayout(mockProtocol, mockMetadatas, mockProtocol.darwincore.files[0]))
		.toMatchInlineSnapshot(`
			[
			  {
			    "name": "sessionId",
			    "source": "id",
			  },
			  {
			    "compute": [Function],
			    "field": "dwc:species",
			    "metadataId": "foo__species",
			    "metadataType": "enum",
			    "source": "metadata",
			  },
			  {
			    "compute": [Function],
			    "field": "dwc:genus",
			    "metadataId": "foo__genus",
			    "metadataType": "enum",
			    "source": "metadata",
			  },
			]
		`);
});

test('darwinCoreMetafile', () => {
	expect(darwinCoreMetafile(mockProtocol, mockMetadatas)).toMatchInlineSnapshot(`
		"<?xml version="1.0" encoding="UTF-8"?>
		<archive xmlns="http://rs.tdwg.org/dwc/text/" metadata="eml.xml">
			<extension rowType="http://rs.tdwg.org/dwc/terms/Occurence" ignoreHeaderLines="1" encoding="UTF-8" fieldsTerminatedBy="\\t" linesTerminatedBy="\\n" fieldsEnclosedBy="">
				<files>
					<location>
						occurences.txt
					</location>
				</files>
				<coreid index="0" />
				<!-- from metadata foo__species -->
				<field term="http://rs.tdwg.org/dwc/terms/species" index="1" />
				<!-- from metadata foo__genus -->
				<field term="http://rs.tdwg.org/dwc/terms/genus" index="2" />
			</extension>
			<extension rowType="http://rs.tdwg.org/eco/terms/Event" ignoreHeaderLines="1" encoding="UTF-8" fieldsTerminatedBy="\\t" linesTerminatedBy="\\n" fieldsEnclosedBy="">
				<files>
					<location>
						occurences_humboldt.txt
					</location>
				</files>
				<coreid index="0" />
			</extension>
			<core rowType="http://rs.tdwg.org/dwc/terms/Event" ignoreHeaderLines="1" encoding="UTF-8" fieldsTerminatedBy="\\t" linesTerminatedBy="\\n" fieldsEnclosedBy="">
				<files>
					<location>
						events.txt
					</location>
				</files>
				<id index="0" />
				<!-- from metadata foo__site -->
				<field term="http://rs.tdwg.org/dwc/terms/site" index="1" />
			</core>
			<extension rowType="http://rs.tdwg.org/dwc/terms/Event" ignoreHeaderLines="1" encoding="UTF-8" fieldsTerminatedBy="\\t" linesTerminatedBy="\\n" fieldsEnclosedBy="">
				<files>
					<location>
						events_humboldt.txt
					</location>
				</files>
				<coreid index="0" />
				<!-- from metadata foo__when -->
				<field term="http://rs.tdwg.org/eco/terms/transectStart" index="1" />
			</extension>
			<extension rowType="http://rs.gbif.org/terms/1.0/Multimedia" ignoreHeaderLines="1" encoding="UTF-8" fieldsTerminatedBy="\\t" linesTerminatedBy="\\n" fieldsEnclosedBy="">
				<files>
					<location>
						media.txt
					</location>
				</files>
				<coreid index="0" />
				<!-- from built-in extra field -->
				<field term="http://purl.org/dc/terms/type" index="1" />
				<!-- from built-in extra field -->
				<field term="http://purl.org/dc/terms/format" index="2" />
				<!-- from built-in extra field -->
				<field term="http://purl.org/dc/terms/subtype" index="3" />
				<!-- from protocol (darwincore.fields.media."dc:identifier") extra field -->
				<field term="http://purl.org/dc/terms/identifier" index="4" />
			</extension>
		</archive>"
	`);
});

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

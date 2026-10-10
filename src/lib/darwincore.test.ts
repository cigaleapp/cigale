import { expect, test, vi } from 'vitest';

import { darwinCoreEmlFile, darwinCoreMetafile, fileLayout } from './darwincore.js';
import { DarwinCoreProtocolConfig } from './schemas/darwincore.js';

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
	sessionMetadata: ['foo__site', 'foo__when'] as const,
	metadataOrder: ['foo__species', 'foo__genus'] as const,
};

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

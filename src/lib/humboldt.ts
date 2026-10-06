import type * as DB from '$lib/database.js';

import * as dates from 'date-fns';

import { compareBy, nonnull, orEmpty, orEmpty2 } from '$lib/utils.js';

import { BUILTIN_DARWINCORE_NAMESPACES, DarwinCoreProtocolConfig } from './schemas/darwincore.js';

/**
 * @see https://docs.gbif.org/survey-monitoring-quick-start/en/#data-mapping-template
 * @returns
 */
export function darwinCoreMetafile(
	protocol: Pick<DB.Protocol, 'darwincore' | 'sessionMetadata' | 'metadataOrder'>,
	metadata: Pick<DB.Metadata, 'id' | 'darwincore'>[]
) {
	if (!protocol.darwincore) return;

	const { namespaces: additionalNamespaces, files } = protocol.darwincore;

	const namespaces: Record<string, string> = {
		...BUILTIN_DARWINCORE_NAMESPACES,
		...(additionalNamespaces ?? {}),
	};

	function withNamespace(ns: string, value: string) {
		const baseUrl = namespaces[ns];
		if (!baseUrl) throw new Error(`Namespace DarwinCore ${JSON.stringify(ns)} inconnu`);

		return `${baseUrl.replace(/\/$/, '')}/${value}`;
	}

	function expandNamespaced(key: string) {
		const [ns, bare] = key.split(':');
		return withNamespace(ns, bare);
	}

	function fileNode(file: (typeof files)[number]) {
		return new XmlNode(
			file.core ? 'core' : 'extension',
			{
				rowType: withNamespace(file.namespace, file.rowType),
				ignoreHeaderLines: '1',
				encoding: 'UTF-8',
				fieldsTerminatedBy: '\t',
				linesTerminatedBy: '\n',
				fieldsEnclosedBy: '',
			},
			new XmlNode('files', new XmlNode('location', file.path)),
			new XmlNode(file.core ? 'id' : 'coreid', { index: 0 }),
			...metadata
				.map((m) => fieldOfMetadata(protocol, metadata, m))
				.filter(nonnull)
				.map((f) => new XmlNode('field', { term: expandNamespaced(f.key), index: f.index }))
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
						<coreid />
						<field />
						<field />
						<field />
						<field />
						<field />
					</extension>
					<extension rowType="http://rs.tdwg.org/eco/terms/Event" ignoreHeaderLines="1" encoding="UTF-8" fieldsTerminatedBy="\\t" linesTerminatedBy="\\n" fieldsEnclosedBy="">
						<files>
							<location>
								occurences_humboldt.txt
							</location>
						</files>
						<coreid />
						<field />
						<field />
						<field />
						<field />
						<field />
					</extension>
					<core rowType="http://rs.tdwg.org/dwc/terms/Event" ignoreHeaderLines="1" encoding="UTF-8" fieldsTerminatedBy="\\t" linesTerminatedBy="\\n" fieldsEnclosedBy="">
						<files>
							<location>
								events.txt
							</location>
						</files>
						<id />
						<field />
						<field />
						<field />
						<field />
						<field />
					</core>
					<extension rowType="http://rs.tdwg.org/eco/terms/Event" ignoreHeaderLines="1" encoding="UTF-8" fieldsTerminatedBy="\\t" linesTerminatedBy="\\n" fieldsEnclosedBy="">
						<files>
							<location>
								events_humboldt.txt
							</location>
						</files>
						<coreid />
						<field />
						<field />
						<field />
						<field />
						<field />
					</extension>
				</archive>"
			`);
	});
}

/**
 *
 * @see https://ipt.gbif.org/manual/en/ipt/latest/gbif-metadata-profile
 */
export function darwinCoreEmlFile(
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
					<abstract>
						We take some goofy ahh measurements and measure them with colonel whatsapp
					</abstract>
					<keywordSet>
						<keyword>
							growth mindset
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
					</keywordSet>
					<keywordSet>
						<keyword>
							secte
						</keyword>
					</keywordSet>
					<coverage>
						<taxonomicCoverage>
							<generalTaxonomicCoverage>
								Just some bullshit with fur
							</generalTaxonomicCoverage>
						</taxonomicCoverage>
						<temporalCoverage>
							<rangeOfDates>
								<beginDate>
									<calendarDate>
										2026-01-01
									</calendarDate>
								</beginDate>
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
						</gbif>
					</metadata>
				</additionalMetadata>
			</eml:eml>"
		`);
	});
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

		const [ns] = metadata.darwincore.split(':');

		if (ns !== file.namespace) continue;

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
			| []
			| [string | XmlNode | typeof this.attributes, ...XmlNode[]]
			| [typeof this.attributes, string]
	) {
		this.tag = tag;
		const [first, second, ...rest] = args;
		this.children = [];
		this.attributes = {};
		if (!first) return;

		if (typeof first === 'string') {
			this.children = [XmlNode.text(first)];
		} else if (first instanceof XmlNode) {
			this.children = [first, ...rest];
		} else if (typeof second === 'string') {
			this.attributes = first;
			this.children = [XmlNode.text(second)];
		} else if (second) {
			this.attributes = first;
			this.children = [second, ...rest];
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
				<example />"
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
					<another />
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

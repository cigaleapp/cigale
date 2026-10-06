import * as yauzl from 'yauzl-promise';

import protocol from '../examples/arthropods.light.cigaleprotocol.json' with { type: 'json' };
import { expect, testBasic } from './fixtures.js';
import { expectZipFiles, waitAndSaveDownload } from './utils/core.js';
import { goToSessionPage } from './utils/navigation.js';
import { importProtocol } from './utils/protocols.js';
import { chooseFirstSession } from './utils/sessions.js';

testBasic('can export to a DarwinCore Archive', async ({ page, app }) => {
	await app.tabs.go('protocols');
	await importProtocol(page, 'examples/arthropods.light.cigaleprotocol.json', (p) => {
		p.darwincore = {
			eml: { language: 'en', title: 'Example protocol', license: 'CC-BY-SA 4.0' },
			namespaces: { expl: 'https://example.com/fields/' },
			fields: {
				media: { 'expl:test': 'foo-{{ file.id }}', 'dwc:bar': 'baz' },
				image: { 'expl:img': '{{ image.filename }}' },
				session: { 'expl:s': '{{ session.id }}' },
			},
			files: [
				{
					rowType: 'expl:Media',
					scope: 'media',
					includes: ['dwc:*', 'expl:*'],
					path: 'example_m.txt',
				},
				{
					rowType: 'https://example.com/special/Image',
					scope: 'image',
					includes: ['expl:*'],
					path: 'example_i.txt',
				},
				{
					rowType: 'dwc:Occurence',
					scope: 'image',
					includes: ['dwc:*'],
					path: 'occurences.txt',
				},
				{
					core: true,
					rowType: 'expl:Session',
					scope: 'session',
					includes: ['expl:*'],
					path: 'example_s.txt',
				},
			],
		};

		p.metadata[`${p.id}__species`].darwincore = {
			key: 'dwc:acceptedNameUsageID',
			label: 'dwc:scientificName',
			image: 'expl:image',
		};

		p.sessionMetadata[`${p.id}__prospection_distance`].darwincore = {
			value: 'dwc:sampleSizeValue',
			unit: 'dwc:sampleSizeUnit',
		};
	});

	await app.tabs.go('sessions');
	await chooseFirstSession(page);
	await goToSessionPage(page);

	await app.metadata.textbox('Distance de prospection').fill('1312');

	await app.tabs.go('results');

	// TODO: assert that session value was written
	// await assert(await app.db.metadata.values({session:""}))

	const panel = page.getByTestId('export-results');

	await panel.getByRole('tab', { name: 'Fichiers' }).click();

	const downloaded = await waitAndSaveDownload(
		panel.getByRole('button', { name: 'Darwin Core' }),
		'.zip'
	);

	const [session] = await app.db.session.list();

	await expectZipFiles(
		await yauzl.open(downloaded),
		[
			'meta.xml',
			'eml.xml',
			'example_m.txt',
			'example_s.txt',
			'example_i.txt',
			'occurences.txt',
		],
		{
			'eml.xml': {
				xml(doc) {
					const root = doc['eml:eml'];
					expect(root.dataset).toHaveProperty('title', 'Example protocol');
					expect(root.dataset).toHaveProperty('language', 'en');
					expect(root.additionalMetadata.metadata.gbif).toHaveProperty('dateStamp');
				},
			},
			'meta.xml': {
				xml(doc) {
					const archive = doc.archive;
					const byFile = (name: string) =>
						archive.extension.find(
							(e: { files: { location: string } }) => e.files.location === name
						);

					expect(byFile('example_m.txt')).toMatchObject({
						$rowType: 'https://example.com/fields/Media',
						coreid: { $index: '0' },
						field: [
							{
								$term: 'https://example.com/fields/test',
								$index: '1',
							},
							{
								$term: 'http://rs.tdwg.org/dwc/terms/bar',
								$index: '2',
							},
						],
					});

					expect(byFile('example_i.txt')).toMatchObject({
						$rowType: 'https://example.com/special/Image',
						coreid: { $index: '0' },
						field: [
							{
								$term: 'https://example.com/fields/image',
								$index: '1',
							},
							{
								$term: 'https://example.com/fields/img',
								$index: '2',
							},
						],
					});

					expect(byFile('occurences.txt')).toMatchObject({
						$rowType: 'http://rs.tdwg.org/dwc/terms/Occurence',
						coreid: { $index: '0' },
						field: [
							{
								$term: 'http://rs.tdwg.org/dwc/terms/acceptedNameUsageID',
								$index: '1',
							},
							{
								$term: 'http://rs.tdwg.org/dwc/terms/scientificName',
								$index: '2',
							},
						],
					});

					expect(archive.core).toMatchObject({
						$rowType: 'https://example.com/fields/Session',
						id: { $index: '0' },
						files: {
							location: 'example_s.txt',
						},
						field: {
							$term: 'https://example.com/fields/s',
							$index: '1',
						},
					});
				},
			},
			'example_i.txt': {
				tsv([header, ...rows]) {
					expect(header).toEqual(['sessionId', 'image', 'img']);
					expect(rows).toHaveLength(4);
					for (const [sessionid, image, img] of rows) {
						expect(sessionid).toEqual(session.id);
						expect(image).toBe('');
						expect(img).toMatch(/\.jpeg$/);
					}
				},
			},
			'example_m.txt': {
				tsv([header, ...rows]) {
					expect(header).toEqual(['sessionId', 'test', 'bar']);
					expect(rows).toHaveLength(4);
					for (const [sessionid, test, bar] of rows) {
						expect(sessionid).toEqual(session.id);
						expect(test).toMatch(/^foo-/);
						expect(bar).toBe('baz');
					}
				},
			},
			'example_s.txt': {
				tsv([header, ...rows]) {
					expect(header).toEqual(['sessionId', 's']);
					expect(rows).toHaveLength(1);
					const [sessionid, s] = rows[0];
					expect(sessionid).toEqual(session.id);
					expect(s).toEqual(session.id);
				},
			},
			'occurences.txt': {
				tsv([header, ...rows]) {
					const species = protocol.metadata[`${protocol.id}__species`].options;

					expect(header).toEqual(['sessionId', 'acceptedNameUsageID', 'scientificName']);
					expect(rows).toHaveLength(4);
					for (const [sessionid, acceptedNameUsageID, scientificName] of rows) {
						expect(sessionid).toEqual(session.id);
						if (acceptedNameUsageID) {
							const option = species.find((opt) => opt.key === acceptedNameUsageID);
							expect(option).toBeDefined();
							expect(scientificName).toBe(option?.label);
						}
					}
				},
			},
		}
	);
});

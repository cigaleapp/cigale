import type { AppFixture } from './fixtures.js';
import type { Page } from '@playwright/test';
import type { Analysis } from '$lib/schemas/exports.js';
import type { ExportedProtocol } from '$lib/schemas/protocols.js';

import { FixturePaths } from './filepaths.js';
import { assert, expect, test } from './fixtures.js';
import {
	expectZipFiles,
	exportResults,
	firstObservationCard,
	goToProtocolManagement,
	goToSessionPage,
	importPhotos,
	importProtocol,
	mockUrl,
	newSession,
} from './utils/index.js';

async function setup(
	{ page, app }: { page: Page; app: AppFixture },
	autoupdate: boolean
): Promise<{ oldVersion: number; newVersion: number }> {
	await goToProtocolManagement(page);

	const li = page.getByRole('listitem').filter({ hasText: 'Example: arthropodes (lightweight)' });

	await li.locator('details').click();

	const toggle = li.getByRole('switch', { name: 'Mises à jour automatiques' });

	if (autoupdate) {
		await toggle.check();
	} else {
		await toggle.uncheck();
	}

	const protocol = await app.db.protocol.byName('Example: arthropodes (lightweight)');
	if (!protocol) throw new Error('Protocol not found');

	const versions = {
		oldVersion: protocol.version! - 2,
		newVersion: protocol.version!,
	};

	await page.evaluate(
		async ([id, versions]) => {
			const current = await window.DB.get('Protocol', id);
			if (!current) throw new Error('Protocol not found in DB');
			await window.DB.put('Protocol', {
				...current,
				version: versions.oldVersion,
			});
		},
		[protocol.id, versions] as const
	);

	await page.reload();
	await app.db.ready();

	return versions;
}

test('can auto-update a protocol', async ({ page, app }) => {
	const { newVersion } = await setup({ page, app }, true);

	await assert(
		app.toasts.byMessage(
			'info',
			'Le protocole "Example: arthropodes (lightweight)" a été mis à jour'
		)
	).toBeVisible({
		timeout: 10_000,
	});

	const protocol = await app.db.protocol.byName('Example: arthropodes (lightweight)');
	assert(protocol).toHaveProperty('version', newVersion);
});

test('does not auto-update when disabled', async ({ page, app }) => {
	const { oldVersion } = await setup({ page, app }, false);

	await assert(
		app.toasts.byMessage('info', 'Le protocole "Example: arthropodes" a été mis à jour')
	).not.toBeVisible({
		timeout: 3000,
	});

	const protocol = await app.db.protocol.byName('Example: arthropodes (lightweight)');
	assert(protocol).toHaveProperty('version', oldVersion);
});

test('can use a protocol that imports metadata from another protocol', async ({
	page,
	context,
	app,
}) => {
	// await loadDatabaseDump(page, "db/kitchensink-protocol.devalue")
	await goToProtocolManagement(page);
	await page.getByText('Example: arthropodes (lightweight)').click();
	await page.getByRole('button', { name: 'Supprimer', exact: true }).click();
	await app.modals.confirmDeletion('modal_delete_protocol', 'Example: arthropodes (lightweight)');

	await mockUrl(page, context, 'https://example.com/protocols/com.example.remote.json', {
		json: {
			id: 'com.example.remote',
			name: 'Remote Protocol',
			description: 'This protocol is hosted remotely',
			authors: [],
			sessionMetadata: {
				remote_session_metadata: {
					type: 'string',
					description: '',
					group: 'all',
					label: 'Remote session metadata',
					required: false,
					mergeMethod: 'none',
				},
			},
			metadataGroups: {
				all: {
					name: 'All',
					description: 'Everything',
					collapsed: false,
				},
			},
			metadata: {
				remote_metadata: {
					type: 'boolean',
					description: '',
					group: 'all',
					label: 'Remote metadata',
					required: false,
					mergeMethod: 'none',
				},
			},
		} satisfies typeof ExportedProtocol.inferIn,
	});

	await mockUrl(
		page,
		context,
		'https://raw.githubusercontent.com/cigaleapp/cigale/main/protocols/registry.json',
		{
			json: {
				protocols: [
					{
						id: 'com.example.remote',
						url: 'https://example.com/protocols/com.example.remote.json',
					},
				],
			},
		}
	);

	// Trying to import from an unknown protocol should not work

	await importProtocol(page, {
		id: 'com.example.child',
		authors: [],
		description: 'Child protocol',
		name: 'Child Protocol',
		imports: [
			{
				from: 'com.example.unknown',
				metadata: ['feur'],
			},
			{
				from: 'com.example.remote',
				metadataGroups: ['all'],
			},
		],
		metadata: {},
	});

	await expect(
		app.toasts.byMessage(
			'error',
			'Protocol com.example.child inherits from unknown protocol com.example.unknown'
		)
	).toBeVisible();

	await importProtocol(page, {
		id: 'com.example.parent',
		authors: [],
		description: 'Parent protocol',
		name: 'Parent Protocol',
		sessionMetadata: {
			imported_session_metadata: {
				type: 'string',
				description: '',
				label: 'Imported session metadata',
				required: false,
				mergeMethod: 'none',
			},
		},
		metadata: {
			is_imported: {
				type: 'enum',
				description: '',
				label: 'Is imported',
				required: false,
				mergeMethod: 'none',
				options: [
					{ key: 'yes', label: 'Yes' },
					{ key: 'no', label: 'No' },
					{ key: 'ionknow', label: 'Ionknow' },
				],
			},
			not_imported: {
				type: 'boolean',
				description: '',
				label: 'Not imported',
				required: false,
				mergeMethod: 'none',
			},
			should_come_from_parent2: {
				type: 'boolean',
				description: '',
				label: 'WRONG!!!',
				required: false,
				mergeMethod: 'none',
			},
			imported_enum: {
				type: 'enum',
				description: '',
				label: 'Imported enum',
				required: false,
				mergeMethod: 'none',
				options: Array.from({ length: 3000 }, (_, i) => ({
					key: `option_${i}`,
					label: `Option ${i}`,
					cascade: { is_imported: i % 10 === 0 ? 'ionknow' : 'yes' },
					description: `This is the option №${i} 🤓`,
				})),
			},
		},
	});

	await importProtocol(page, {
		id: 'com.example.parent2',
		authors: [],
		description: 'Another parent protocol',
		name: 'Another Parent Protocol',
		sessionMetadata: {
			unrelated_session_metadata: {
				type: 'string',
				description: '',
				label: 'Unrelated session metadata',
				required: false,
				mergeMethod: 'none',
			},
		},
		metadata: {
			should_come_from_parent2: {
				type: 'boolean',
				description: 'SMILE :D (porter robinson reference)',
				label: 'Should come from parent2',
				required: false,
				mergeMethod: 'none',
			},

			crop: {
				type: 'boundingbox',
				description: '',
				label: '',
				required: false,
				mergeMethod: 'none',
			},
		},
	});

	await importProtocol(page, {
		id: 'com.example.unrelated',
		authors: [],
		description: 'Unrelated protocol',
		name: 'Unrelated Protocol',
		sessionMetadata: {
			unrelated_session_metadata: {
				type: 'string',
				description: '',
				label: 'Unrelated session metadata',
				required: false,
				mergeMethod: 'none',
			},
		},
		metadata: {
			unrelated_metadata: {
				type: 'boolean',
				description: '',
				label: 'Unrelated metadata',
				required: false,
				mergeMethod: 'none',
			},
		},
	});

	await importProtocol(page, {
		id: 'com.example.child',
		authors: [],
		description: 'Child protocol',
		name: 'Child Protocol',
		imports: [
			{
				from: 'com.example.parent',
				metadata: ['is_imported', 'imported_enum'],
				sessionMetadata: ['imported_session_metadata'],
			},
			{
				from: 'com.example.parent2',
				metadata: ['should_come_from_parent2', 'crop'],
			},
			{
				from: 'com.example.remote',
				metadataGroups: ['all'],
			},
		],
		metadata: {
			from_child: {
				type: 'boolean',
				description: '',
				label: 'From child',
				required: false,
				mergeMethod: 'none',
			},
		},
	});

	expect(await app.db.count('MetadataOption')).toBe(3000 + 3);

	await app.tabs.go('sessions');
	await newSession(page, {
		name: 'Test session',
		protocol: 'Child Protocol',
	});

	await goToSessionPage(page);

	await app.settings.set({ showTechnicalMetadata: false });

	await expect(page.getByTestId('session-metadata')).toMatchAriaSnapshot(`
	  - text: Imported session metadata
	  - textbox "Imported session metadata"
	  - button "Supprimer cette valeur" [disabled]:
	    - img
	  - paragraph:
	    - emphasis: (Optionnel)
	  - group:
	    - img
	    - text: All
	    - paragraph: Everything
	    - text: Remote session metadata
	    - textbox "Remote session metadata"
	    - button "Supprimer cette valeur" [disabled]:
	      - img
	    - paragraph:
	      - emphasis: (Optionnel)
	`);

	await page
		.getByTestId('session-metadata')
		.getByRole('textbox', { name: 'Remote session metadata' })
		.fill('Feur');

	await app.tabs.go('import');

	await importPhotos({ page }, 'leaf.jpeg');

	await page.getByText('leaf.jpeg').first().click();

	await expect(page.getByTestId('sidepanel-metadata')).toMatchAriaSnapshot(`
	  - text: From child
	  - switch:
	    - img
	  - button "Supprimer cette valeur" [disabled]:
	    - img
	  - text: Imported enum
	  - combobox
	  - button "Supprimer cette valeur" [disabled]:
	    - img
	  - text: Is imported
	  - button "Supprimer cette valeur" [disabled]:
	    - img
	  - radiogroup:
	    - radio "Yes"
	    - text: "Yes"
	    - radio "No"
	    - text: "No"
	    - radio "Ionknow"
	    - text: Ionknow
	  - text: Should come from parent2
	  - switch:
	    - img
	  - button "Supprimer cette valeur" [disabled]:
	    - img
	  - paragraph: SMILE :D (porter robinson reference)
	  - group:
	    - img
	    - text: All
	    - paragraph: Everything
	    - text: Remote metadata
	    - switch:
	      - img
	    - button "Supprimer cette valeur" [disabled]:
	      - img
	    - text: Remote session metadata
	    - textbox "Remote session metadata"
	    - button "Supprimer cette valeur" [disabled]:
	      - img
	`);

	await app.metadata.switch('From child').click();
	await app.metadata.combobox('Imported enum').fill('Option 20');
	await expect(page.getByTestId('metadata-combobox-viewport')).toMatchAriaSnapshot(`
	  - option /Option \\d+ --%/:
	    - text: ""
	    - code: "--%"
	  - option /Option \\d+ --%/:
	    - text: ""
	    - code: "--%"
	  - option /Option \\d+ --%/:
	    - text: ""
	    - code: "--%"
	  - option /Option \\d+ --%/:
	    - text: ""
	    - code: "--%"
	  - option /Option \\d+ --%/:
	    - text: ""
	    - code: "--%"
	  - option /Option \\d+ --%/:
	    - text: ""
	    - code: "--%"
	  - option /Option \\d+ --%/:
	    - text: ""
	    - code: "--%"
	  - option /Option \\d+ --%/:
	    - text: ""
	    - code: "--%"
	  - option /Option \\d+ --%/:
	    - text: ""
	    - code: "--%"
	  - option /Option \\d+ --%/:
	    - text: ""
	    - code: "--%"
	  - option /Option \\d+ --%/:
	    - text: ""
	    - code: "--%"
	  - heading "Option 0" [level=2]
	  - paragraph: This is the option №0 🤓
	  - table:
	    - rowgroup:
	      - row "Is imported Ionknow":
	        - cell "Is imported"
	        - cell "Ionknow"
	  - paragraph:
	    - emphasis: Métadonées mises à jour à la sélection de cette option
	`);
	await app.metadata.combobox('Imported enum').fill('2067');
	await page
		.getByTestId('metadata-combobox-viewport')
		.getByRole('option', { name: 'Option 2067' })
		.click();
	// Cascade
	await expect(app.metadata.radio('Is imported', 'Yes')).toBeChecked();
	await app.metadata.radio('Is imported', 'No').click();
	await app.metadata.switch('Should come from parent2').click();
	// Make it false
	await app.metadata.switch('Remote metadata').click();
	await app.metadata.switch('Remote metadata').click();

	await app.tabs.go('results');
	const zip = await exportResults(page, { kind: 'metadata' });
	await expectZipFiles(zip, ['analysis.json', 'metadata.csv'], {
		'analysis.json': {
			json(data: typeof Analysis.inferOut) {
				expect(Object.values(data.observations)[0].protocolMetadata).toEqual({
					from_child: assert.objectContaining({ value: true }),
					is_imported: assert.objectContaining({ value: 'no' }),
					should_come_from_parent2: assert.objectContaining({ value: true }),
					remote_metadata: assert.objectContaining({ value: false }),
					imported_enum: assert.objectContaining({ value: 'option_2067' }),
					crop: assert.objectContaining({ value: null }),
				});

				expect(data.session.protocolMetadata).toEqual({
					remote_session_metadata: assert.objectContaining({ value: 'Feur' }),
					imported_session_metadata: assert.objectContaining({ value: null }),
				});
			},
		},
	});
});

test('can infer metadata from a sidecar file', async ({ page, context, app, tempfiles }) => {
	await goToProtocolManagement(page);

	await app.settings.set({ showTechnicalMetadata: false });

	const locationDisplayName =
		'Околтын, Akaltyn, Oltinsoy District, Province de Sourkhan-Daria, Ouzbékistan';

	await mockUrl(
		page,
		context,
		'https://nominatim.openstreetmap.org/reverse\\?format=jsonv2&lat=38.12232&lon=67.676767&addressdetails=0',
		{
			json: {
				place_id: 194730330,
				licence: 'Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright',
				osm_type: 'way',
				osm_id: 855726288,
				lat: '38.1228066',
				lon: '67.6767144',
				category: 'highway',
				type: 'living_street',
				place_rank: 26,
				importance: 0.05337333409628439,
				addresstype: 'road',
				name: '',
				display_name: locationDisplayName,
				boundingbox: ['38.1227130', '38.1229923', '67.6758481', '67.6785654'],
			},
		}
	);

	tempfiles.at(FixturePaths.root);

	const sidecars = {
		xml: tempfiles.new(
			'XXXX.xml',
			`
			<mv>
				<value valid="yes" type="enum">one</value>
				<value valid="no" type="enum">unknown</value>
			</mv>	
		`
		),
		yaml: tempfiles.new(
			'XXXX.yml',
			`
location:
  coords: 38,12232; 67,676767
`
		),
		json: tempfiles.new(
			'XXXX.json',
			JSON.stringify(
				{
					cropbox: [
						{ cx: 0.6, cy: 0.2, w: 0.3, h: 0.4, score: 0.5 },
						{ sx: 0.1, sy: 0.15, w: 0.25, h: 0.35, score: 0.25 },
					],
					boolean: true,
					timestamp: new Date('2026-01-01T00:00:00Z').valueOf(),
					number: 100.4,
					text: 'some text right there  ',
				},
				null,
				2
			)
		),
	};

	await importProtocol(page, 'examples/kitchensink.cigaleprotocol.yaml', (p) => {
		p.id = 'com.example.sidecars';
		p.name = 'With sidecars';

		p.sidecars = {
			filepath: sidecars.json.filename,
		};

		p.metadata.crop.infer = {
			sidecar: 'cropbox',
		};

		p.metadata.bool.infer = {
			sidecar: 'boolean',
		};

		p.metadata.date.infer = {
			sidecar: 'timestamp ~> $fromMillis',
		};

		p.metadata.enum.infer = {
			sidecar: {
				filepath: sidecars.xml.filename,
				query: 'mv.value[$."@valid" = "yes"][$."@type" = "enum"]."#text"',
			},
		};

		p.metadata.float.infer = {
			sidecar: 'number',
		};

		p.metadata.integer.infer = {
			sidecar: '$floor(number)',
		};

		p.metadata.string.infer = {
			sidecar: 'text',
		};

		p.metadata.location.infer = {
			sidecar: {
				filepath: sidecars.yaml.filename,
				query: 'location.coords.$split("; ")#$i.$replace(",", ".").$number() { ($i = 0 ? "latitude" : "longitude"): $ }',
			},
		};

		p.metadata.sidecar.infer = {
			sidecar:
				'{ "content": $ ~> $json(2), "name": $sidecarfile.name, "type": "application/json" }',
		};
	});

	await newSession(page, {
		protocol: 'With sidecars',
	});

	await importPhotos({ page }, ['cyan.jpeg', sidecars.xml, sidecars.json, sidecars.yaml]);
	await page.waitForTimeout(1_000);

	await firstObservationCard(page).click();

	await expect(app.metadata.switch('bool')).toBeChecked();
	await expect(app.metadata.textbox('date')).toHaveValue('2026-01-01');
	await expect(app.metadata.radio('enum', 'Option 1', { exact: false })).toBeChecked();
	await expect(app.metadata.textbox('float')).toHaveValue('100.4');
	await expect(app.metadata.textbox('integer')).toHaveValue('100');
	await expect(app.metadata.textbox('string')).toHaveValue('some text right there  ');
	await expect(app.metadata.combobox('location')).toHaveValue(locationDisplayName);
	await expect(app.metadata.section('sidecar').locator('pre')).toHaveText(
		// there's also a <pre> tag for the fullscreen <dialog>
		[sidecars.json.content, sidecars.json.content]
	);

	const dbvalues = await app.db.metadata.values({
		image: 'cyan.jpeg',
		protocolId: 'com.example.sidecars',
	});

	expect(dbvalues.bool).toBe(true);
	expect(dbvalues.date).toEqual('2026-01-01T00:00:00');
	expect(dbvalues.enum).toBe('one');
	expect(dbvalues.float).toBe(100.4);
	expect(dbvalues.integer).toBe(100);
	expect(dbvalues.string).toBe('some text right there  ');
	expect(dbvalues.location).toEqual({ latitude: 38.12232, longitude: 67.676767 });
	expect(
		await page.evaluate(async (id) => {
			const f = await window.DB.get('MetadataValueFile', id);
			if (!f) throw new Error('MetadataValueFile not found');
			return JSON.parse(new TextDecoder('utf-8').decode(f.bytes));
		}, dbvalues.sidecar.toString())
	).toEqual(JSON.parse(sidecars.json.content));

	// Each box in a boundingbox-type sidecar inference result should create a separate Image for the ImageFile

	const images = await app.db.image.list();
	const crops = await Promise.all(
		images.map(async (image) => {
			const { crop } = await app.db.metadata.of({
				imageId: image.id,
				protocolId: 'com.example.sidecars',
			});

			return crop;
		})
	);

	expect(crops).toMatchObject([
		{
			parsedValue: { x: 0.6, y: 0.2, w: 0.3, h: 0.4 },
			confidence: 0.5,
		},
		{
			parsedValue: { x: 0.225, y: assert.closeTo(0.325, 5), w: 0.25, h: 0.35 },
			confidence: 0.25,
		},
	]);
});

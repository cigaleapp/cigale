import type { Page } from '@playwright/test';

import type { Analysis } from '$lib/schemas/exports.js';
import type { ExportedProtocol } from '$lib/schemas/protocols.js';

import { assert, expect, test, type AppFixture } from './fixtures.js';
import {
	expectZipFiles,
	exportResults,
	goToProtocolManagement,
	goToSessionPage,
	importPhotos,
	importProtocol,
	mockUrl,
	newSession
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
		newVersion: protocol.version!
	};

	await page.evaluate(
		async ([id, versions]) => {
			const current = await window.DB.get('Protocol', id);
			if (!current) throw new Error('Protocol not found in DB');
			await window.DB.put('Protocol', {
				...current,
				version: versions.oldVersion
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
		timeout: 10_000
	});

	const protocol = await app.db.protocol.byName('Example: arthropodes (lightweight)');
	assert(protocol).toHaveProperty('version', newVersion);
});

test('does not auto-update when disabled', async ({ page, app }) => {
	const { oldVersion } = await setup({ page, app }, false);

	await assert(
		app.toasts.byMessage('info', 'Le protocole "Example: arthropodes" a été mis à jour')
	).not.toBeVisible({
		timeout: 3000
	});

	const protocol = await app.db.protocol.byName('Example: arthropodes (lightweight)');
	assert(protocol).toHaveProperty('version', oldVersion);
});

test('can use a protocol that imports metadata from another protocol', async ({
	page,
	context,
	app
}) => {
	// await loadDatabaseDump(page, "db/kitchensink-protocol.devalue")
	await goToProtocolManagement(page);
	await page.getByText('Example: arthropodes (lightweight)').click();
	await page.getByRole('button', { name: 'Supprimer' }).click();
	await app.modals.confirmDeletion('modal_delete_protocol', 'Example: arthropodes (lightweight)');

	await mockUrl(
		page,
		context,
		'https://example.com/protocols/com.example.remote.cigaleprotocol.json',
		{
			json: {
				id: 'com.example.remote',
				name: 'Remote Protocol',
				description: 'This protocol is hosted remotely',
				authors: [],
				sessionMetadata: {
					remote_session_metadata: {
						type: 'string',
						description: '',
						label: 'Remote session metadata',
						required: false,
						mergeMethod: 'none'
					}
				},
				metadata: {
					remote_metadata: {
						type: 'boolean',
						description: '',
						label: 'Remote metadata',
						required: false,
						mergeMethod: 'none'
					}
				}
			} satisfies typeof ExportedProtocol.inferIn
		}
	);

	await mockUrl(
		page,
		context,
		'https://raw.githubusercontent.com/cigaleapp/cigale/main/protocols/registry.json',
		{
			json: {
				protocols: [
					{
						id: 'com.example.remote',
						url: 'https://example.com/protocols/com.example.remote.cigaleprotocol.json'
					}
				]
			}
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
				metadata: ['feur']
			},
			{
				from: 'com.example.remote',
				metadata: ['remote_metadata', 'remote_session_metadata']
			}
		],
		metadata: {}
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
				mergeMethod: 'none'
			}
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
					{ key: 'ionknow', label: 'Ionknow' }
				]
			},
			not_imported: {
				type: 'boolean',
				description: '',
				label: 'Not imported',
				required: false,
				mergeMethod: 'none'
			},
			should_come_from_parent2: {
				type: 'boolean',
				description: '',
				label: 'WRONG!!!',
				required: false,
				mergeMethod: 'none'
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
					description: `This is the option №${i} 🤓`
				}))
			}
		}
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
				mergeMethod: 'none'
			}
		},
		metadata: {
			should_come_from_parent2: {
				type: 'boolean',
				description: 'SMILE :D (porter robinson reference)',
				label: 'Should come from parent2',
				required: false,
				mergeMethod: 'none'
			},

			crop: {
				type: 'boundingbox',
				description: '',
				label: '',
				required: false,
				mergeMethod: 'none'
			}
		}
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
				mergeMethod: 'none'
			}
		},
		metadata: {
			unrelated_metadata: {
				type: 'boolean',
				description: '',
				label: 'Unrelated metadata',
				required: false,
				mergeMethod: 'none'
			}
		}
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
				sessionMetadata: ['imported_session_metadata']
			},
			{
				from: 'com.example.parent2',
				metadata: ['should_come_from_parent2', 'crop']
			},
			{
				from: 'com.example.remote',
				metadata: ['remote_metadata'],
				sessionMetadata: ['remote_session_metadata']
			}
		],
		metadata: {
			from_child: {
				type: 'boolean',
				description: '',
				label: 'From child',
				required: false,
				mergeMethod: 'none'
			}
		}
	});

	expect(await app.db.count('MetadataOption')).toBe(3000 + 3);

	await app.tabs.go('sessions');
	await newSession(page, {
		name: 'Test session',
		protocol: 'Child Protocol'
	});

	await goToSessionPage(page);

	await app.settings.set({ showTechnicalMetadata: false });

	await expect(page.getByTestId('session-metadata')).toMatchAriaSnapshot(`
	  - text: Imported session metadata
	  - textbox "Imported session metadata"
	  - button "Supprimer cette valeur" [disabled]:
	    - img
	  - text: Remote session metadata
	  - textbox "Remote session metadata"
	  - button "Supprimer cette valeur" [disabled]:
	    - img
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
	  - text: Remote metadata
	  - switch:
	    - img
	  - button "Supprimer cette valeur" [disabled]:
	    - img
	`);

	await app.sidepanel.metadataSection('From child').getByRole('switch').click();
	await app.sidepanel.metadataSection('Imported enum').getByRole('combobox').fill('Option 20');
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
	await app.sidepanel.metadataSection('Imported enum').getByRole('combobox').fill('2067');
	await page
		.getByTestId('metadata-combobox-viewport')
		.getByRole('option', { name: 'Option 2067' })
		.click();
	// Cascade
	await expect(
		app.sidepanel
			.metadataSection('Is imported')
			.getByRole('radio', { name: 'Yes', exact: true })
	).toBeChecked();
	await app.sidepanel
		.metadataSection('Is imported')
		.getByRole('radio', { name: 'No', exact: true })
		.click();
	await app.sidepanel.metadataSection('Should come from parent2').getByRole('switch').click();
	// Make it false
	await app.sidepanel.metadataSection('Remote metadata').getByRole('switch').click();
	await app.sidepanel.metadataSection('Remote metadata').getByRole('switch').click();

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
					crop: assert.objectContaining({ value: null })
				});

				expect(data.session.protocolMetadata).toEqual({
					remote_session_metadata: assert.objectContaining({ value: 'Feur' }),
					imported_session_metadata: assert.objectContaining({ value: null })
				});
			}
		}
	});
});

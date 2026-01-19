

import { exampleProtocol, expect, test } from '../fixtures.js';
import {
	confirmDeletionModal,
	dumpDatabase,
	goToProtocolManagement,
	importPhotos,
	importProtocol,
	importResults,
	newSession
} from '../utils/index.js';

test.skip(
	Boolean(process.env.CI),
	'Skipping database dumps and exports on CI, these are meant as easy way to (re)create dump fixtures locally only.'
);

test('basic', async ({ page }) => {
	await goToProtocolManagement(page);
	await importProtocol(page, 'arthropods.light.cigaleprotocol.json');

	await importResults(page, 'exports/correct.zip');
	await dumpDatabase(page, 'basic.devalue');
});

test('kitchensink-protocol', async ({ page, app }) => {
	await goToProtocolManagement(page);
	await importProtocol(page, 'kitchensink.cigaleprotocol.yaml');
	await page
		.getByRole('listitem')
		.filter({ hasText: exampleProtocol.id })
		.locator('details')
		.click();
	await page
		.getByRole('listitem')
		.filter({ hasText: exampleProtocol.id })
		.getByRole('button', { name: 'Supprimer' })
		.click();
	await confirmDeletionModal(page, { type: exampleProtocol.name });
	await expect(page.getByText('Protocole supprimé')).toBeVisible();
	await newSession(page);

	await app.tabs.go('import');
	await importPhotos({ page }, 'cyan.jpeg', 'leaf.jpeg');
	await page.waitForTimeout(2_000);
	await dumpDatabase(page, 'kitchensink-protocol.devalue');
});

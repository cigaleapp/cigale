import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { expect, type Page } from '@playwright/test';

import type { FixturePaths } from '../filepaths.js';
import { exampleProtocol, test as setup } from '../fixtures.js';
import {
	confirmDeletionModal,
	goHome,
	goToProtocolManagement,
	importPhotos,
	importProtocol,
	importResults,
	newSession
} from '../utils/index.js';

setup('basic', async ({ page }) => {
	await goToProtocolManagement(page);
	await importProtocol(page, 'arthropods.light.cigaleprotocol.json');

	await importResults(page, 'exports/correct.zip');

	// Prevent storing current session state in localStorage
	await goHome(page);

	await writeStorageState(page, 'storage-states/basic.json');
});

setup('kitchensink-protocol', async ({ page, app }) => {
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

	// Prevent storing current session state in localStorage
	await goHome(page);

	await writeStorageState(page, 'storage-states/kitchensink-protocol.json');
});

async function writeStorageState(page: Page, filename: FixturePaths.StorageStates) {
	const destination = path.join(import.meta.dirname, '../..', filename);

	mkdirSync(path.dirname(destination), { recursive: true });
	await page.context().storageState({
		indexedDB: true,
		path: destination
	});
}

import { mkdirSync } from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';

import { expect } from '@playwright/test';

import lightProtocol from '../../examples/arthropods.light.cigaleprotocol.json' with { type: 'json' };
import { FixturePaths } from '../filepaths.js';
import { exampleProtocol, test as setup } from '../fixtures.js';
import {
	confirmDeletionModal,
	goHome,
	goToProtocolManagement,
	importPhotos,
	importProtocol,
	importResults,
	newSession,
} from '../utils/index.js';

setup('basic', async ({ page }) => {
	await goToProtocolManagement(page);
	await importProtocol(page, 'examples/arthropods.light.cigaleprotocol.json');

	await importResults(page, 'exports/correct.zip');

	// Prevent storing current session state in localStorage
	await goHome(page);

	await writeStorageState(page, 'storage-states/basic.json', {
		builtinProtocols: JSON.stringify([lightProtocol.source]),
	});
});

setup('kitchensink-protocol', async ({ page, app }) => {
	await goToProtocolManagement(page);
	await importProtocol(page, 'examples/kitchensink.cigaleprotocol.yaml');
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
	await app.wait('2s');

	// Prevent storing current session state in localStorage
	await goHome(page);

	await writeStorageState(page, 'storage-states/kitchen-sink.json', {
		builtinProtocols: JSON.stringify([]),
	});
});

async function writeStorageState(
	page: Page,
	filename: FixturePaths.StorageStates,
	localStorageOverrides?: Record<string, string>
): Promise<void> {
	const destination = path.join(FixturePaths.root, filename);

	await page.evaluate((overrides) => {
		if (!overrides) return;
		for (const [key, value] of Object.entries(overrides)) {
			localStorage.setItem(key, value);
		}
	}, localStorageOverrides);

	mkdirSync(path.dirname(destination), { recursive: true });
	await page.context().storageState({
		indexedDB: true,
		path: destination,
	});
}

import { mkdirSync } from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';
import type { RemovePrefix } from '$lib/utils.js';

import { expect } from '@playwright/test';

import { collectOPFSState } from '$e2e/utils/opfs.js';

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

setup.use({ storageState: { cookies: [], origins: [] }, opfsState: [] });

setup('empty, basic', async ({ page }) => {
	await goToProtocolManagement(page);
	await importProtocol(page, 'examples/arthropods.light.cigaleprotocol.json');

	await writeStates(page, 'empty.json', {
		localStorage: {
			builtinProtocols: JSON.stringify([lightProtocol.source]),
		},
	});

	await importResults(page, 'exports/correct.zip');

	// Prevent storing current session state in localStorage
	await goHome(page);

	await writeStates(page, 'basic.json', {
		localStorage: {
			builtinProtocols: JSON.stringify([lightProtocol.source]),
		},
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
	await newSession(page, {
		protocol: 'Kitchen sink',
	});

	await app.tabs.go('import');
	await importPhotos({ page }, 'cyan.jpeg', 'leaf.jpeg');
	await app.wait('2s');

	// Prevent storing current session state in localStorage
	await goHome(page);

	await writeStates(page, 'kitchen-sink.json', {
		localStorage: {
			builtinProtocols: JSON.stringify([]),
		},
	});
});

async function writeStates(
	page: Page,
	filename: RemovePrefix<'storage-states/', FixturePaths.StorageStates> &
		RemovePrefix<'opfs-states/', FixturePaths.OPFSStates>,
	overrides: { localStorage?: Record<string, string> } = {}
) {
	await writeStorageState(page, `storage-states/${filename}`, overrides?.localStorage);
	await collectOPFSState(page, `opfs-states/${filename}`);
}

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

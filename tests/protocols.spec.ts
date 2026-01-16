import type { Page } from '@playwright/test';

import { expect, test, type AppFixture } from './fixtures.js';
import { goToProtocolManagement } from './utils.js';

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

	await expect(
		app.toasts.byMessage('info', 'Le protocole "Example: arthropodes (lightweight)" a été mis à jour')
	).toBeVisible();

	const protocol = await app.db.protocol.byName('Example: arthropodes (lightweight)');
	expect(protocol).toHaveProperty('version', newVersion);
});

test('does not auto-update when disabled', async ({ page, app }) => {
	const { oldVersion } = await setup({ page, app }, false);

	await expect(
		app.toasts.byMessage('info', 'Le protocole "Example: arthropodes" a été mis à jour')
	).not.toBeVisible({
		timeout: 3000
	});

	const protocol = await app.db.protocol.byName('Example: arthropodes (lightweight)');
	expect(protocol).toHaveProperty('version', oldVersion);
});

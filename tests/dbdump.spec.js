import { expect, test } from './fixtures.js';
import {
	chooseDefaultProtocol,
	dumpDatabase,
	importPhotos,
	importProtocol,
	importResults
} from './utils.js';

test.describe('Database dumps', () => {
	test.skip(
		Boolean(process.env.CI),
		'Skipping database dumps on CI, these are meant as easy way to (re)create dump fixtures locally only.'
	);

	test('basic', async ({ page }) => {
		await importResults(page, 'correct.zip');
		await dumpDatabase(page, 'basic.devalue');
	});

	test('kitchensink-protocol', async ({ page }) => {
		await importProtocol(page, '../../examples/kitchensink.cigaleprotocol.yaml');
		await page.goto('#/protocols');
		await page
			.locator('article')
			.filter({ hasText: 'io.github.cigaleapp.arthropods.example.light' })
			.getByRole('button', { name: 'Supprimer' })
			.click();
		await page.getByRole('button', { name: 'Oui, supprimer' }).click();
		await expect(page.getByText('Protocole supprimé')).toBeVisible();
		await page.locator('nav').getByRole('link', { name: 'Protocole' }).click();
		await chooseDefaultProtocol(page);
		await importPhotos({ page }, 'cyan.jpeg', 'leaf.jpeg');
		await page.waitForTimeout(2_000);
		await dumpDatabase(page, 'kitchensink-protocol.devalue');
	});
});

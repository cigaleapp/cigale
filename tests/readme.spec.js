import { expect, test } from './fixtures';
import { chooseDefaultProtocol, importPhotos, setSettings } from './utils';
import français from '../messages/fr.json' with { type: 'json' };
import english from '../messages/en.json' with { type: 'json' };

test.describe('screenshots', { tag: '@real-protocol' }, () => {
	test.skip(
		Boolean(process.env.CI),
		"Skipping these in CI, they're meant for automated README screenshots updates"
	);

	for (const language of /** @type {const} */ (['en', 'fr'])) {
		test.describe(language, () => {
			const messages = language === 'fr' ? français : english;

			test.beforeEach(async ({ page, browserName }) => {
				test.skip(browserName !== 'chromium', 'Only taking screenshots in one browser');

				const languageNames = {
					en: 'English',
					fr: 'Français'
				};

				await page.setViewportSize({ width: (16 / 9) * 720, height: 720 });

				await setSettings({ page }, { showTechnicalMetadata: false });

				await page.getByTestId('settings-button').click();
				await page.getByRole('radio', { name: languageNames[language] }).click();
				await page.getByTestId('settings-button').click();
			});

			test('protocol', async ({ page }) => {
				await chooseDefaultProtocol(page);
				await expect(page).toHaveScreenshot();
			});

			test('import', async ({ page }) => {
				await chooseDefaultProtocol(page);
				await page.getByRole('navigation').getByRole('link', { name: messages.import_tab }).click();
				await importPhotos({ page }, 'lil-fella.jpeg');
				await expect(page.getByTestId('first-observation-card')).not.toHaveText(messages.analyzing);
				await page.waitForTimeout(10_000);
				await expect(page).toHaveScreenshot();
			});

			test('crop', async ({ page }) => {
				await chooseDefaultProtocol(page);
				await page.getByRole('navigation').getByRole('link', { name: messages.import_tab }).click();
				await importPhotos({ page }, 'lil-fella.jpeg');
				await expect(page.getByTestId('first-observation-card')).not.toHaveText(messages.analyzing);
				await page.waitForTimeout(3_000);
				await page.getByRole('navigation').getByRole('link', { name: messages.crop_tab }).click();
				await page.getByTestId('first-observation-card').click();
				await expect(page).toHaveScreenshot();
			});

			test('classify', async ({ page }) => {
				await chooseDefaultProtocol(page);
				await page.getByRole('navigation').getByRole('link', { name: messages.import_tab }).click();
				await importPhotos({ page }, 'lil-fella.jpeg');
				await expect(page.getByTestId('first-observation-card')).not.toHaveText(messages.analyzing);
				await page.waitForTimeout(3_000);
				await page
					.getByRole('navigation')
					.getByRole('link', { name: messages.classify_tab })
					.click();
				await expect(page.getByTestId('first-observation-card')).not.toHaveText(messages.analyzing);
				await page.waitForTimeout(10_000);
				await page.getByText('lil-fella', { exact: true }).first().click();
				await page.getByTestId('sidepanel').getByRole('combobox').first().click();
				await page
					.getByTestId('metadata-combobox-viewport')
					.getByRole('option', { name: 'Allacma fusca' })
					.hover();
				await page.waitForTimeout(2_000);
				await expect(page).toHaveScreenshot();
			});
		});
	}
});

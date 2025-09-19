import { expect, test } from '../fixtures';
import { chooseDefaultProtocol, goToTab, importPhotos, setSettings } from '../utils';
import français from '../../messages/fr.json' with { type: 'json' };
import english from '../../messages/en.json' with { type: 'json' };

test.describe('screenshots', { tag: '@real-protocol' }, () => {
	test.skip(
		Boolean(process.env.CI && !process.env.RUN_README_TESTS),
		"Skipping these in CI (unless CI explicitly asks for it), they're meant for automated README screenshots updates"
	);

	for (const language of /** @type {const} */ (['en', 'fr'])) {
		test.describe(language, () => {
			const messages = language === 'fr' ? français : english;

			/**
			 * @param {import('@playwright/test').Page} page
			 */
			async function waitForAnalysis(page) {
				await expect(page.getByTestId('first-observation-card')).not.toHaveText(
					new RegExp(messages.analyzing),
					{
						timeout: 20_000
					}
				);
			}

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
				await goToTab(page, 'import', { messages });
				await importPhotos({ page }, 'lil-fella.jpeg');
				await waitForAnalysis(page);
				await expect(page).toHaveScreenshot();
			});

			test('crop', async ({ page }) => {
				await chooseDefaultProtocol(page);
				await goToTab(page, 'import', { messages });
				await importPhotos({ page }, 'lil-fella.jpeg');
				await waitForAnalysis(page);

				await goToTab(page, 'crop', { messages });
				await page.getByTestId('first-observation-card').click();
				await expect(page).toHaveScreenshot();
			});

			test('classify', async ({ page }) => {
				await chooseDefaultProtocol(page);
				await goToTab(page, 'import', { messages });

				await importPhotos({ page }, 'lil-fella.jpeg');
				await waitForAnalysis(page);

				await goToTab(page, 'classify', { messages });

				await waitForAnalysis(page);
				await page.getByText('lil-fella', { exact: true }).first().click();
				await page.getByTestId('sidepanel').getByRole('combobox').first().click();
				await page
					.getByTestId('metadata-combobox-viewport')
					.getByRole('option', { name: 'Allacma fusca' })
					.hover();

				await expect(page).toHaveScreenshot();
			});
		});
	}
});

import { expect, test } from '../fixtures.js';
import { firstObservationCard, importPhotos, newSession } from '../utils/index.js';

test.describe('screenshots', { tag: '@real-protocol' }, () => {
	test.skip(
		Boolean(process.env.CI && !process.env.RUN_README_TESTS),
		"Skipping these in CI (unless CI explicitly asks for it), they're meant for automated README screenshots updates"
	);

	for (const language of /** @type {const} */ (['en', 'fr'])) {
		test.describe(language, () => {
			/**
			 * @param {import('@playwright/test').Page} page
			 */
			async function waitForAnalysis(page) {
				await expect(firstObservationCard(page)).not.toHaveText(new RegExp('Analyse…'), {
					timeout: 20_000
				});
			}

			test.beforeEach(async ({ page, app, browserName }) => {
				test.skip(browserName !== 'chromium', 'Only taking screenshots in one browser');

				const languageNames = {
					en: 'English',
					fr: 'Français'
				};

				await page.setViewportSize({ width: (16 / 9) * 720, height: 720 });

				await app.settings.set({ showTechnicalMetadata: false });

				await page.getByTestId('settings-button').click();
				await page.getByRole('radio', { name: languageNames[language] }).click();
				await page.getByTestId('settings-button').click();
			});

			test('protocol', async ({ page, app }) => {
				await newSession(page);
				await expect(page).toHaveScreenshot();
			});

			test('import', async ({ page, app }) => {
				await newSession(page);
				await app.tabs.go('import');
				await importPhotos({ page }, 'lil-fella.jpeg');
				await waitForAnalysis(page);
				await expect(page).toHaveScreenshot();
			});

			test('crop', async ({ page, app }) => {
				await newSession(page);
				await app.tabs.go('import');
				await importPhotos({ page }, 'lil-fella.jpeg');
				await waitForAnalysis(page);

				await app.tabs.go('crop');
				await firstObservationCard(page).click();
				await expect(page).toHaveScreenshot();
			});

			test('classify', async ({ page, app }) => {
				await newSession(page);
				await app.tabs.go('import');

				await importPhotos({ page }, 'lil-fella.jpeg');
				await waitForAnalysis(page);

				await app.tabs.go('classify');

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

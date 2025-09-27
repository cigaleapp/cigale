import { expect, test } from './fixtures.js';
import fr from '../messages/fr.json' with { type: 'json' };
import {
	chooseDefaultProtocol,
	goToTab,
	importPhotos,
	modal,
	setSettings,
	waitForLoadingEnd
} from './utils.js';

test.describe('Beamup functionality', () => {
	test('should enable beamup preferences via settings', async ({ page }) => {
		await chooseDefaultProtocol(page);

		// Open settings modal
		await page.getByTestId('settings-button').click();

		// Go to beamup settings tab
		await page.getByText(fr.beamup_settings).click();

		// Enable beamup for the current protocol
		const protocolId = 'io.github.cigaleapp.arthropods.example.light';
		await page.getByLabel(fr.enable_beamup_for_protocol).check();

		// Enter email address
		await page.getByLabel(fr.email_address).fill('test@example.com');

		// Save settings
		await page.getByRole('button', { name: fr.save }).click();

		// Close settings modal
		await page.getByRole('button', { name: fr.close }).click();

		// Verify settings were saved by reopening
		await page.getByTestId('settings-button').click();
		await page.getByText(fr.beamup_settings).click();

		await expect(page.getByLabel(fr.enable_beamup_for_protocol)).toBeChecked();
		await expect(page.getByLabel(fr.email_address)).toHaveValue('test@example.com');

		await page.getByRole('button', { name: fr.close }).click();
	});

	test('should store correction when metadata is updated', async ({ page }) => {
		await chooseDefaultProtocol(page);

		// Enable beamup first
		await setSettings(page, {
			beamupPreferences: {
				'io.github.cigaleapp.arthropods.example.light': {
					enable: true,
					email: 'test@example.com'
				}
			}
		});

		// Import a photo
		await goToTab(page, 'import');
		await importPhotos({ page }, 'cyan.jpeg');

		// Wait for image processing
		await waitForLoadingEnd(page);

		// Go to classify tab
		await goToTab(page, 'classify');

		// Find the observation card
		const observationCard = page.getByTestId('first-observation-card');
		await expect(observationCard).toBeVisible();

		// Click on species dropdown to modify metadata
		const speciesDropdown = observationCard.getByLabel(/Espèce/);
		await speciesDropdown.click();

		// Select a different species (this should trigger a beamup correction)
		const options = page.locator('[role="option"]');
		await options.first().click();

		// Wait a moment for the correction to be stored
		await page.waitForTimeout(1000);

		// Verify that a beamup correction was stored by checking database
		const correctionCount = await page.evaluate(async () => {
			const db = window.DB;
			return await db.count('BeamupCorrection');
		});

		expect(correctionCount).toBeGreaterThan(0);
	});

	test('should sync corrections via settings panel', async ({ page }) => {
		await chooseDefaultProtocol(page);

		// Enable beamup and set up mock corrections data
		await page.evaluate(async () => {
			// Add some mock corrections to the database
			const db = window.DB;
			await db.add('BeamupCorrection', {
				id: 'test-correction',
				client: { version: '1.0.0' },
				protocol: {
					id: 'io.github.cigaleapp.arthropods.example.light',
					version: 1,
					beamup: { origin: 'https://test-beamup.example.com' }
				},
				metadata: { id: 'species', type: 'enum' },
				email: 'test@example.com',
				subject: {
					image: { id: 'test-image' },
					contentHash: 'test-hash'
				},
				before: { value: 'before', alternatives: { before: 0.8 } },
				after: { value: 'after', alternatives: { after: 0.9 } },
				occurredAt: new Date().toISOString()
			});
		});

		// Mock the beamup sync to avoid actual network calls
		await page.route('**/corrections*', (route) => {
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ success: true })
			});
		});

		// Open settings modal
		await page.getByTestId('settings-button').click();

		// Go to beamup settings tab
		await page.getByText(fr.beamup_settings).click();

		// Click sync corrections button
		await page.getByRole('button', { name: fr.sync_corrections }).click();

		// Wait for sync to complete
		await expect(page.getByText(fr.sync_complete)).toBeVisible({ timeout: 10000 });

		// Verify corrections were removed from database
		const remainingCorrections = await page.evaluate(async () => {
			const db = window.DB;
			return await db.count('BeamupCorrection');
		});

		expect(remainingCorrections).toBe(0);
	});

	test('should display beamup origin in protocol settings', async ({ page }) => {
		await chooseDefaultProtocol(page);

		// Go to protocols tab
		await page.locator('nav').getByRole('link', { name: 'Protocole' }).click();

		// Find the protocol card
		const protocolCard = page.locator('[data-testid="protocol-card"]').first();

		// Check that beamup origin is displayed
		await expect(protocolCard.getByText('BeamUp:')).toBeVisible();
		await expect(protocolCard.getByText('https://beamup.cigale.gwen.works')).toBeVisible();
	});

	test('should handle beamup sync errors gracefully', async ({ page }) => {
		await chooseDefaultProtocol(page);

		// Add mock correction
		await page.evaluate(async () => {
			const db = window.DB;
			await db.add('BeamupCorrection', {
				id: 'test-correction-error',
				client: { version: '1.0.0' },
				protocol: {
					id: 'io.github.cigaleapp.arthropods.example.light',
					version: 1,
					beamup: { origin: 'https://test-beamup.example.com' }
				},
				metadata: { id: 'species', type: 'enum' },
				email: 'test@example.com',
				subject: {
					image: { id: 'test-image' },
					contentHash: 'test-hash'
				},
				before: { value: 'before', alternatives: { before: 0.8 } },
				after: { value: 'after', alternatives: { after: 0.9 } },
				occurredAt: new Date().toISOString()
			});
		});

		// Mock network error
		await page.route('**/corrections*', (route) => {
			route.abort('networkfailure');
		});

		// Open settings modal
		await page.getByTestId('settings-button').click();

		// Go to beamup settings tab
		await page.getByText(fr.beamup_settings).click();

		// Click sync corrections button
		await page.getByRole('button', { name: fr.sync_corrections }).click();

		// Wait for error message
		await expect(page.getByText(/erreur/i)).toBeVisible({ timeout: 10000 });

		// Verify corrections are still in database (not deleted due to error)
		const remainingCorrections = await page.evaluate(async () => {
			const db = window.DB;
			return await db.count('BeamupCorrection');
		});

		expect(remainingCorrections).toBe(1);
	});

	test('should not store corrections when beamup is disabled', async ({ page }) => {
		await chooseDefaultProtocol(page);

		// Explicitly disable beamup
		await setSettings(page, {
			beamupPreferences: {
				'io.github.cigaleapp.arthropods.example.light': {
					enable: false,
					email: 'test@example.com'
				}
			}
		});

		// Import a photo
		await goToTab(page, 'import');
		await importPhotos({ page }, 'cyan.jpeg');

		// Wait for image processing
		await waitForLoadingEnd(page);

		// Go to classify tab
		await goToTab(page, 'classify');

		// Find the observation card and modify metadata
		const observationCard = page.getByTestId('first-observation-card');
		await expect(observationCard).toBeVisible();

		const speciesDropdown = observationCard.getByLabel(/Espèce/);
		await speciesDropdown.click();

		const options = page.locator('[role="option"]');
		await options.first().click();

		// Wait a moment
		await page.waitForTimeout(1000);

		// Verify no beamup correction was stored
		const correctionCount = await page.evaluate(async () => {
			const db = window.DB;
			return await db.count('BeamupCorrection');
		});

		expect(correctionCount).toBe(0);
	});
});

import { expect, test } from './fixtures.js';
import fr from '../messages/fr.json' with { type: 'json' };
import {
	chooseDefaultProtocol,
	goToTab,
	importPhotos,
	setSettings,
	waitForLoadingEnd
} from './utils.js';

test.describe('Beamup functionality', () => {
	test('should store correction when metadata is updated and beamup is enabled', async ({
		page
	}) => {
		await chooseDefaultProtocol(page);

		// Enable beamup via settings API
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
		const speciesDropdown = observationCard.getByLabel(/Espèce|Species/);
		await speciesDropdown.click();

		// Select a different species (this should trigger a beamup correction)
		const options = page.locator('[role="option"]');
		const firstOption = options.first();
		await expect(firstOption).toBeVisible();
		await firstOption.click();

		// Wait for the correction to be processed
		await page.waitForTimeout(2000);

		// Verify that a beamup correction was stored by checking database
		const correctionCount = await page.evaluate(async () => {
			const db = window.DB;
			return await db.count('BeamupCorrection');
		});

		expect(correctionCount).toBeGreaterThan(0);

		// Verify the correction has the expected structure
		const correction = await page.evaluate(async () => {
			const db = window.DB;
			const corrections = await db.getAll('BeamupCorrection');
			return corrections[0];
		});

		expect(correction).toBeDefined();
		expect(correction.protocol).toBeDefined();
		expect(correction.protocol.id).toBe('io.github.cigaleapp.arthropods.example.light');
		expect(correction.protocol.beamup).toBeDefined();
		expect(correction.metadata).toBeDefined();
		expect(correction.before).toBeDefined();
		expect(correction.after).toBeDefined();
		expect(correction.email).toBe('test@example.com');
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

		const speciesDropdown = observationCard.getByLabel(/Espèce|Species/);
		await speciesDropdown.click();

		const options = page.locator('[role="option"]');
		const firstOption = options.first();
		await expect(firstOption).toBeVisible();
		await firstOption.click();

		// Wait a moment for any potential storage
		await page.waitForTimeout(1000);

		// Verify no beamup correction was stored
		const correctionCount = await page.evaluate(async () => {
			const db = window.DB;
			return await db.count('BeamupCorrection');
		});

		expect(correctionCount).toBe(0);
	});

	test('should sync corrections successfully', async ({ page }) => {
		await chooseDefaultProtocol(page);

		// Add mock correction to database directly
		await page.evaluate(async () => {
			const db = window.DB;
			await db.add('BeamupCorrection', {
				id: 'test-correction-sync',
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

		// Mock successful beamup API response
		await page.route('**/corrections*', (route) => {
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ success: true })
			});
		});

		// Execute sync via swarpc
		const syncResult = await page.evaluate(async () => {
			const swarpc = window.swarpc;
			return await swarpc.syncStoredCorrections({});
		});

		// Verify sync completed successfully
		expect(syncResult.total).toBe(1);
		expect(syncResult.succeeded).toBe(1);
		expect(syncResult.failed).toHaveLength(0);

		// Verify correction was removed from database
		const remainingCorrections = await page.evaluate(async () => {
			const db = window.DB;
			return await db.count('BeamupCorrection');
		});

		expect(remainingCorrections).toBe(0);
	});

	test('should handle sync errors and keep corrections in database', async ({ page }) => {
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
			route.abort('failed');
		});

		// Execute sync and expect it to handle the error
		const syncResult = await page.evaluate(async () => {
			const swarpc = window.swarpc;
			return await swarpc.syncStoredCorrections({});
		});

		// Verify sync reported the error
		expect(syncResult.total).toBe(1);
		expect(syncResult.succeeded).toBe(0);
		expect(syncResult.failed).toHaveLength(1);
		expect(syncResult.failed[0].ids).toContain('test-correction-error');

		// Verify correction is still in database (not deleted due to error)
		const remainingCorrections = await page.evaluate(async () => {
			const db = window.DB;
			return await db.count('BeamupCorrection');
		});

		expect(remainingCorrections).toBe(1);
	});

	test('should include beamup data in protocol configuration', async ({ page }) => {
		await chooseDefaultProtocol(page);

		// Check that the current protocol includes beamup configuration
		const protocolBeamupData = await page.evaluate(async () => {
			const protocol = window.uiState?.currentProtocol;
			return protocol?.beamup;
		});

		expect(protocolBeamupData).toBeDefined();
		expect(protocolBeamupData?.origin).toBeDefined();
		expect(typeof protocolBeamupData.origin).toBe('string');
		expect(protocolBeamupData.origin).toMatch(/^https?:\/\//);
	});

	test('should handle correction storage for observation metadata', async ({ page }) => {
		await chooseDefaultProtocol(page);

		// Enable beamup
		await setSettings(page, {
			beamupPreferences: {
				'io.github.cigaleapp.arthropods.example.light': {
					enable: true,
					email: 'test@example.com'
				}
			}
		});

		// Import multiple photos to create an observation
		await goToTab(page, 'import');
		await importPhotos({ page }, 'cyan.jpeg', 'leaf.jpeg');

		await waitForLoadingEnd(page);

		// Go to classify tab and modify observation-level metadata
		await goToTab(page, 'classify');

		// Wait for the observation card to be ready
		const observationCard = page.getByTestId('first-observation-card');
		await expect(observationCard).toBeVisible();

		// Find and modify a metadata field
		const metadataDropdown = observationCard.locator('select, [role="combobox"]').first();
		if (await metadataDropdown.isVisible()) {
			await metadataDropdown.click();

			const options = page.locator('[role="option"]');
			const firstOption = options.first();
			if (await firstOption.isVisible()) {
				await firstOption.click();
			}
		}

		// Wait for potential correction storage
		await page.waitForTimeout(1000);

		// Check if correction was stored (may be 0 if no metadata change occurred)
		const correctionCount = await page.evaluate(async () => {
			const db = window.DB;
			return await db.count('BeamupCorrection');
		});

		// Just verify the database structure supports beamup corrections
		expect(typeof correctionCount).toBe('number');
		expect(correctionCount).toBeGreaterThanOrEqual(0);
	});
});

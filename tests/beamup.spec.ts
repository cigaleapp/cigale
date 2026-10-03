import type { AppFixture } from './fixtures/app.js';
import type { Page } from '@playwright/test';

import { ms } from 'convert';

import { expect, test, testBasic } from './fixtures.js';
import * as beamup from './fixtures/http/beamup/handlers.js';
import { setInferenceModels } from './utils/inference.js';
import { goHome } from './utils/navigation.js';
import { importProtocol } from './utils/protocols.js';
import { exportResults } from './utils/results.js';
import { chooseFirstSession } from './utils/sessions.js';

testBasic.beforeEach(async ({ page, app, network }) => {
	network.use(...beamup.handlers);

	await app.tabs.go('protocols');
	await importProtocol(page, 'examples/arthropods.light.cigaleprotocol.json', (protocol) => {
		protocol.updates = 'manual';
		protocol.beamup = {
			origin: beamup.ORIGIN,
		};
	});
	await expect(app.toasts.byType('success')).toBeVisible({
		timeout: ms('30s'),
	});
});

test.describe('no consent', () => {
	testBasic('not given', async ({ page, app }) => {
		let requestMade = false;
		page.on('request', (req) => {
			if (req.url().startsWith(beamup.ORIGIN)) {
				requestMade = true;
			}
		});

		await createAndSendCorrection(page, app);
		expect(beamup.state.corrections).toHaveLength(0);
		expect(requestMade).toBe(false);
	});

	testBasic('revoked', async ({ page, app }) => {
		let requestMade = false;
		page.on('request', (req) => {
			if (req.url().startsWith(beamup.ORIGIN)) {
				requestMade = true;
			}
		});

		const item = page
			.getByTestId('protocols-list')
			.getByRole('group')
			.filter({ hasText: 'Example: arthropodes (lightweight)' });

		await item.click();
		const consent = item.getByRole('switch', {
			name: 'Envoi de corrections pour améliorer le protocole',
		});
		await consent.check();
		await app.wait('500ms');
		await consent.uncheck();

		await createAndSendCorrection(page, app);
		expect(beamup.state.corrections).toHaveLength(0);
		expect(requestMade).toBe(false);
	});
});

testBasic('sends corrections when given consent', async ({ page, app }) => {
	const item = page
		.getByTestId('protocols-list')
		.getByRole('group')
		.filter({ hasText: 'Example: arthropodes (lightweight)' });

	await item.getByRole('heading').click();
	const consent = item.getByRole('switch', {
		name: 'Envoi de corrections pour améliorer le protocole',
	});
	await consent.check();

	await createAndSendCorrection(page, app);
	expect(beamup.state.corrections.length).toBeGreaterThan(0);
});

async function createAndSendCorrection(page: Page, app: AppFixture) {
	await goHome(page);
	await chooseFirstSession(page);
	await setInferenceModels(page, {
		classify: 'Aucune inférence',
		crop: 'Aucune inférence',
	});

	await app.tabs.go('classify');
	await app.gallery.select('lil-fella');
	const species = app.metadata.combobox('Espèce');
	await species.focus();
	await species.fill('Dicyrtoma fusca');
	await page
		.getByTestId('metadata-combobox-viewport')
		.getByRole('option', { name: 'Dicyrtoma fusca' })
		.click();

	await app.tabs.go('results');
	await exportResults(page);

	await app.wait('3s');
}

import type { AppFixture } from './fixtures/app.js';
import type { Locator, Page } from '@playwright/test';

import { ms } from 'convert';

import { expect, test, testBasic } from './fixtures.js';
import * as ecosignal from './fixtures/http/ecosignal/handlers.js';
import { pickFiles } from './utils/core.js';
import { goToSessionPage } from './utils/navigation.js';
import { importProtocol } from './utils/protocols.js';
import { chooseFirstSession } from './utils/sessions.js';

test.beforeEach(async ({ app, page }) => {
	ecosignal.mockstate.reset();

	await app.tabs.go('protocols');
	await importProtocol(page, 'examples/arthropods.light.cigaleprotocol.json', (p) => {
		p.updates = 'manual';
		p.remote ??= {};
		p.remote.ecosignal = {
			domains: [ecosignal.MOCK_DOMAIN],
			project: 1,
			crop: 'crop',
			label: 'observation',
			sites: {
				create: true,
				protect: false,
				location: {
					metadata: 'location',
					fallback: 'FRA',
				},
				name: {
					metadata: 'sitecode',
					fallback: 'Unknown',
				},
			},
		};

		p.sessionMetadata!.location = {
			type: 'location',
			label: 'Emplacement',
			mergeMethod: 'none',
			required: false,
			description: '',
		};

		p.sessionMetadata!.sitecode = {
			type: 'string',
			label: 'Code du site',
			mergeMethod: 'none',
			required: false,
			description: '',
		};

		p.sessionMetadata!.habitat = {
			type: 'file',
			label: 'Habitat',
			accept: ['image/*'],
			mergeMethod: 'none',
			required: true,
			description: '',
			ecosignal: {
				label: 'habitat',
			},
		};
	});

	// Can be a bit long to import, esp. when using networkWithAssets fixture (see below)
	await expect(app.toasts.byType('success')).toBeVisible({
		timeout: ms('20s'),
	});
});

test.describe('adding a ecosignal account', () => {
	test.beforeEach(async ({ app, network }) => {
		network.use(...ecosignal.handlers);
		await app.tabs.go('accounts');
	});

	test('works when entering the correct credentials', async ({ app, page }) => {
		const main = page.locator('main');
		await registerEcosignalAccount({
			page,
			app,
			...ecosignal.MOCK_CREDS,
			async afterCredentialsFilled(modal) {
				await expect(modal.getByText('Identifiants valides')).toBeVisible();
				await modal.getByRole('button', { name: 'Se connecter' }).click();
				await expect(main.getByText('Hello World')).toBeVisible();
			},
		});
	});

	test('fails when entering the wrong credentials', async ({ app, page }) => {
		await registerEcosignalAccount({
			page,
			app,
			username: ecosignal.MOCK_CREDS.username,
			password: ecosignal.MOCK_CREDS.password + 'wrong',
			async afterCredentialsFilled(modal) {
				await expect(modal.getByText('Identifiants incorrects')).toBeVisible();
			},
		});
	});
});

testBasic('can upload a session', async ({ page, app, networkWithAssets }) => {
	// Need this because file upload status API route is GET /.../:batch/files/:file
	// which ends up looking like a GET request to a asset file
	// These are bypassed early by MSW for perf reasons unless an option is set on
	// defineNetworkFixture(...)
	// See https://claude.ai/share/9b09b767-2e90-4f9e-b0e5-a4e286000830
	networkWithAssets.use(...ecosignal.handlers);

	await app.tabs.go('accounts');
	await registerEcosignalAccount({ page, app });

	await app.tabs.go('sessions');
	await chooseFirstSession(page);
	await goToSessionPage(page);

	const habitat = app.metadata.section(/^\s*Habitat$/);
	await pickFiles(habitat.getByRole('button', { name: 'Ajouter' }), 'debugsquare.png');
	await expect(habitat).toHaveText(/debugsquare\.png/);

	await app.tabs.go('results');
	const panel = page.getByTestId('export-results');
	await panel.getByRole('tab', { name: 'Plateformes' }).click();
	await panel.getByRole('radio', { name: /Hello World/ }).check();

	await panel.getByRole('button', { name: 'Envoyer sur EcoSignal' }).click();

	await expect(panel).toHaveText(/\sEnvoi terminé\s/, {
		timeout: ms('1min'),
	});
});

async function registerEcosignalAccount({
	page,
	app,
	username = ecosignal.MOCK_CREDS.username,
	password = ecosignal.MOCK_CREDS.password,
	afterCredentialsFilled,
}: {
	page: Page;
	app: AppFixture;
	username?: string;
	password?: string;
	afterCredentialsFilled?: (modal: Locator) => Promise<void>;
}) {
	const main = page.locator('main');
	const modal = app.modals.byTitle('Ajouter un compte EcoSignal');

	await main.getByRole('button', { name: 'EcoSignal' }).first().click();
	await modal.getByRole('radio', { name: ecosignal.MOCK_DOMAIN }).check();
	await modal.getByRole('textbox', { name: 'Identifiant' }).fill(username);
	await modal.getByRole('textbox', { name: 'Mot de passe' }).fill(password);
	await modal.getByRole('textbox', { name: 'Mot de passe' }).blur();

	if (afterCredentialsFilled) {
		await afterCredentialsFilled(modal);
	} else {
		await modal.getByRole('button', { name: 'Se connecter' }).click();
		await expect(main.getByText('Hello World')).toBeVisible();
	}
}

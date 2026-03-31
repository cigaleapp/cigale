import { readFile } from 'node:fs';
import type { AppFixture } from './fixtures.js';
import type { Locator, Page } from '@playwright/test';

import { logexpr } from '$lib/utils.js';

import { expect, test } from './fixtures.js';
import mockKobotoolboxAssetData from './fixtures/http/kobotoolbox/asset-data.json' with { type: 'json' };
import mockKobotoolboxAsset from './fixtures/http/kobotoolbox/asset.json' with { type: 'json' };
import { chooseInDropdown, mockUrl } from './utils/core.js';
import { goHome, goToSessionPage } from './utils/navigation.js';
import { importProtocol } from './utils/protocols.js';

const mocks = {
	kobotoolbox: {
		token: 'a5e16a5e1f6a1fa61bc651bd16',
		account: {
			username: 'gwennlbh',
			first_name: '',
			last_name: '',
			email: 'gwenn.lebihan7@gmail.com',
			server_time: '2026-03-29T17:50:19Z',
			date_joined: '2026-02-06T10:12:39Z',
			projects_url: 'https://kc.kobotoolbox.org/gwennlbh',
			gravatar: 'https://www.gravatar.com/avatar/ef0da0f0f03e400ffd7ce59603db2e62?s=40',
			last_login: '2026-03-26T15:45:57.421836Z',
			extra_details: {
				name: 'Gwenn Le Bihan',
				sector: 'Environment',
				country: 'FRA',
				organization: 'CNRS',
				last_ui_language: 'fr',
				organization_type: 'government',
				organization_website: 'https://sete-moulis-cnrs.fr/en/',
				newsletter_subscription: false,
				done_storage_limits_check: true,
				require_auth: true,
			},
			git_rev: false,
			social_accounts: [],
			validated_password: true,
			accepted_tos: true,
			organization: {
				url: 'https://kf.kobotoolbox.org/api/v2/organizations/orgsn5GLZHW4mDekLY7XPr2H/',
				name: 'CNRS',
				uid: 'orgsn5GLZHW4mDekLY7XPr2H',
			},
			extra_details__uid: 'uidWFneivxquTAy8DLAe37',
		},
	},
};

test.describe('adding a kobotoolbox account', () => {
	test.beforeEach(async ({ app }) => {
		await app.tabs.go('accounts');
	});

	test('works when pasting entire page content', async ({ page, context, app }) => {
		await registerKobotoolboxAccount({
			page,
			context,
			app,
			token: `KoboToolbox API
For a general introduction to the KoboToolbox API, please visit the KoboToolbox help center.

You can also check the official API documentation for a detailed documentation of all available endpoints.

{
  "token": "${mocks.kobotoolbox.token}"
}
`,
		});

		// Test logging out
		const main = page.locator('main');
		await main.getByRole('button', { name: 'Déconnecter' }).click();
		await expect(main.getByText('Gwenn Le Bihan')).not.toBeVisible();
		expect(await app.db.list('Account')).toHaveLength(0);
	});

	test('works when pasting the {...}', async ({ page, context, app }) => {
		await registerKobotoolboxAccount({
			page,
			app,
			context,
			token: `{ \n"token": "${mocks.kobotoolbox.token}"\n }`,
		});
	});

	test('works when pasting the inside of the {...}', async ({ page, context, app }) => {
		await registerKobotoolboxAccount({
			page,
			app,
			context,
			token: ` "token": "${mocks.kobotoolbox.token}" `,
		});
	});

	test('works when pasting just the token', async ({ page, context, app }) => {
		await registerKobotoolboxAccount({
			page,
			app,
			context,
			token: ` ${mocks.kobotoolbox.token} `,
		});
	});

	test('errors when inputting an invalid token', async ({ page, context, app }) => {
		await registerKobotoolboxAccount({
			page,
			app,
			context,
			token: 'quoicoubeh skibidi 67',
			async afterTokenFill(modal) {
				await expect(modal.getByText('Token invalide')).toBeVisible();
			},
		});
	});
});

test('can download a session from a kobotoolbox account', async ({ page, context, app }) => {
	await app.tabs.go('accounts');
	await registerKobotoolboxAccount({ page, context, app });

	await app.tabs.go('protocols');
	const mockFormId = '65gr465g4e6gregerg';
	await importProtocol(page, {
		id: 'com.example.testing',
		name: 'Testinggg',
		description: '',
		authors: [],
		remote: {
			kobocollect: {
				form: `https://kf.kobotoolbox.org/#/forms/${mockFormId}/`,
				title: 'Session #{{ survey.Transect_code }}',
				thumbnails: [
					'Prendre_une_photo_du_milieu',
					'Prenez_une_photo_du_milieu',
					'Prenez_une_photo_du_arriv_e_du_transect',
					'Prenez_une_photo_du_e_d_part_du_transect',
				],
			},
		},
		sessionMetadata: {
			inferred: {
				type: 'string',
				label: 'Inferred',
				kobocollect: ['Not found'],
				mergeMethod: 'none',
				required: false,
				description: '',
			},
			not_inferred: {
				type: 'string',
				label: 'Commentaire ou remarque sur le milieu',
				mergeMethod: 'none',
				required: false,
				description: 'Not inferred',
				default: 'wasnt inferred from kobo',
				kobocollect: [], // force non-inference
			},
			// TODO also test kobotoolbox: list+true+false, kobotoolbox: list+choice and options: kobotoolbox
			transect_code: {
				type: 'string',
				label: 'Code du transect',
				description: 'Feur',
				mergeMethod: 'none',
				required: true,
				pattern: 'year, month, day, hours, minutes, uppercase letter minimum 2 times',
			},
			file: {
				type: 'file',
				label: 'File',
				description: '',
				mergeMethod: 'none',
				required: false,
				kobocollect: 'Prenez une photo du milieu',
			},
		},
		metadata: {},
	});

	await app.tabs.go('sessions');
	await chooseInDropdown(
		page,
		page.getByRole('button', { name: "Sur l'appareil" }),
		'KoboToolbox',
		'Gwenn Le Bihan'
	);

	const mockKobotoolboxApi = async (path: string, result: Parameters<typeof mockUrl>[3]) =>
		mockUrl(
			page,
			context,
			`https://cors.gwen.works/https\\://kf.kobotoolbox.org${path}`,
			result
		);

	await mockKobotoolboxApi(`/api/v2/assets/${mockFormId}`, async () => {
		await app.wait('2s');
		return { json: mockKobotoolboxAsset };
	});

	await mockKobotoolboxApi(`/api/v2/assets/${mockFormId}/data`, async () => {
		await app.wait('2s');
		return { json: mockKobotoolboxAssetData };
	});

	await mockKobotoolboxApi(`/api/v2/assets/*/data/*/enketo/view{/}?`, {
		json: {
			url: 'https://ee.kobotoolbox.org/view/eb62b72b5c0aa392278dbe3a25f9bb89?instance_id=c2983a5e-fd4c-4032-9b07-50d3e0b8db5f&return_url=false',
			version_uid: 'vomChPkx3JLXdErzdUjMYd',
		},
	});

	await mockKobotoolboxApi(`/api/v2/assets/*/data/*/attachments/*/:size/`, {
		file: 'cyan.jpeg',
	});

	// TODO mock images

	const main = page.locator('body').first();
	await expect(main).toHaveText(/Chargement…/);

	const card = main.getByRole('article').filter({ hasText: 'Session #202603131502GLB' }).first();

	await card.click();
	await expect(card).toHaveText(/Téléchargement…/);
	await expect(card).toHaveText(/Sauvegarde…/);
	await app.path.wait('/(app)/(sidepanel)/import');
	await goToSessionPage(page);
	await expect(page.getByRole('textbox', { name: 'Description' })).toHaveValue(
		/Créée sur KoboToolbox/
	);
	// Wait for defaults to apply 
	// TODO: reduce / eliminate this wait, resolveDefaults is wayyyyyyyyyyyyyy too slow
	await app.wait("5s")
	expect(
		await app.db.metadata.of({
			session: 'Session #202603131502GLB',
			protocolId: 'com.example.testing',
		})
	).toMatchObject({
		not_inferred: { parsedValue: 'wasnt inferred from kobo' },
		transect_code: { parsedValue: '202603131502GLB' },
	});

	const { file: fileId } = await app.db.metadata.values({
		session: 'Session #202603131502GLB',
		protocolId: 'com.example.testing',
	});

	expect(fileId).not.toBeUndefined();
	expect(await app.db.get('MetadataValueFile', fileId.toString())).toMatchObject({
		filename: '1773410434869.jpg',
		contentType: 'image/jpeg',
	});

	await goHome(page);
	// TODO add testid for the indicator
	await expect(card.locator('.indicator-downloaded')).toHaveTooltip("Disponible sur l'appareil");
	await chooseInDropdown(
		page,
		page.getByRole('button', { name: 'Gwenn Le Bihan' }),
		"Sur l'appareil"
	);
	card.getByRole('button', { name: 'Gérer' }).click();
	await app.path.wait('/(app)/sessions/[id]');
	// Get session id from the URL (kinda jank???)
	const id = new URL(page.url()).pathname.split('/').at(2);
	// TODO: check db
});

async function registerKobotoolboxAccount({
	page,
	app,
	context,
	token = mocks.kobotoolbox.token,
	afterTokenFill,
}: {
	page: Page;
	app: AppFixture;
	context: import('@playwright/test').BrowserContext;
	token?: string;
	/** What to do after the token has been filled in. By default, checks for successful validation and click login button then wait for the modal to close */
	afterTokenFill?: (modal: Locator) => Promise<void>;
}) {
	await mockUrl(
		page,
		context,
		'https://cors.gwen.works/https\\://kf.kobotoolbox.org/:action(me|login){/}?',
		async (req) => {
			const auth = await req.request().headerValue('Authorization');
			if (auth !== `Token ${mocks.kobotoolbox.token}`) {
				return {
					status: 401,
					json: {
						detail: "Informations d'authentification non fournies.",
					},
				};
			}

			return {
				json: mocks.kobotoolbox.account,
			};
		}
	);

	const main = page.locator('main');
	const modal = app.modals.byTitle('Ajouter un compte KoboToolbox');

	await main.getByRole('button', { name: 'Ajouter' }).first().click();
	await modal.getByRole('radio', { name: 'Global' }).check();
	await modal.getByRole('link', { name: 'kf.kobotoolbox.org' }).click();
	await context.waitForEvent('page');
	await page.bringToFront();
	await modal.getByRole('link', { name: 'token' }).click();
	await page.bringToFront();
	await modal.getByRole('textbox', { name: 'Token' }).fill(token);
	await modal.getByRole('textbox', { name: 'Token' }).blur();

	if (afterTokenFill) {
		await afterTokenFill(modal);
	} else {
		await expect(modal.getByText('Token valide')).toBeVisible();
		await modal.getByRole('button', { name: 'Se connecter' }).click();
		await expect(main.getByText('Gwenn Le Bihan')).toBeVisible();
	}
}

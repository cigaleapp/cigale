import {
	chooseInDropdown,
	confirmDeletionModal,
	goHome,
	goToTab,
	setInferenceModels
} from './index.js';

/**
 * @import { Page } from '@playwright/test';
 */

/**
 *
 * @param {Page} page
 * @param {object} [options]
 * @param {string} [options.protocol] name of protocol to use
 * @param {{ crop?: string, classify?: string }} [options.models] names of tasks to names of models to select. use "la détection" for the detection model, and the metadata's labels for classification model(s)
 * @param {string} [options.name] name of the session
 */
export async function newSession(page, { name, protocol, models = {} } = {}) {
	await goHome(page);
	await goToTab(page, 'sessions');

	// XXX: Wait until page is ready
	await page.waitForTimeout(500);

	await page.getByTestId('new-session').click();
	await page.waitForURL((u) => u.hash.startsWith('#/sessions/'));

	if (protocol) {
		await chooseInDropdown(page, 'protocol', protocol);
	}

	if (name) {
		const textbox = page.getByRole('textbox', {
			name: 'Nom de la session'
		});

		await textbox.fill(name);
		await textbox.blur();
	}

	await page
		.getByRole('button', {
			name: 'Ouvrir',
			exact: true
		})
		.click();

	await page.waitForURL((u) => u.hash === '#/import');

	if (models) {
		await setInferenceModels(page, models);
	}
}

/**
 * @param {Page} page
 * @param {string} name
 */
export async function switchSession(page, name) {
	await goHome(page);
	await goToTab(page, 'sessions');

	// XXX: Wait until page is ready
	await page.waitForTimeout(500);

	await page
		.getByRole('heading', {
			name
		})
		.click();

	await page.waitForURL((u) => u.hash === '#/import');
}

/**
 * @param {Page} page
 * @param {string} name
 */
export async function deleteSession(page, name) {
	await goHome(page);
	await goToTab(page, 'sessions');

	// XXX: Wait until page is ready
	await page.waitForTimeout(500);

	const sessionCard = page.getByRole('article').filter({
		has: page.getByRole('heading', {
			name
		})
	});

	await sessionCard
		.getByRole('button', {
			name: 'Gérer'
		})
		.click();

	await page
		.getByRole('button', {
			name: 'Supprimer'
		})
		.click();

	await confirmDeletionModal(page, {
		type: name,
		modalKey: 'modal_delete_session'
	});

	await page.waitForURL((u) => u.hash === '#/sessions');
}

/**
 *
 * @param {Page} page
 */
export async function chooseFirstSession(page) {
	await goHome(page);
	await goToTab(page, 'sessions');
	await page.locator('main article:not([data-testid=new-session-card])').first().click();
	await page.waitForURL((u) => u.hash === '#/import');
}

/**
 *
 * @param {Page} page
 * @param {string} name
 */
export async function changeSessionProtocol(page, name) {
	await page.getByTestId('goto-current-session').click();
	await page.waitForURL((u) => u.hash.startsWith('#/sessions/'));
	await chooseInDropdown(page, 'protocol', name);
	await goToTab(page, 'import');
}

import {
	chooseInDropdown,
	confirmDeletionModal,
	goHome,
	goToTab,
	setInferenceModels,
	waitForRoute
} from './index.js';

/**
 * @import { Page } from '@playwright/test';
 */

/**
 *
 * @param {Page} page
 * @param {object} [options]
 * @param {string} [options.protocol] name of protocol to use
 * @param {Parameters<typeof setInferenceModels>[1]} [options.models] 
 * @param {string} [options.name] name of the session
 */
export async function newSession(page, { name, protocol, models } = {}) {
	await goHome(page);
	await goToTab(page, 'sessions');

	// XXX: Wait until page is ready
	await page.waitForTimeout(500);

	await page.getByTestId('new-session').click();
	await waitForRoute(page, '/(app)/sessions/[id]');

	if (protocol) {
		await chooseInDropdown(
			page,
			page.getByRole('button', { name: 'Choisir un protocole' }),
			protocol
		);
	}

	if (name) {
		const textbox = page.getByRole('textbox', {
			name: 'Nom de la session'
		});

		await textbox.fill(name);
		await textbox.blur();
	}

	// XXX: Sometimes clicking the open button does nothing for some reason
	// Can't reproduce outside of the testing environment though
	while (page.url().includes('/sessions/')) {
		await page
			.getByRole('button', {
				name: 'Ouvrir',
				exact: true
			})
			.click();

		await new Promise((r) => setTimeout(r, 500));
	}

	await waitForRoute(page, '/import');

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

	await waitForRoute(page, '/import');
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
			name: 'Supprimer',
			exact: true
		})
		.click();

	await confirmDeletionModal(page, {
		type: name,
		modalKey: 'modal_delete_session'
	});

	await waitForRoute(page, '/sessions');
}

/**
 *
 * @param {Page} page
 */
export async function chooseFirstSession(page) {
	await goHome(page);
	await goToTab(page, 'sessions');
	await page.locator('main article:not([data-testid=new-session-card])').first().click();
	await waitForRoute(page, '/import');
}

/**
 *
 * @param {Page} page
 * @param {string} name
 */
export async function changeSessionProtocol(page, name) {
	await page.getByTestId('goto-current-session').click();
	await waitForRoute(page, '/(app)/sessions/[id]');
	await chooseInDropdown(page, page.getByRole('button', { name: 'Choisir un protocole' }), name);
	await goToTab(page, 'import');
}

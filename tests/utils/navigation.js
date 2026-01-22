import { expect } from '@playwright/test';

import { makeRegexpUnion } from './core.js';

/**
 * @import { Page } from '@playwright/test';
 */

/**
 * @param {Page} page
 */
export async function goToProtocolManagement(page) {
	await goHome(page);
	await goToTab(page, 'protocols');
}

/**
 *
 * @param {Page} page
 */
export async function goHome(page) {
	await page.getByTestId('goto-home').click();
	await page.waitForURL((u) => u.hash === '#/sessions');
}

/**
 *
 * @param {import('$lib/i18n').Language} lang
 */
const appNavTabs = (lang = 'fr') => ({
	import: {
		name: lang === 'fr' ? 'Importer' : 'Import',
		hash: '#/import'
	},

	crop: {
		name: lang === 'fr' ? 'Recadrer' : 'Crop',
		hash: '#/crop'
	},

	classify: {
		name: lang === 'fr' ? 'Classifier' : 'Classify',
		hash: '#/classify'
	},

	results: {
		name: lang === 'fr' ? 'Résultats' : 'Results',
		hash: '#/results'
	},

	sessions: {
		name: lang === 'fr' ? 'Sessions' : 'Sessions',
		hash: '#/sessions'
	},

	protocols: {
		name: lang === 'fr' ? 'Protocoles' : 'Protocols',
		hash: '#/protocols'
	}
});

/**
 * @typedef {keyof ReturnType<typeof appNavTabs>} NavigationTab
 */

/**
 *
 * @param {Page} page
 * @param {NavigationTab} tabName
 * @param {object} [options]
 * @param {boolean} [options.waitForModel=true] wait for the model to be loaded (only for crop and classify)
 * @param {import('$lib/i18n').Language} [options.language=fr]
 */
export async function goToTab(page, tabName, { waitForModel = true, language = 'fr' } = {}) {
	await getTab(page, tabName).click();
	const tab = appNavTabs(language)[tabName];
	await page.waitForURL((u) => u.hash.replace(/\/$/, '') === tab.hash.replace(/\/$/, ''));

	if (waitForModel && (tabName === 'crop' || tabName === 'classify')) {
		await expect(page.getByTestId('app-main')).not.toHaveText(
			makeRegexpUnion(
				tabName === 'crop'
					? 'Chargement du modèle de recadrage…'
					: 'Chargement du modèle de classification'
			),
			{
				timeout: 20_000
			}
		);
	}
}

/**
 *
 * @param {Page} page
 * @param {NavigationTab} tabName
 * @param {'fr'|'en'} [language=fr]
 */
export function getTab(page, tabName, language = 'fr') {
	const tab = appNavTabs(language)[tabName];

	if (!tab) throw new Error(`Unknown tab: ${tabName}`);

	return page.getByTestId('app-nav').getByRole('link', {
		name: tab.name
	});
}

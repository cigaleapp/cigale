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
	await waitForRoute(page, '/sessions');
}

/**
 *
 * @param {import('$lib/i18n').Language} lang
 */
export const appNavTabs = (lang = 'fr') =>
	/** @type {const}, @satisfies {Record<string, { name: string; route: import('$app/types').ResolvedPathname }>} */ ({
		import: {
			name: lang === 'fr' ? 'Importer' : 'Import',
			route: '/import'
		},

		crop: {
			name: lang === 'fr' ? 'Recadrer' : 'Crop',
			route: '/crop'
		},

		classify: {
			name: lang === 'fr' ? 'Classifier' : 'Classify',
			route: '/classify'
		},

		results: {
			name: lang === 'fr' ? 'Résultats' : 'Results',
			route: '/results'
		},

		sessions: {
			name: lang === 'fr' ? 'Sessions' : 'Sessions',
			route: '/sessions'
		},

		protocols: {
			name: lang === 'fr' ? 'Protocoles' : 'Protocols',
			route: '/protocols'
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
	await waitForRoute(page, tab.route);

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

/**
 * @param {Page} page
 * @param {import('$app/types').ResolvedPathname | import('$app/types').RouteId} route
 */
export async function waitForRoute(page, route) {
	/** @type {string | RegExp} */
	let path = `${process.env.BASE_PATH || ''}${route}`;

	// (app), etc
	const groupFragment = /\(.+\)/;
	// [id], [[from]], etc
	const paramFragment = /(\[.+\]|\[\[.+\]\])/;

	if (groupFragment.test(path)) {
		path = path
			.split('/')
			.filter((part) => !/\(.+\)/.test(part))
			.join('/');
	}

	// Normalize path (remove leading/trailing slashes)
	path = path.split('/').filter(Boolean).join('/');

	if (paramFragment.test(path)) {
		// TODO: use URLPattern when it's on NodeJS
		path = new RegExp(
			'^/' +
				path
					.split('/')
					.map((part) => {
						if (paramFragment.test(part)) {
							return '[^/]+';
						}

						if (!/^[\w-]+$/.test(part)) {
							throw new Error(
								`The part "${part}" contains special characters and cannot be used in a RegExp`
							);
						}

						return part;
					})
					.join('/') +
				'/?$'
		);
	}

	if (typeof path === 'string') {
		path = '/' + path;
	}

	await page.waitForURL((u) => {
		if (path instanceof RegExp) {
			return path.test(u.pathname);
		} else {
			return [path, path + '/'].includes(u.pathname);
		}
	});
}

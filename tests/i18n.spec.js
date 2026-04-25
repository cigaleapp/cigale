import { assert, test } from './fixtures.js';
import { chooseInDropdown } from './utils/core.js';

test('can switch languages', async ({ page, app }) => {
	// Default is French
	assert(await app.settings.get('language')).toBe('fr');

	// Check for french text in the UI
	await assert(page.getByTestId('app-nav')).toHaveText(/Comptes/);

	// Switch to English
	await chooseInDropdown(
		page,
		page.getByRole('button', { name: 'Réglages' }),
		'Réglages',
		'Langue',
		'English'
	);

	await app.wait('5s');

	await app.db.ready();

	// Check that English is now selected
	assert(await app.settings.get('language')).toBe('en');

	// Check for english text in the UI
	await assert(page.getByTestId('app-nav')).toHaveText(/Accounts/);
});

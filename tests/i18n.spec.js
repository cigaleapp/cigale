import { expect, test } from './fixtures.js';

test('can switch languages', async ({ page, app }) => {
	await app.settings.open();

	const languagesGroup = page.getByTestId('app-settings').getByTestId('language-selection');

	// Default is French
	await expect(languagesGroup.getByRole('radio', { name: 'Français' })).toBeChecked();
	expect(await app.settings.get('language')).toBe('fr');

	// Check for french text in the UI
	await expect(page.getByTestId('app-settings').locator('header')).toHaveText('Réglages');

	// Switch to English
	await languagesGroup.getByRole('radio', { name: 'English' }).click();

	// Page will reload, be nice and wait for it
	await app.settings.open({ timeout: 20_000 });

	// Check that English is now selected
	await expect(languagesGroup.getByRole('radio', { name: 'English' })).toBeChecked();
	expect(await app.settings.get('language')).toBe('en');

	// Check for english text in the UI
	await expect(page.getByTestId('app-settings').locator('header')).toHaveText('Settings');
});

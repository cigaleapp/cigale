import { expect, test } from './fixtures.js';
import { getSettings, openSettings } from './utils';

test('can switch languages', async ({ page }) => {
	await openSettings(page);

	const languagesGroup = page.getByTestId('app-settings').getByTestId('language-selection');

	// Default is French
	await expect(languagesGroup.getByRole('radio', { name: 'Français' })).toBeChecked();
	expect(await getSettings({ page })).toMatchObject({ language: 'fr' });

	// Check for french text in the UI
	await openSettings(page);
	await expect(page.getByTestId('app-settings').locator('header')).toHaveAccessibleName(
		'Réglages'
	);

	// Switch to English
	await languagesGroup.getByRole('radio', { name: 'English' }).click();

	// Page will reload, be nice and wait for it
	await openSettings(page, { timeout: 20_000 });

	// Check that English is now selected
	await expect(languagesGroup.getByRole('radio', { name: 'English' })).toBeChecked();
	expect(await getSettings({ page })).toMatchObject({ language: 'en' });

	// Check for english text in the UI
	await expect(page.getByTestId('app-settings').locator('header')).toHaveAccessibleName(
		'Settings'
	);
});

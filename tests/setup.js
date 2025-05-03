import { test as setup } from './fixtures.js';

setup('wait for database', async ({ page }) => {
	await page.goto('/');
	await page.waitForFunction(() => Boolean(window.DB));
});

import { expect, test } from './fixtures';
import { chooseFirstSession, loadDatabaseDump, observationCard, setInferenceModels } from './utils';

test.beforeEach(async ({ page, app }) => {
	await app.settings.set({ gallerySort: { direction: 'asc', key: 'filename' } });
	await loadDatabaseDump(page, 'basic.devalue');
	await chooseFirstSession(page);
	await setInferenceModels(page, { classify: 'Aucune inférence' });
	await app.tabs.go('classify');
});

test('allows merging and unrolling two observations', async ({ page, app }) => {
	const src = {
		lilfella: await observationImage(page, 'lil-fella').getAttribute('src'),
		cyan: await observationImage(page, 'cyan').getAttribute('src')
	};
	if (!src.lilfella) throw new Error('Could not get lil-fella image src');
	if (!src.cyan) throw new Error('Could not get cyan image src');

	await expect(page.getByTestId('observations-area').locator('article')).toHaveCount(4);
	await selectObservation(page, 'lil-fella');
	await selectObservation(page, 'cyan');

	await page.getByTestId('sidepanel').getByRole('button', { name: 'Regrouper' }).click();

	const imageIds = {
		lilfella: await app.db.image.byFilename('lil-fella.jpeg'),
		cyan: await app.db.image.byFilename('cyan.jpeg')
	};

	if (!imageIds.lilfella) throw new Error('Could not get lil-fella image ID');
	if (!imageIds.cyan) throw new Error('Could not get cyan image ID');

	expect(await app.db.observation.byLabel('lil-fella')).toHaveProperty('images', [
		imageIds.lilfella.id,
		imageIds.cyan.id
	]);

	await expect(page.getByTestId('observations-area').locator('article')).toHaveCount(3);
	await expect(observationCard(page, 'lil-fella')).toMatchAriaSnapshot(`
		  - article:
		    - img "lil-fella"
		    - img
		    - heading "lil-fella" [level=2]
		    - button "2"
		`);
	await expect.soft(observationImage(page, 'lil-fella')).toHaveAttribute('src', src.lilfella);

	await observationCard(page, 'lil-fella').getByRole('button', { name: '2' }).click();

	await expect(page.getByTestId('observations-area').locator('article')).toHaveCount(5);
	await expect(observationCard(page, 'cyan.jpeg')).toBeVisible();
	await expect(observationImage(page, 'cyan.jpeg')).toHaveAttribute('src', src.cyan);
	await expect(observationCard(page, 'lil-fella.jpeg')).toBeVisible();
	await expect
		.soft(observationImage(page, 'lil-fella.jpeg'))
		.toHaveAttribute('src', src.lilfella);
	await expect(observationCard(page, 'lil-fella')).toBeVisible();

	await observationCard(page, 'lil-fella').getByRole('button', { name: '2' }).click();

	await expect(page.getByTestId('observations-area').locator('article')).toHaveCount(3);
	await expect(observationCard(page, 'cyan.jpeg')).not.toBeVisible();
	await expect(observationCard(page, 'lil-fella.jpeg')).not.toBeVisible();
});

test('allows merging three observations', async ({ page, app }) => {
	await selectObservation(page, 'leaf');
	await selectObservation(page, 'lil-fella');
	await selectObservation(page, 'cyan');
	const leafImageSrc = await observationImage(page, 'leaf').getAttribute('src');
	if (!leafImageSrc) throw new Error('Could not get leaf image src');

	await page.getByTestId('sidepanel').getByRole('button', { name: 'Regrouper' }).click();

	const imageIds = {
		lilfella: await app.db.image.byFilename('lil-fella.jpeg'),
		cyan: await app.db.image.byFilename('cyan.jpeg'),
		leaf: await app.db.image.byFilename('leaf.jpeg')
	};

	if (!imageIds.lilfella) throw new Error('Could not get lil-fella image ID');
	if (!imageIds.cyan) throw new Error('Could not get cyan image ID');
	if (!imageIds.leaf) throw new Error('Could not get leaf image ID');

	expect(await app.db.observation.byLabel('leaf')).toHaveProperty('images', [
		imageIds.leaf.id,
		imageIds.lilfella.id,
		imageIds.cyan.id
	]);

	await expect(page.getByTestId('observations-area').locator('article')).toHaveCount(2);
	await expect(observationCard(page, 'leaf')).toMatchAriaSnapshot(`
		  - article:
		    - img "leaf"
		    - img
		    - heading "leaf" [level=2]
		    - button "3"
		`);
	await expect(observationImage(page, 'leaf')).toHaveAttribute('src', leafImageSrc);
});

test('allows merging a second time into the same observation', async ({ page, app }) => {
	await selectObservation(page, 'lil-fella');
	await selectObservation(page, 'cyan');
	await page.getByTestId('sidepanel').getByRole('button', { name: 'Regrouper' }).click();
	await selectObservation(page, 'leaf');
	await page.getByTestId('sidepanel').getByRole('button', { name: 'Regrouper' }).click();
	await expect(page.getByTestId('observations-area').locator('article')).toHaveCount(2);
	await expect(observationCard(page, 'lil-fella')).toMatchAriaSnapshot(`
	  - article:
	    - img "lil-fella"
	    - img
	    - heading "lil-fella" [level=2]
	    - button "3"
	`);
	const imageIds = {
		lilfella: await app.db.image.byFilename('lil-fella.jpeg'),
		cyan: await app.db.image.byFilename('cyan.jpeg'),
		leaf: await app.db.image.byFilename('leaf.jpeg')
	};

	if (!imageIds.lilfella) throw new Error('Could not get lil-fella image ID');
	if (!imageIds.cyan) throw new Error('Could not get cyan image ID');
	if (!imageIds.leaf) throw new Error('Could not get leaf image ID');

	expect(await app.db.observation.byLabel('lil-fella')).toHaveProperty('images', [
		imageIds.lilfella.id,
		imageIds.cyan.id,
		imageIds.leaf.id
	]);
});

test('can split merged observations', async ({ page, app }) => {
	await selectObservation(page, 'lil-fella');
	await selectObservation(page, 'cyan');
	await page.getByTestId('sidepanel').getByRole('button', { name: 'Regrouper' }).click();
	await expect(page.getByTestId('observations-area').locator('article')).toHaveCount(3);
	await page.getByTestId('sidepanel').getByRole('button', { name: 'Séparer' }).click();

	await expect(page.getByTestId('observations-area').locator('article')).toHaveCount(4);
	await expect(observationCard(page, 'lil-fella')).toBeVisible();
	await expect(observationCard(page, 'cyan')).toBeVisible();
	await expect(observationCard(page, 'leaf')).toBeVisible();
});

/**
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} title
 */
async function selectObservation(page, title) {
	await page.keyboard.down('Control');
	await observationCard(page, title).click();
	await page.keyboard.up('Control');
}

/**
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} observationTitle
 * @returns
 */
function observationImage(page, observationTitle) {
	return observationCard(page, observationTitle).locator('img:not([data-is-blur="true"])');
}

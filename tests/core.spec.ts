import { readFile } from 'node:fs/promises';
import * as path from 'node:path';
import { ArkErrors } from 'arktype';
import * as yauzl from 'yauzl-promise';

import type * as SvelteTypes from '$app/types';

import lightweightProtocol from '../examples/arthropods.light.cigaleprotocol.json' with { type: 'json' };
import { Analysis } from '../src/lib/schemas/exports.js';
import { IssueCreatorRequest } from '../src/lib/schemas/issue-creator.js';
import { withParallelism } from './annotations.js';
import type { FixturePaths } from './filepaths.js';
import { assert, ex, test } from './fixtures.js';
import {
	browserConsole,
	chooseFirstSession,
	expectZipFiles,
	firstObservationCard,
	importPhotos,
	loadDatabaseDump,
	mockProtocolSourceURL,
	mockUrl,
	newSession,
	setInferenceModels,
	waitForLoadingEnd
} from './utils/index.js';

for (const offline of [false, true]) {
	test(
		offline ? 'basic functionality, while offline' : 'basic functionality',
		async ({ page, context, app }) => {
			if (offline) {
				test.skip(context.serviceWorkers().length === 0, "No sw, can't test offline");

				// Open settings and prepare for offline use
				await page.getByTestId('settings-button').click();
				await page
					.getByTestId('app-settings')
					.getByRole('button', { name: 'Préparation hors-ligne' })
					.click();

				await app.modals
					.byTitle('Préparation hors-ligne')
					.getByRole('button', { name: 'Démarrer' })
					.click();

				await assert(app.modals.byTitle('Préparation hors-ligne')).toHaveText(/OK!/, {
					timeout: 10_000
				});

				await app.modals
					.byTitle('Préparation hors-ligne')
					.getByRole('button', { name: 'Fermer' })
					.first()
					.click();

				context.setOffline(true);
			}

			await app.settings.set({ showTechnicalMetadata: false });
			await newSession(page);
			await app.tabs.go('import');

			// Import fixture image
			await assert(page.getByText(/Cliquer ou déposer/)).toBeVisible();
			const fileInput = await page.$('input[type="file"]');
			await fileInput?.setInputFiles('./tests/fixtures/lil-fella.jpeg');
			await assert(page.getByText('lil-fella.jpeg')).toBeVisible();

			await app.tabs.go('crop');
			await app.loading.wait();

			// Check for inferred bounding box
			const boundingBoxStyle = Object.fromEntries(
				await page
					.getByTestId('card-observation-bounding-box')
					.getAttribute('style')
					.then((style) =>
						(style ?? '')
							.split(';')
							.map((decl) => {
								const [prop, val] = decl.trim().split(': ');
								if (!val) return undefined;
								return [prop.trim(), Number(val.trim().replace('%', ''))];
							})
							.filter((entry) => entry !== undefined)
					)
			);

			assert(boundingBoxStyle.left).toBeCloseTo(52.3334, 0);
			assert(boundingBoxStyle.top).toBeCloseTo(29.0534, 0);
			assert(boundingBoxStyle.width).toBeCloseTo(23.2713, 0);
			assert(boundingBoxStyle.height).toBeCloseTo(36.4674, 0);

			// Go to crop view
			await app.tabs.go('crop');
			await page.getByText('lil-fella.jpeg').click();

			// Check for continuing
			await page.getByRole('button', { name: /^Continuer/ }).click();
			await assert(page.getByText('Confirmé', { exact: true })).toBeVisible();

			// Go to classification view
			await app.tabs.go('classify');
			// Wait for inference
			await app.loading.wait();

			// Check for classification results in sidepanel
			await firstObservationCard(page).click();
			await assert(page.getByText('Espèce', { exact: true })).toBeVisible();

			// Export results
			await app.tabs.go('results');
			await page.getByText(/et images originales/i).click();
			await page.getByRole('button', { name: 'Archive ZIP' }).click();
			const download = await page.waitForEvent('download');
			assert(download.suggestedFilename()).toBe('results.zip');
			await download.saveAs('./tests/results/lil-fella.zip');

			await expectZipFiles(
				await yauzl.open('./tests/results/lil-fella.zip'),
				[
					'analysis.json',
					'metadata.csv',
					'Cropped/Entomobrya muscorum_obs1_1.jpeg',
					'Original/Entomobrya muscorum_obs1_1.jpeg'
				],
				{
					'analysis.json': {
						json(data) {
							ex(Analysis.allows(data)).toBe(true);
						}
					},
					'metadata.csv': {
						text(txt) {
							const lines = txt.split('\n');
							assert(lines).toHaveLength(2);
							assert
								.soft(lines.at(0))
								.toBe(
									'"Identifiant";"Observation";"Date";"Date: Confiance";"Espèce";"Espèce: Confiance";"Genre";"Genre: Confiance";"Famille";"Famille: Confiance";"Ordre";"Ordre: Confiance";"Classe";"Classe: Confiance";"Phylum";"Phylum: Confiance";"Règne";"Règne: Confiance"'
								);
						}
					},
					'Cropped/Entomobrya muscorum_obs1_1.jpeg': {
						buffer(buf) {
							ex(buf).toMatchSnapshot({ maxDiffPixelRatio: 0.01 });
						},
						entry(entry) {
							assert
								.soft(entry.getLastMod().toISOString())
								.toEqual('2025-04-25T12:38:36.000Z');
						}
					}
				}
			);
		}
	);
}

test('can handle a bunch of images at once', withParallelism(4), async ({ page, app }) => {
	test.fixme(
		true,
		"Really flaky since this week for no reason, even on local runs, sometimes it works fines, sometimes it makes Chrome freeze. Even the profiler freezes, so we can't know what causes it. Nothing obvious in the console too."
	);

	const imagesCount = 10;

	const timeouts = { begin: 500, finish: imagesCount * 0.4 * 60_000 };
	test.setTimeout(3 * timeouts.finish);

	await app.settings.set({
		showTechnicalMetadata: false
	});
	await newSession(page);
	await app.tabs.go('import');

	const observations = page.getByTestId('observations-area');

	const images: FixturePaths.Photos[] = [
		'cyan.jpeg',
		'lil-fella.jpeg',
		'leaf.jpeg',
		'large-image.jpeg'
	];
	const randomImage = () => images[Math.floor(Math.random() * images.length)];
	await importPhotos({ page, wait: false }, Array.from({ length: imagesCount }, randomImage));

	await waitForLoadingEnd(observations, { ...timeouts, concurrency: 4 });

	// Makes the test really slow

	// await app.tabs.go('crop')
	// await waitForLoadingEnd(observations, timeouts);

	// await app.tabs.go('classify')
	// await waitForLoadingEnd(observations, timeouts);

	await page.keyboard.press('Control+A');
	// await expect(page.getByTestId('sidepanel')).toMatchAriaSnapshot();
	await assert(page.getByTestId('sidepanel').getByRole('heading', { level: 2 })).toHaveText(
		`${imagesCount} images`
	);
	await assert(observations).not.toHaveText(new RegExp('Rééssayer'));
});

test('can import a protocol via /protocols/import/url', async ({ page, app, context }) => {
	await app.settings.set({ showTechnicalMetadata: false });
	const protocolUrl = 'https://example.com/kitchensink.cigaleprotocol.yaml';
	await mockProtocolSourceURL(page, context, protocolUrl, {
		body: await readFile(
			path.join(import.meta.dirname, '..', 'examples', 'kitchensink.cigaleprotocol.yaml'),
			'utf8'
		)
	});

	await app.path.wait('/sessions');

	await app.path.go(`/protocols/import/${protocolUrl}`);
	await assert(app.modals.byTitle('Importer le protocole distant ?')).toBeVisible({
		timeout: 30_000
	});
	await assert(
		app.modals.byTitle('Importer le protocole distant ?').getByRole('link')
	).toHaveAttribute('href', protocolUrl);

	await app.modals
		.byTitle('Importer le protocole distant ?')
		.getByRole('button', { name: 'Importer' })
		.click();

	await app.path.wait('/protocols');

	await assert(page.getByRole('listitem')).toHaveCount(2);
	await assert(
		page
			.getByRole('listitem')
			.filter({ has: page.getByRole('heading', { name: 'Kitchen sink' }) })
	).toBeVisible();
	await assert(
		page
			.getByRole('listitem')
			.filter({ has: page.getByRole('heading', { name: lightweightProtocol.name }) })
	).toBeVisible();
});

test('can send a bug report', async ({ page, app, context }) => {
	let requestBody: undefined | typeof IssueCreatorRequest.inferIn;

	await mockUrl(
		page,
		context,
		(u) => u.hostname === 'mkissue.cigale.gwen.works',
		async (route) => {
			requestBody = route.request().postDataJSON();
			await browserConsole.log(page, 'mocking route, body is', requestBody);
			return {
				json: {
					url: 'https://example.com/issue/123'
				}
			};
		}
	);

	await loadDatabaseDump(page, 'db/basic.devalue');
	await chooseFirstSession(page);
	await setInferenceModels(page, { crop: 'Aucune inférence' });
	await app.tabs.go('crop');

	const report = app.modals.byKey('modal_submit_issue_bug');

	await page.getByTestId('open-bug-report').click();

	await assert(report).toBeVisible();
	await report.getByRole('textbox', { name: 'Description' }).fill('This is a test bug report.');
	await report.getByRole('textbox', { name: 'Titre' }).fill('Test Bug Report');
	await report.getByRole('button', { name: 'Envoyer' }).click();

	await assert(
		app.toasts.byMessage('success', 'Merci pour votre contribution!').getByRole('button', {
			name: 'Voir'
		})
	).toHaveAttribute('href', 'https://example.com/issue/123');

	ex(IssueCreatorRequest(requestBody)).not.toBeInstanceOf(ArkErrors);
	ex(requestBody).toEqual({
		title: 'Test Bug Report',
		body: 'This is a test bug report.',
		type: 'bug',
		metadata: assert.objectContaining({
			Route: '/(app)/(sidepanel)/crop' as const satisfies SvelteTypes.RouteId,
			Protocol: assert.stringMatching(
				// Version number depends on what was captured in the database dump
				// TODO: use RegExp.escape once available (ie when VSCode ships with Node 24 ?? or something. Bun has it already, idk if it would work in CI yet)
				new RegExp(`^${lightweightProtocol.id.replaceAll('.', '\\.')} v\\d+$`)
			),
			'Loaded objects': '4 observations, 4 images, 1 sessions, 25 metadatas, 1 protocols'
		})
	} satisfies typeof requestBody);
});

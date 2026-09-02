import type { AppFixture } from './fixtures/app.js';
import type { ONNXModelsFixture } from './fixtures/onnxmodels.js';
import type { BrowserContext, Page } from '@playwright/test';

import {
	MODEL_DETECTION_OUTPUT_SHAPES,
	NeuralBoundingBoxInference,
	NeuralEnumInference,
} from '../src/lib/schemas/neural.js';
import { assert, expect, test } from './fixtures.js';
import { chooseInDropdown, clickInDropdown, mockUrl } from './utils/core.js';
import { goHome } from './utils/navigation.js';
import { importPhotos } from './utils/photos.js';
import { importProtocol } from './utils/protocols.js';
import { chooseFirstSession, newSession } from './utils/sessions.js';

type ModelConfigEnum = Omit<(typeof NeuralEnumInference)['inferIn'], 'model'> & { model: number[] };
type ModelConfigBox = Omit<(typeof NeuralBoundingBoxInference)['inferIn'], 'model'> & {
	model: number[];
};

type ModelConfig =
	({ purpose: 'detect' } & ModelConfigBox) | ({ purpose: 'classify' } & ModelConfigEnum);

test.beforeEach(async ({ page, app, onnxmodels }) => {
	await app.tabs.go('protocols');
	await importProtocol(page, {
		authors: [],
		name: 'Test',
		id: 'test',
		description: '',
		metadata: {
			classification: {
				type: 'enum',
				required: false,
				label: 'Classification',
				mergeMethod: 'none',
				description: '',
				options: [
					{ key: 'a', label: 'A' },
					{ key: 'b', label: 'B' },
					{ key: 'c', label: 'C' },
				],
				infer: {
					neural: [
						onnxmodels.declare({
							name: 'Default',
							classmapping: ['a', 'b', 'c'],
							model: [0.2, 0.2, 0.6],
							input: { width: 10, height: 10, disposition: '1CHW', normalized: true },
							output: { name: 'output' },
						}),
					],
				},
			},
			crop: {
				type: 'boundingbox',
				required: true,
				label: 'Crop',
				mergeMethod: 'none',
				description: '',
				infer: {
					neural: [
						onnxmodels.declare({
							name: 'Default',
							model: [0.1, 0.1, 0.2, 0.2, 0.8],
							input: { width: 10, height: 10, disposition: '1CHW', normalized: true },
							output: {
								name: 'output',
								shape: ['sx', 'sy', 'ex', 'ey', 'score'],
								normalized: true,
							},
						}),
					],
				},
			},
		},
	});

	await newSession(page, {
		protocol: 'Test',
		goto: 'import',
	});
});

for (const name of ['local file', 'remote source'] as const) {
	test(`use a custom model from a ${name}`, async ({ page, context, app, onnxmodels }) => {
		const source = name === 'local file' ? 'local' : 'remote';

		await clickInDropdown(
			page,
			page.getByTestId('classify-settings-open'),
			"Modèle d'inférence",
			'Classification',
			'Classification',
			'Modèle personnalisé…'
		);

		await addCustomNeuralNetwork({
			page,
			context,
			app,
			onnxmodels,
			source,
			purpose: 'classify',
			input: {
				name: 'input',
				width: 24,
				height: 18,
				normalized: true,
				disposition: '1CHW',
			},
			model: [0.68, 0.21, 0.11],
			classmapping: ['a', 'b', 'c'],
			output: { name: 'output' },
		});

		await clickInDropdown(
			page,
			page.getByTestId('crop-settings-open'),
			"Modèle d'inférence",
			'Modèle personnalisé…'
		);

		await addCustomNeuralNetwork({
			page,
			context,
			app,
			onnxmodels,
			source,
			purpose: 'detect',
			input: {
				name: 'input',
				width: 18,
				height: 16,
				normalized: true,
				disposition: '1CHW',
			},
			model: [0.89, 0.1, 0.15, 0.2, 0.25],
			output: {
				name: 'output',
				shape: ['score', 'sx', 'sy', 'ex', 'ey'],
				normalized: true,
			},
		});

		await chooseInDropdown(
			page,
			page.getByTestId('crop-settings-open'),
			"Modèle d'inférence",
			'detect'
		);

		await chooseInDropdown(
			page,
			page.getByTestId('classify-settings-open'),
			"Modèle d'inférence",
			'Classification',
			'Classification',
			'classify'
		);

		await app.tabs.go('import');

		await importPhotos({ page }, 'cyan.jpeg');

		await app.tabs.go('crop');

		await app.loading.maybeWait();

		expect(
			await app.db.metadata.of({
				image: 'cyan.jpeg',
				protocolId: 'test',
			})
		).toMatchObject({
			crop: {
				confidence: assert.closeTo(0.89, 2),
				parsedValue: {
					x: assert.closeTo(0.15, 2),
					y: assert.closeTo(0.2, 2),
					w: assert.closeTo(0.1, 2),
					h: assert.closeTo(0.1, 2),
				},
			},
		});

		await app.tabs.go('classify');

		await app.loading.maybeWait();

		expect(
			await app.db.metadata.of({
				image: 'cyan.jpeg',
				protocolId: 'test',
			})
		).toMatchObject({
			classification: {
				parsedValue: 'a',
				confidence: assert.closeTo(0.68, 2),
				alternatives: [],
				confidences: {
					'"a"': assert.closeTo(0.68, 2),
					'"b"': assert.closeTo(0.21, 2),
					'"c"': assert.closeTo(0.11, 2),
				},
			},
		});

		await app.settings.open();
		await page.getByRole('menuitem', { name: 'Gérer le stockage…' }).click();

		await expect(page.getByRole('heading', { name: 'Modèles personnalisés' })).toBeVisible();
		const table = page.getByRole('table', { name: 'Modèles personnalisés' });
		await expect(table.getByRole('row')).toHaveCount(2);

		if (source === 'local') {
			await expect(table).toHaveText(/detect test_2\.onnx/);
			await expect(table).toHaveText(/classify test\.onnx/);
		}

		await table
			.getByRole('row', { name: 'detect' })
			.getByRole('button', { name: 'Supprimer' })
			.click();

		await expect(table.getByRole('row')).toHaveCount(1);

		await goHome(page);
		await chooseFirstSession(page);
		await page.getByTestId('crop-settings-open').click();
		await assert(page.getByTestId('crop-settings-open')).toHaveAttribute('aria-controls');

		const id = await page.getByTestId('crop-settings-open').getAttribute('aria-controls');

		await expect(
			page.locator('#' + id).getByRole('menuitemcheckbox', { name: 'detect' })
		).not.toBeVisible();
	});
}

async function addCustomNeuralNetwork({
	source,
	page,
	app,
	context,
	onnxmodels,
	...config
}: {
	source: 'local' | 'remote';
	page: Page;
	app: AppFixture;
	onnxmodels: ONNXModelsFixture;
	context: BrowserContext;
} & ModelConfig) {
	const modal = app.modals.byTitle('Ajouter un réseau neuronal');

	const expectSelectedTab = async (name: string) =>
		expect(modal.getByRole('tab', { name })).toHaveAttribute('aria-selected', 'true');

	await assert(modal).toBeVisible();

	if (source === 'local') {
		const bytes = onnxmodels.make(config);

		await modal.getByRole('tab', { name: 'Fichier .onnx' }).click();

		const filechooser = page.waitForEvent('filechooser');

		await modal.getByRole('button', { name: 'Ajouter un fichier .onnx' }).click();

		await filechooser.then((chooser) =>
			chooser.setFiles([
				{
					name: 'test.onnx',
					mimeType: 'application/octet-stream',
					buffer: Buffer.from(bytes),
				},
			])
		);

		await expect(modal.getByRole('textbox', { name: 'Nom du modèle' })).toHaveValue(
			/^Test( \d+)?$/
		);
	} else {
		await modal.getByRole('tab', { name: 'URL' }).first().click();

		const onnxurl = modal.getByRole('textbox', {
			name: 'URL vers un fichier .onnx',
		});

		await onnxurl.fill(onnxmodels.serve(config));
		await onnxurl.blur();
	}

	await modal.getByRole('textbox', { name: 'Nom du modèle' }).fill(config.purpose);

	await expect(modal.getByRole('textbox', { name: 'Largeur' })).toHaveValue(
		config.input.width.toString()
	);
	await expect(modal.getByRole('textbox', { name: 'Hauteur' })).toHaveValue(
		config.input.height.toString()
	);

	await expect(modal).toHaveText(
		new RegExp(
			`Entrées  ${config.input.name} \\[batch, 3, ${config.input.width}, ${config.input.height}\\] × f32  Sorties  ${config.output!.name} \\[batch, ${config.model.length}\\] × f32`
		)
	);

	await expect(
		modal.getByRole('group', { name: 'Entrée' }).getByRole('textbox', { name: 'Couche' })
	).toHaveValue(config.input.name!);
	await expect(
		modal.getByRole('group', { name: 'Sortie' }).getByRole('textbox', { name: 'Couche' })
	).toHaveValue(config.output!.name!);

	await expectSelectedTab(
		config.input.disposition === '1CHW'
			? 'Batch, Canal, Hauteur, Largeur'
			: 'Canal, Hauteur, Largeur'
	);

	await expectSelectedTab(config.input.normalized ? 'Normalisés (0—1)' : 'Bruts (0—255)');

	if (config.purpose === 'classify') {
		if (!Array.isArray(config.classmapping))
			throw new Error('non-array classmapping not supported because flemme mdr');

		await expectSelectedTab('Classification');

		if (source === 'local') {
			await modal.getByRole('tab', { name: 'Manuel' }).click();

			const classmapping = modal.getByRole('group', { name: 'Sortie' }).locator('textarea');

			// FIXME
			// await classmapping.fill([...config.classmapping, 'd'].join('\n'));
			// await classmapping.blur();

			// await app.wait('500ms');

			// await expect(modal).toHaveText(
			// 	/Le classmapping comporte 4 entrées mais le réseau semble avoir 3 neurones en sortie/
			// );

			await classmapping.fill(config.classmapping.join('\n'));
			await classmapping.blur();
		} else {
			await modal
				.getByRole('group', { name: 'Sortie' })
				.getByRole('tab', { name: 'URL' })
				.click();

			const classmapping = modal.getByRole('textbox', {
				name: 'URL vers un fichier .txt',
			});

			const classmappingUrl = 'https://example.com/classes.txt';

			await mockUrl(page, context, classmappingUrl, {
				body: (config.classmapping as string[]).join('\n'),
			});

			await classmapping.fill(classmappingUrl);
			await classmapping.blur();
		}
	} else {
		await expectSelectedTab('Détection');

		await modal
			.getByRole('tab', {
				name: config.output.normalized ? 'Normalisées (0—1)' : 'Brutes (pixels)',
			})
			.click();

		for (const atom of config.output.shape) {
			await modal
				.getByRole('group', { name: 'Sortie' })
				.getByRole('button', { name: 'Ajouter' })
				.click();

			await modal
				.getByRole('group', { name: 'Sortie' })
				.getByRole('button', { name: MODEL_DETECTION_OUTPUT_SHAPES[atom].help })
				.click();
		}
	}

	await modal.getByRole('contentinfo').getByRole('button', { name: 'Ajouter' }).click();

	await assert(modal).not.toBeVisible();
}

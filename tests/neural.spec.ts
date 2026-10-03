import { pr, withHardware } from './annotations.js';
import { assert, expect, test } from './fixtures.js';
import { chooseInDropdown } from './utils/core.js';
import { importPhotos } from './utils/photos.js';
import { importProtocol } from './utils/protocols.js';
import { newSession } from './utils/sessions.js';

test(
	'honors infer.neural.output.select for enum metadata',
	pr(1751),
	async ({ page, app, onnxmodels }) => {
		await app.settings.set({ debugMode: true });
		await app.tabs.go('protocols');
		await importProtocol(page, {
			id: 'testing',
			name: 'Testing',
			authors: [],
			description: '',
			metadata: {
				crop: {
					label: '',
					description: '',
					mergeMethod: 'union',
					required: true,
					type: 'boundingbox',
				},
				target: {
					label: 'Target',
					description: '',
					mergeMethod: 'none',
					required: false,
					type: 'enum',
					options: 'abcedf'.split('').map((letter) => ({
						key: letter,
						label: letter.toUpperCase(),
						description: '',
					})),
					infer: {
						neural: [
							onnxmodels.declare({
								name: 'abcdef',
								input: {
									width: 24,
									height: 24,
									normalized: true,
								},
								model: [0.1, 0.2, 0.4, 0.05, 0.05, 0.2],
								classmapping: ['a', 'b', 'c', 'd', 'e', 'f'],
								output: {
									name: 'output',
									select: `
										[ "d", "a", neurons[0].key ]
									`,
								},
							}),
						],
					},
				},
			},
		});

		await newSession(page, {
			protocol: 'testing',
			models: {
				classify: {
					Target: 'abcdef',
				},
			},
		});

		await app.tabs.go('import');
		await importPhotos({ page }, 'cyan.jpeg');

		await app.tabs.go('crop');
		await app.loading.wait();
		await app.gallery.card('cyan.jpeg').click();
		await app.path.wait('/(app)/(sidepanel)/o/[observation]/crop/[image]');
		page.on('dialog', async (dialog) => {
			await dialog.accept('0.1 0.1 0.8 0.8');
		});

		await page.keyboard.press('x');
		await page.keyboard.press('b');
		await page.keyboard.press('Escape');

		await app.tabs.go('classify');
		// Inference is really fast so it doesnt necessarily pick up the loading thing
		await app.loading.maybeWait();

		const { target } = await app.db.metadata.of({ image: 'cyan.jpeg', protocolId: 'testing' });

		expect(target.parsedValue).toBe('d');
		expect(target.confidence).toBeCloseTo(0.05, 2);
		expect(target.alternatives).toStrictEqual(['"a"', '"c"']);
		expect(target.confidences).toMatchObject({
			'"a"': assert.closeTo(0.1, 2),
			'"b"': assert.closeTo(0.2, 2),
			'"c"': assert.closeTo(0.4, 2),
			'"d"': assert.closeTo(0.05, 2),
			'"e"': assert.closeTo(0.05, 2),
			'"f"': assert.closeTo(0.2, 2),
		});
	}
);

test.describe('respects hardware requirements', () => {
	test.beforeEach(async ({ page, app, onnxmodels }) => {
		await app.tabs.go('protocols');
		await importProtocol(page, {
			id: 'testing',
			name: 'Testing',
			authors: [],
			description: '',
			metadata: {
				crop: {
					label: '',
					description: '',
					mergeMethod: 'union',
					required: true,
					type: 'boundingbox',
				},
				target: {
					label: 'Target',
					description: '',
					mergeMethod: 'none',
					required: false,
					type: 'enum',
					options: 'abcedf'.split('').map((letter) => ({
						key: letter,
						label: letter.toUpperCase(),
						description: '',
					})),
					infer: {
						neural: [
							onnxmodels.declare({
								name: 'heavy',
								requirements: { ram: '4 GB', cpu: '4 threads' },
								input: {
									width: 24,
									height: 24,
									normalized: true,
								},
								output: { name: 'output' },
								model: [0.1, 0.2, 0.4, 0.05, 0.05, 0.2],
								classmapping: ['a', 'b', 'c', 'd', 'e', 'f'],
							}),
							onnxmodels.declare({
								name: 'light',
								requirements: { ram: '1 GB' },
								input: {
									width: 16,
									height: 16,
									normalized: true,
								},
								output: { name: 'output' },
								model: [0.5, 0.4, 0.01, 0.02, 0.03, 0.01],
								classmapping: ['a', 'b', 'c', 'd', 'e', 'f'],
							}),
						],
					},
				},
			},
		});

		await newSession(page, {
			protocol: 'testing',
		});

		await app.tabs.go('import');
		await importPhotos({ page }, 'cyan.jpeg');

		await app.tabs.go('crop');
		await app.loading.wait();
		await app.gallery.card('cyan.jpeg').click();
		await app.path.wait('/(app)/(sidepanel)/o/[observation]/crop/[image]');
		page.on('dialog', async (dialog) => {
			await dialog.accept('0.1 0.1 0.8 0.8');
		});

		await page.keyboard.press('x');
		await page.keyboard.press('b');
		await page.keyboard.press('Escape');

		await app.tabs.go('classify');
		// Inference is really fast so it doesnt necessarily pick up the loading thing
		await app.loading.maybeWait();
	});

	test(
		'not enough RAM for first model',
		withHardware({ ram: '2 GB', threads: 4 }),
		async ({ page, app }) => {
			const { target } = await app.db.metadata.of({
				image: 'cyan.jpeg',
				protocolId: 'testing',
			});

			expect(target.confidence).toBeCloseTo(0.5, 2);
			expect(target.parsedValue).toBe('a');
			expect(target.alternatives).toHaveLength(0);
			expect(target.confidences).toMatchObject({
				'"a"': assert.closeTo(0.5, 2),
				'"b"': assert.closeTo(0.4, 2),
				'"c"': assert.closeTo(0.01, 2),
				'"d"': assert.closeTo(0.02, 2),
				'"e"': assert.closeTo(0.03, 2),
				'"f"': assert.closeTo(0.01, 2),
			});

			// Try selecting first model
			await chooseInDropdown(
				page,
				page.getByTestId('classify-settings-open'),
				"Modèle d'inférence",
				'Target',
				'Target',
				'heavy'
			);

			await expect(app.toasts.byType('error')).toBeVisible();
		}
	);

	test(
		'hardware requirements met',
		withHardware({ ram: '4 GB', threads: 4 }),
		async ({ app }) => {
			const { target } = await app.db.metadata.of({
				image: 'cyan.jpeg',
				protocolId: 'testing',
			});

			expect(target.confidence).toBeCloseTo(0.4, 2);
			expect(target.parsedValue).toBe('c');
			expect(target.alternatives).toHaveLength(0);
			expect(target.confidences).toMatchObject({
				'"a"': assert.closeTo(0.1, 2),
				'"b"': assert.closeTo(0.2, 2),
				'"c"': assert.closeTo(0.4, 2),
				'"d"': assert.closeTo(0.05, 2),
				'"e"': assert.closeTo(0.05, 2),
				'"f"': assert.closeTo(0.2, 2),
			});
		}
	);
});

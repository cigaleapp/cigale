import type { AnalyzedObservation } from '$lib/schemas/results.js';

import { expect, test } from './fixtures.js';
import sidecarExample from './fixtures/real/entomoscope/20260209141830.json' with { type: 'json' };
import { expectZipFiles } from './utils/core.js';
import { goToProtocolManagement } from './utils/navigation.js';
import { firstObservationCard } from './utils/observations.js';
import { importPhotos } from './utils/photos.js';
import { importProtocol } from './utils/protocols.js';
import { exportResults } from './utils/results.js';
import { newSession } from './utils/sessions.js';

test('Entomoscope @real-protocol', async ({ app, page }) => {
	await app.settings.set({ showTechnicalMetadata: false });
	await goToProtocolManagement(page);
	await importProtocol(page, 'protocols/entomoscope.cigaleprotocol.yaml', (p) => {
		p.exports = {
			images: {
				cropped:
					'cropped/{{ percentage image.protocolMetadata.crop.confidence 1 }}.{{ extension image.filename }}',
				original: 'original/{{ sequence }}.{{ extension image.filename }}'
			},
			metadata: {
				csv: 'metadata.csv',
				files: 'files/{{ metadataKey }}/{{ filename }}'
			}
		};
	});
	await newSession(page, {
		name: 'Entomoscope test',
		protocol: 'Entomoscope'
	});

	await importPhotos({ page }, [
		'real/entomoscope/20260209141830.jpg',
		'real/entomoscope/20260209141830.json'
	]);

	// FIXME: loading ends a bit early on the card
	await app.wait(5000);

	await firstObservationCard(page).click();

	const textbox = (label: string) => app.sidepanel.metadataSection(label).getByRole('textbox');
	const combobox = (label: string) => app.sidepanel.metadataSection(label).getByRole('combobox');
	const radio = (label: string, name: string) =>
		app.sidepanel.metadataSection(label).getByRole('radio', { name });

	await expect(textbox('Altitude')).toHaveValue('0');
	await expect(textbox('Luminosité')).toHaveValue(/^831\.9\d+/);
	await expect(radio('Modèle de caméra', 'V3')).toBeChecked();
	await expect(textbox('Modèle utilisé pour la détection')).toHaveValue(
		'yolo11n_ArthroNat+flatbug.pt'
	);
	await expect(textbox('Intensité des LEDs')).toHaveValue('61');
	await expect(textbox('Modèle de Raspberry Pi')).toHaveValue('Raspberry Pi 4 Model B Rev 1.5');
	await expect(textbox('Numéro de série du Raspberry Pi')).toHaveValue('10000000ede1b681');
	await expect(textbox('Date')).toHaveValue(/^2026-02-09T?/);
	await expect(combobox('Lieu')).toHaveValue('0, 0');
	await expect(textbox('ID du site')).toHaveValue('Col31');

	await app.tabs.go('crop');
	await firstObservationCard(page).click();
	await app.path.wait('/(app)/(sidepanel)/crop/[image]');

	const box = (no: number) => page.getByRole('listitem', { name: `Boîte #${no}`, exact: true });

	await expect(box(1)).toHaveText(/\b90%/);
	await expect(box(1)).toHaveText(/\b399×288\b/);
	await expect(box(14)).toHaveText(/\b56%/);
	await expect(box(14)).toHaveText(/\b115×108\b/);
	await expect(box(15)).not.toBeVisible();

	await page.getByRole('button', { name: 'Autres photos' }).click();
	await app.path.wait('/(app)/(sidepanel)/crop');
	await app.tabs.go('classify');
	await app.loading.wait();

	await app.tabs.go('results');
	const zip = await exportResults(page, { kind: 'cropped' });
	await expectZipFiles(
		zip,
		[
			'metadata.csv',
			'analysis.json',
			'files/misc_config/20260209141830.json',
			'cropped/89.8%.jpg',
			'cropped/84.2%.jpg',
			'cropped/83.3%.jpg',
			'cropped/83.2%.jpg',
			'cropped/80.5%.jpg',
			'cropped/79.0%.jpg',
			'cropped/77.4%.jpg',
			'cropped/76.2%.jpg',
			'cropped/75.3%.jpg',
			'cropped/75.1%.jpg',
			'cropped/71.8%.jpg',
			'cropped/70.5%.jpg',
			'cropped/57.0%.jpg',
			'cropped/55.9%.jpg'
		],
		{
			'files/misc_config/20260209141830.json': {
				async json(json: unknown) {
					expect(json).toMatchObject(sidecarExample);
				}
			},
			'cropped/89.8%.jpg': {
				async buffer(buffer) {
					expect(buffer).toMatchSnapshot('entomoscope-box-best.jpg');
				}
			},
			'cropped/55.9%.jpg': {
				async buffer(buffer) {
					expect(buffer).toMatchSnapshot('entomoscope-box-worst.jpg');
				}
			},
			'analysis.json': {
				async json(json) {
					const obs: (typeof AnalyzedObservation.infer)[] = Object.values(
						json.observations
					);

					expect(obs).toHaveLength(14);

					expect([
						...new Set(obs.map((o) => o.protocolMetadata.raspberry_serial_number.value))
					]).toMatchObject(['10000000ede1b681']);

					expect(obs.map((o) => o.protocolMetadata.species.value)).not.toContainEqual(
						null
					);
				}
			}
		}
	);
});

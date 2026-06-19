import { readFile } from 'node:fs/promises';
import type { BrowserContext, Page } from '@playwright/test';

import { chooseInDropdown, entries, mockUrl } from './core.js';

type InferenceModelName = 'Aucune inférence' | (string & {}) | RegExp;
type ProtocolInfer = typeof import('../../src/lib/schemas/protocols.js').ExportedProtocol.infer;

/**
 * Names of tasks to names of models to select. For classification, the keys of the object are the metadata labels. Pass a model name directly to use the same preference for all options.
 */
export async function setInferenceModels(
	page: Page,
	models: {
		crop?: InferenceModelName;
		classify?:
			| InferenceModelName
			| Partial<Record<'Morphogroupe' | 'Espèce' | (string & {}), InferenceModelName>>;
	}
) {
	for (const [tab, model] of entries(models)) {
		if (!model) continue;

		const trigger = page.getByRole('button', {
			name: { crop: 'Réglages de recadrage', classify: 'Réglages de classification' }[tab],
		});

		if (tab === 'crop') {
			await chooseInDropdown(page, trigger, "Modèle d'inférence", model);
		} else {
			let preferences: Array<[string, InferenceModelName]>;

			if (typeof model === 'string' || model instanceof RegExp) {
				// Retrieve all options for this task
				await trigger.click();
				preferences = await page
					.getByTestId('classify-settings-inference-model')
					.getByRole('menuitem')
					.allTextContents()
					.then((options) => options.map((option) => [option, model]));
				await page.keyboard.press('Escape');
			} else {
				preferences = Object.entries(model).filter(
					(entry): entry is [string, InferenceModelName] => Boolean(entry[1])
				);
			}

			for (const [metadata, model] of preferences) {
				await chooseInDropdown(page, trigger, "Modèle d'inférence", metadata, model);
			}
		}
	}
}

/**
 * Reads a predownloaded model and optional classmapping from disk.
 */
export type PredownloadedModel = {
	model: Buffer<ArrayBufferLike>;
	classmapping: Buffer<ArrayBufferLike> | undefined;
	filename: string;
};

export async function getPredownloadedModel(
	filename: string,
	classmappingFilename?: string
): Promise<PredownloadedModel | null> {
	const model = await readFile(filename).catch(() => {
		if (process.env.CI) {
			console.warn(
				`Warning: cannot find '${filename}' model file. Tests will use the network to fetch it.`
			);
		}

		return null;
	});

	const classmapping = classmappingFilename
		? await readFile(classmappingFilename).catch(() => {
				if (process.env.CI) {
					console.warn(
						`Warning: cannot find '${classmappingFilename}' classmapping file. Tests will use the network to fetch the '${filename}' model.`
					);
				}

				return undefined;
			})
		: undefined;

	return model
		? {
				model,
				classmapping,
				filename,
			}
		: null;
}

/**
 * Mocks a predownloaded model for a metadata entry.
 */
async function mockPredownloadedModel(
	page: Page,
	context: BrowserContext,
	protocol: ProtocolInfer,
	metadataId: string,
	{ filename, model, classmapping }: PredownloadedModel
) {
	const metadata = protocol.metadata[`${protocol.id}__${metadataId}`];

	if (!('infer' in metadata)) throw new Error(`Metadata ${metadataId} has no inference settings`);
	if (!('neural' in metadata.infer))
		throw new Error(`Metadata ${metadataId} has no neural inference settings`);

	const inference = metadata.infer.neural.find(({ model }) =>
		new URL(typeof model === 'string' ? model : model.url).pathname.endsWith(filename)
	);

	if (!inference)
		throw new Error(
			`No inference model found in metadata ${metadataId} with filename ${JSON.stringify(filename)}, searched in: ${metadata.infer.neural.map((i) => i.model)}. paths were ${JSON.stringify(metadata.infer.neural.map((i) => new URL(typeof i.model === 'string' ? i.model : i.model.url).pathname))}`
		);

	if (typeof inference.model !== 'string')
		throw new Error(`Model URL for metadata ${metadataId} is not a string`);

	await mockUrl(page, context, inference.model, {
		body: model,
	});

	if (classmapping && 'classmapping' in inference) {
		if (typeof inference.classmapping !== 'string')
			throw new Error(`Classmapping URL for metadata ${metadataId} is not a string`);

		await mockUrl(page, context, inference.classmapping, {
			body: classmapping,
		});
	}
}

/**
 * Mocks the predownloaded models for each metadata entry.
 */
export async function mockPredownloadedModels(
	page: Page,
	context: BrowserContext,
	protocol: ProtocolInfer,
	models: Record<string, Array<null | PredownloadedModel>>
) {
	for (const [metadataId, taskModels] of Object.entries(models)) {
		for (const model of taskModels) {
			if (!model) continue;

			await mockPredownloadedModel(page, context, protocol, metadataId, model);
		}
	}
}

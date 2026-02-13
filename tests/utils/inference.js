import { readFile } from 'node:fs/promises';

import { chooseInDropdown, entries, mockUrl } from './core.js';

/**
 * @import { Page } from '@playwright/test';
 */

/**
 * @typedef {"Aucune inférence" | (string & {}) | RegExp} InferenceModelName
 */

/**
 *
 * @param {Page} page
 * @param {{ crop?: InferenceModelName, classify?: InferenceModelName }} models names of tasks to names of models to select. use "la détection" for the detection model, and the metadata's labels for classification model(s)
 */
export async function setInferenceModels(page, models) {
	for (const [tab, model] of entries(models)) {
		if (!model) continue;

		const trigger = page.getByRole('button', {
			name: { crop: 'Réglages de recadrage', classify: 'Réglages de classification' }[tab]
		});

		await chooseInDropdown(page, trigger, "Modèle d'inférence", model);
	}
}

/**
 * @typedef {{ model: Buffer<ArrayBufferLike>, classmapping: Buffer<ArrayBufferLike> | undefined, filename: string }} PredownloadedModel
 */

/**
 *
 * @param {string} filename
 * @param {string} [classmappingFilename]
 * @returns {Promise<PredownloadedModel|null>}
 */
export async function getPredownloadedModel(filename, classmappingFilename) {
	const model = await readFile(filename).catch(() => {
		console.warn(
			`Warning: cannot find '${filename}' model file. Tests will use the network to fetch it.`
		);

		return null;
	});

	const classmapping = classmappingFilename
		? await readFile(classmappingFilename).catch(() => {
				console.warn(
					`Warning: cannot find '${classmappingFilename}' classmapping file. Tests will use the network to fetch the '${filename}' model.`
				);

				return undefined;
			})
		: undefined;

	return model
		? {
				model,
				classmapping,
				filename
			}
		: null;
}

/**
 * @param {Page} page
 * @param {import('@playwright/test').BrowserContext} context
 * @param {typeof import('$lib/schemas/protocols').ExportedProtocol.infer} protocol
 * @param {string} metadataId
 * @param {PredownloadedModel} model
 */
async function mockPredownloadedModel(
	page,
	context,
	protocol,
	metadataId,
	{ filename, model, classmapping }
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
		body: model
	});

	if (classmapping && 'classmapping' in inference) {
		if (typeof inference.classmapping !== 'string')
			throw new Error(`Classmapping URL for metadata ${metadataId} is not a string`);

		await mockUrl(page, context, inference.classmapping, {
			body: classmapping
		});
	}
}

/**
 * @param {Page} page
 * @param {import('@playwright/test').BrowserContext} context
 * @param {typeof import('$lib/schemas/protocols').ExportedProtocol.infer} protocol
 * @param {Record<string, Array<null | PredownloadedModel>>} models
 */
export async function mockPredownloadedModels(page, context, protocol, models) {
	for (const [metadataId, taskModels] of Object.entries(models)) {
		for (const model of taskModels) {
			if (!model) continue;

			await mockPredownloadedModel(page, context, protocol, metadataId, model);
		}
	}
}

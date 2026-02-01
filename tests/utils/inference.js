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
 * @param {{metadata: string} | 'detection'} task
 * @param {PredownloadedModel} model
 */
async function mockPredownloadedModel(
	page,
	context,
	protocol,
	task,
	{ filename, model, classmapping }
) {
	/** @param {typeof import('$lib/schemas/metadata').MetadataInferOptionsNeural.infer['neural'][number]} arg0 */
	const modelMatches = ({ model }) =>
		new URL(typeof model === 'string' ? model : model.url).pathname.endsWith(filename);

	const url =
		task === 'detection'
			? protocol.crop.infer?.find(modelMatches)?.model
			: protocol.metadata[`${protocol.id}__${task.metadata}`].infer?.neural.find(modelMatches)
					?.model;

	await mockUrl(page, context, url, {
		body: model
	});

	if (classmapping && task !== 'detection') {
		const classmappingUrl =
			protocol.metadata[`${protocol.id}__${task.metadata}`].infer?.neural.find(
				modelMatches
			)?.classmapping;

		if (!classmappingUrl) return;

		await mockUrl(page, context, classmappingUrl, {
			body: classmapping
		});
	}
}

/**
 * @param {Page} page
 * @param {import('@playwright/test').BrowserContext} context
 * @param {typeof import('$lib/schemas/protocols').ExportedProtocol.infer} protocol
 * @param {Record<'detection'|'species', Array<null | PredownloadedModel>>} models
 */
export async function mockPredownloadedModels(page, context, protocol, models) {
	for (const [task, taskModels] of Object.entries(models)) {
		for (const model of taskModels) {
			if (!model) continue;

			await mockPredownloadedModel(
				page,
				context,
				protocol,
				task === 'detection'
					? 'detection'
					: {
							metadata: task
						},
				model
			);
		}
	}
}

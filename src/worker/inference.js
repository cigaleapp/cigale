/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import * as ort from 'onnxruntime-web';

import { Schemas } from '$lib/database.js';
import { loadToTensor } from '$lib/inference_utils.js';
import { classify, infer, loadModel } from '$lib/inference.js';
import { storeMetadataValue } from '$lib/metadata/index.js';
import { progressSplitter } from '$lib/utils';
import { fetchHttpRequest } from '$lib/utils.js';

import { openDatabase, swarp } from './index.js';

/**
 * @typedef {object} InferenceSession
 * @property {import('onnxruntime-web').InferenceSession} onnx
 * @property {string} id
 * @property {string[]} [classmapping]
 */

/**
 * @typedef {typeof import('./procedures.js').PROCEDURES.loadModel.input.infer['task']} InferenceTask
 */

/**
 * @type {Map<InferenceTask, InferenceSession>}
 */
let inferenceSessions = new Map();

swarp.loadModel(async ({ task, model, classmapping, inferenceSessionId: id, webgpu }) => {
	const onnx = await ort.InferenceSession.create(model, {
		executionProviders: webgpu ? ['webgpu'] : []
	});

	if (!onnx) throw new Error('Impossible de charger le modèle ONNX');

	/** @type {InferenceSession} */
	const session = { id, onnx };

	if (classmapping) {
		session.classmapping = classmapping.split(/\r?\n/).filter(Boolean);
	}

	inferenceSessions.set(task, session);
	return true;
});

swarp.inferenceSessionId(async (task) => inferenceSessions.get(task)?.id ?? null);

swarp.inferBoundingBoxes(async ({ fileId, taskSettings }, _, tools) => {
	const session = inferenceSessions.get('detection')?.onnx;
	if (!session) {
		throw new Error('Modèle de détection non chargé');
	}

	const db = await openDatabase();
	tools.abortSignal?.throwIfAborted();

	const file = await db.get('ImageFile', fileId);
	if (!file) {
		throw new Error(`Fichier avec l'ID ${fileId} non trouvé`);
	}

	const [[boxes], [scores]] = await infer(
		{
			...taskSettings,
			abortSignal: tools.abortSignal
		},
		[file.bytes],
		session
	);

	return { boxes, scores };
});

swarp.classify(async ({ imageId, metadataIds, taskSettings }, _, tools) => {
	tools.abortSignal?.throwIfAborted();

	const db = await openDatabase();
	const image = Schemas.Image.assert(await db.get('Image', imageId));

	tools.abortSignal?.throwIfAborted();
	const session = inferenceSessions.get('classification');
	if (!session) return { scores: [] };
	const { classmapping, onnx } = session;
	if (!classmapping)
		throw new Error("Le modèle de classification n'a pas de classmapping associé");

	tools.abortSignal?.throwIfAborted();
	if (!image.fileId) throw new Error(`Image ${imageId} has no ImageFile`);
	const file = await db.get('ImageFile', image.fileId);
	if (!file) {
		throw new Error(`Fichier avec l'ID ${image.fileId} non trouvé`);
	}

	const cropbox =
		/** @type {undefined | import('$lib/metadata/index.js').RuntimeValue<'boundingbox'>} */ (
			image.metadata[metadataIds.cropbox]?.value ?? { x: 0.5, y: 0.5, w: 1, h: 1 }
		);

	console.debug('Classifying image', image.id, 'with cropbox', cropbox);

	// We gotta normalize since this img will be used to set a cropped Preview URL -- classify() itself takes care of normalizing (or not) depending on the protocol
	const img = await loadToTensor([file.bytes], {
		...taskSettings.input,
		normalized: true,
		crop: cropbox,
		abortSignal: tools.abortSignal
	});

	const scores = await classify(taskSettings, img, onnx, tools.abortSignal);

	tools.abortSignal?.throwIfAborted();
	const results = scores
		.map((score, i) => ({
			confidence: score,
			value: classmapping[i]
		}))
		.sort((a, b) => b.confidence - a.confidence)
		.slice(0, 100);

	tools.abortSignal?.throwIfAborted();
	if (!results.length) {
		throw new Error('No species detected');
	} else {
		const [firstChoice, ...alternatives] = results;
		const metadataValue = /** @type {const} */ ({
			subjectId: imageId,
			...firstChoice,
			alternatives
		});

		await storeMetadataValue({
			db,
			...metadataValue,
			metadataId: metadataIds.target,
			abortSignal: tools.abortSignal
		});
	}

	return { scores };
});

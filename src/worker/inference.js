/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import * as ort from 'onnxruntime-web';

import { FULL_IMAGE_CROPBOX } from '$lib/BoundingBoxes.svelte.js';
import { Schemas } from '$lib/database.js';
import { loadToTensor } from '$lib/inference_utils.js';
import { classify, infer } from '$lib/inference.js';
import { getMetadataValue, storeMetadataValue } from '$lib/metadata/index.js';

import { openDatabase, swarp } from './index.js';

/**
 * @typedef {object} InferenceSession
 * @property {import('onnxruntime-web').InferenceSession} onnx
 * @property {string} id
 * @property {string} task
 * @property {string[]} [classmapping]
 */

/**
 * @typedef {typeof import('./procedures.js').PROCEDURES.loadModel.input.infer['task']} InferenceTask
 */

/**
 * @type {Map<string, InferenceSession>} keyed by inferenceSessionId
 */
let inferenceSessions = new Map();
/**
 * @type {Map<InferenceTask, string>} map from task to latest inferenceSessionId
 */
let latestSessionIdByTask = new Map();

swarp.loadModel(async ({ task, model, classmapping, inferenceSessionId: id, webgpu }) => {
	const onnx = await ort.InferenceSession.create(model, {
		executionProviders: webgpu ? ['webgpu'] : [],
	});

	if (!onnx) throw new Error('Impossible de charger le modèle ONNX');

	/** @type {InferenceSession} */
	const session = { id, task, onnx };

	if (classmapping) {
		session.classmapping = classmapping.split(/\r?\n/).filter(Boolean);
	}

	inferenceSessions.set(id, session);
	latestSessionIdByTask.set(task, id);
	return true;
});

swarp.inferenceSessionId(async (task) => latestSessionIdByTask.get(task) ?? null);

swarp.inferBoundingBoxes(async ({ fileId, taskSettings }, _, tools) => {
	const sessionId = latestSessionIdByTask.get('detection');
	const session = sessionId ? inferenceSessions.get(sessionId)?.onnx : undefined;
	if (!session) {
		throw new Error('Modèle de détection non chargé');
	}

	const inputName = session.inputNames[0];
	const outputName = taskSettings.output.name ?? 'output0';
	const inferenceSettings = {
		...taskSettings,
		input: {
			...taskSettings.input,
			name: taskSettings.input.name ?? inputName,
		},
		output: {
			...taskSettings.output,
			name: outputName,
		},
	};

	const db = await openDatabase();
	tools.abortSignal?.throwIfAborted();

	const file = await db.get('ImageFile', fileId);
	if (!file) {
		throw new Error(`Fichier avec l'ID ${fileId} non trouvé`);
	}

	const [[boxes], [scores]] = await infer(
		{
			...inferenceSettings,
			...(tools.abortSignal ? { abortSignal: tools.abortSignal } : {}),
		},
		[file.bytes],
		session
	);

	return { boxes, scores };
});

swarp.classify(async ({ imageId, metadataIds, taskSettings, inferenceSessionId }, _, tools) => {
	tools.abortSignal?.throwIfAborted();

	const db = await openDatabase();

	const image = Schemas.Image.assert(await db.get('Image', imageId));

	tools.abortSignal?.throwIfAborted();
	
	// Use the specified inference session, or fall back to the latest classification session
	let session;
	if (inferenceSessionId) {
		session = inferenceSessions.get(inferenceSessionId);
		if (!session) {
			throw new Error(
				`Inference session ${inferenceSessionId} not found. Models may not be loaded.`
			);
		}
	} else {
		session = inferenceSessions.get(latestSessionIdByTask.get('classification') ?? '');
		if (!session) {
			return { scores: [] };
		}
	}

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
		getMetadataValue(image, 'boundingbox', metadataIds.cropbox)?.value ?? FULL_IMAGE_CROPBOX;

	console.debug('Classifying image', image.id, 'with cropbox', cropbox);

	// We gotta normalize since this img will be used to set a cropped Preview URL -- classify() itself takes care of normalizing (or not) depending on the protocol
	const img = await loadToTensor([file.bytes], {
		...taskSettings.input,
		normalized: true,
		crop: cropbox,
		...(tools.abortSignal ? { abortSignal: tools.abortSignal } : {}),
	});

	const scores = await classify(
		/** @type {Pick<import('$lib/schemas/neural.js').NeuralInference, 'input' | 'output'>} */ (
			taskSettings
		),
		img,
		onnx,
		tools.abortSignal
	);
	tools.abortSignal?.throwIfAborted();

	const results = scores
		?.map((score, i) => ({
			confidence: score,
			value: classmapping[i],
		}))
		.sort((a, b) => b.confidence - a.confidence)
		.slice(0, 100);

	tools.abortSignal?.throwIfAborted();

	if (!results?.length) {
		throw new Error("Le modèle de classification n'a retourné aucun résultat");
	}

	const [firstChoice, ...alternatives] = results;

	await storeMetadataValue({
		db,
		abortSignal: tools.abortSignal,
		metadataId: metadataIds.target,
		subjectId: imageId,
		alternatives,
		...firstChoice,
	});

	return { scores };
});

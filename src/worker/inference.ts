/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import type { PROCEDURES } from './procedures.js';

import * as ort from 'onnxruntime-web';

import { FULL_IMAGE_CROPBOX } from '$lib/BoundingBoxes.svelte.js';
import { Schemas } from '$lib/database.js';
import { loadToTensor } from '$lib/inference_utils.js';
import { classify, infer } from '$lib/inference.js';
import { getMetadataValue, storeMetadataValue } from '$lib/metadata/index.js';
import { ModelOutputEnum } from '$lib/schemas/neural.js';
import { compareBy, throwError } from '$lib/utils.js';

import { openDatabase, swarp } from './index.js';

interface InferenceSession {
	onnx: import('onnxruntime-web').InferenceSession;
	id: string;
	task: string;
	classmapping?: string[];
}

type InferenceTask = (typeof PROCEDURES.loadModel.input.infer)['task'];

/**
 * Keyed by inferenceSessionId
 */
const inferenceSessions = new Map<string, InferenceSession>();

/**
 * Map from task to latest inferenceSessionId
 */
const latestSessionIdByTask = new Map<InferenceTask, string>();

swarp.loadModel(async ({ task, model, classmapping, inferenceSessionId: id, webgpu }) => {
	// If the worker already has a session with this id, treat the request as a no-op.
	// This makes loadModel idempotent and avoids reloading the same model on
	// repeated client requests (e.g., when components remount on tab switches).
	if (inferenceSessions.has(id)) {
		latestSessionIdByTask.set(task, id);
		return true;
	}

	const onnx = await ort.InferenceSession.create(model, {
		executionProviders: webgpu ? ['webgpu'] : [],
	});

	if (!onnx) throw new Error('Impossible de charger le modèle ONNX');

	const session: InferenceSession = { id, task, onnx };

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

	const scores = await classify(taskSettings, img, onnx, tools.abortSignal);
	tools.abortSignal?.throwIfAborted();

	const results = scores
		?.map((score, i) => ({
			score,
			key: classmapping[i],
		}))
		.sort(compareBy('score'))
		.reverse()
		.slice(0, 100);

	tools.abortSignal?.throwIfAborted();

	if (!results?.length) {
		throw new Error("Le modèle de classification n'a retourné aucun résultat");
	}

	const confidences = results.map((r) => ({
		confidence: r.score,
		value: r.key,
	}));

	let { value, confidence } = confidences[0];
	let alternatives = [] as string[];

	if (taskSettings.output?.select) {
		const selector = ModelOutputEnum.get('select').assert(taskSettings.output.select);
		const selection = await selector?.evaluate({
			neurons: results,
		});

		console.debug(`Applied output.select to result of inference`, {
			selector: selector?.toJSON(),
			selection,
		});

		if (!selection) throw new Error("La sélection (output.select) n'a pas renvoyé de résultat");

		const [first, ...others] = selection.map((key) => {
			const result =
				results.find((result) => result.key === key) ??
				throwError(
					`La sélection (output.select) contient une clé d'option (key) inconnue: ${key}`
				);

			return {
				key,
				score: result.score,
			};
		});

		value = first.key;
		confidence = first.score;
		alternatives = others.map((result) => result.key);
	}

	await storeMetadataValue({
		db,
		abortSignal: tools.abortSignal,
		metadataId: metadataIds.target,
		subjectId: imageId,
		confidences,
		value,
		confidence,
		alternatives,
	});

	return { scores };
});

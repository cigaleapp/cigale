import type { DatabaseHandle } from './idb.svelte.js';
import type { NamespacedMetadataID } from './schemas/common.js';
import type { NeuralModelSelector } from './schemas/sessions.js';
import type * as DB from '$lib/database.js';
import type { PROCEDURES } from '$worker/procedures.js';
import type { SwarpcClient } from 'swarpc';

import * as ort from 'onnxruntime-web';

import { loadToTensor, output2BB, preprocessTensor } from './inference_utils.js';
import { accessBytes } from './storage/utils.js';
import { fetchHttpRequest, progressSplitter } from './utils.js';

/**
 * [x,y,w,h]
 */
type BB = [number, number, number, number];

/* 
ce fichier et le fichier utils associé (inference_utils.js) contiennent les fonctions pour effectuer les inférences de détection et de classification.
les fonctions sont les suivantes : 
    - loadModel : charge un modèle ONNX
    - infer : effectue une inférence de détection
    - inferSequentialy : effectue une inférence de détection une à une
    - classify : effectue une inférence de classification
    - postprocess_BBs : post traite les bounding boxes (évite les doublons)
    - imload : charge une liste d'images en tenseurs
    - output2BB : transforme le tensor de sortie du modèle de détection en bounding boxes
    - preprocess_for_classification : prétraite les images pour la classification (norm & resize)
    - applyBBsOnTensor : applique les bounding boxes sur un tensor
    - applyBBsOnTensors : applique les bounding boxes sur une liste de tensors
    - labelize : renvoie les labels des classes prédites

    voici un éxemple de pipeline qui pourrait être utilisée pour effectuer une inférence de détection et de classification :
        1. loadModel pour charger le modèle de détection
        2. infersequentialy pour effectuer l'inférence de détection
            on récupère ainsi : 
                - boundingboxes
                - bestScores
                - inputTensors
                - (optionnel) start (temps de départ de l'inférence)
        3. applyBBsOnTensors sur l'inpuTensors avec les boundingboxes utilisées 
        4. loadModel pour charger le modèle de classification
        5. classify pour effectuer l'inférence de classification
        6. labelize sur les indices des classes prédites pour obtenir les labels
        7. afficher les résultats (voir le fichier +page.svelt pour des exemples)

        PS : quand les models ne sont plus utiliser on peux les disposer avec model.release()
            de même avec les tensors : tensor.dispose()

PPS : 
il est thecniquement possible d'utiliser le webgpu, mais c'est pas encore implémenté, 
de plus ça se lance que sur chrome, avec la commande linux mettant les flags : 
 google-chrome-stable --enable-unsafe-webgpu --enable-features=Vulkan

*/

// nombre de threads pour wasm
ort.env.wasm.numThreads = 1;

ort.env.wasm.wasmPaths = {
	// @ts-expect-error nécéssaire sinon ça casse
	'ort-wasm-simd-threaded.wasm': '/ort-wasm-simd-threaded.wasm',
};

const TARGETWIDTH = 640; // taille de l'image d'entrée du modèle de détection
const TARGETHEIGHT = 640; // taille de l'image d'entrée du modèle de détection
const NUMCONF = 0.437; // seuil de confiance pour la détection
const STD = [0.229, 0.224, 0.225]; // valeurs de normalisation pour la classification
const MEAN = [0.485, 0.456, 0.406]; // valeurs de normalisation pour la classification

/**
 * @returns  ID of the inference session
 */
export async function loadModel({
	db,
	swarpc,
	selector,
	protocolId,
	metadataId,
	alreadyLoadedSessions = new Set(),
	/** called everytime the progress changes */
	onProgress,
	/** signal to abort the loading */
	abortSignal,
}: {
	protocolId: string;
	onProgress: (p: number) => void;
	abortSignal: AbortSignal;
	db: DatabaseHandle;
	swarpc: SwarpcClient<typeof PROCEDURES>;
	metadataId: NamespacedMetadataID;
	alreadyLoadedSessions: Set<string>;
	selector: (typeof NeuralModelSelector)['infer'];
}): Promise<string | undefined> {
	onProgress ??= () => {};
	const splitProgress = progressSplitter('model', 0.8, 'classmapping', 0.1, 'loading');
	const metadata = await db.get('Metadata', metadataId);
	if (!metadata) return;
	if (!metadata.infer) return;
	if (!('neural' in metadata.infer)) return;

	const task =
		metadata.type === 'boundingbox' ? ('detection' as const) : ('classification' as const);

	if (selector.kind === 'disabled') return;

	const config =
		selector.kind === 'protocol'
			? metadata.infer.neural[selector.i]
			: selector.kind === 'custom'
				? await db.get('CustomNeuralNetwork', selector.id)
				: undefined;

	if (!config) return;

	const id = inferenceModelId(protocolId, config);

	if (alreadyLoadedSessions.has(id)) return;

	const existingSession = await swarpc.inferenceSessionId.broadcast.once
		.orThrow(task)
		.catch((e) => {
			console.error(e);
			if (e instanceof AggregateError) {
				console.error('Aggregate error occurred:', e.errors);
			}
			throw new Error(`Failed to get existing inference session for task ${task}: ${e}`);
		});

	if (existingSession.every((loadedSession) => loadedSession === id)) {
		console.debug(`Model ${task} already loaded with ID ${id} on all nodes`);
		return id;
	}

	const model =
		'source' in config && config.source === 'local'
			? await accessBytes('CustomNeuralNetwork', config).then((buf) => new Uint8Array(buf))
			: await fetchHttpRequest('model' in config ? config.model : config.url, {
					signal: abortSignal,
					cacheAs: 'model',
					onProgress({ transferred, total }) {
						onProgress(splitProgress('model', transferred / total));
					},
				})
					.then((response) => response.arrayBuffer())
					.then((buffer) => new Uint8Array(buffer));

	/** @type {string | undefined} */
	let classmapping: string | undefined = undefined;
	if ('classmapping' in config && config.classmapping) {
		if (Array.isArray(config.classmapping)) {
			classmapping = config.classmapping.join('\n');
		} else {
			classmapping = await fetchHttpRequest(config.classmapping, {
				signal: abortSignal,
				cacheAs: 'model',
				onProgress({ transferred, total }) {
					onProgress(splitProgress('classmapping', transferred / total));
				},
			}).then((res) => res.text());
		}
	}

	const loaded = await swarpc.loadModel.broadcast.once.orThrow({
		task,
		model,
		classmapping,
		inferenceSessionId: id,
	});

	if (!loaded.every(Boolean)) {
		throw new Error(`Failed to load model for task ${task}`);
	}

	onProgress(splitProgress('loading', 1));

	return id;
}

export function inferenceModelId(
	protocolId: string,
	request: { model: DB.HTTPRequest } | { id: string }
): string {
	/** @type {Array<string|undefined>} */
	let components: Array<string | undefined> = [protocolId];

	if ('id' in request) {
		components = [...components, 'custom', request.id];
	} else {
		if (typeof request.model === 'string') {
			components = [...components, 'GET', request.model];
		} else {
			components = [
				...components,
				request.model.method,
				request.model.url,
				...Object.entries(request.model.headers ?? {})
					.sort(([a], [b]) => a.localeCompare(b))
					.map(([k, v]) => `${k}:${v}`),
			];
		}
	}

	return components.filter(Boolean).join('|');
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('inferenceModelId', () => {
		const id1 = inferenceModelId('protocol1', {
			model: 'http://example.com/model.onnx',
		});
		const id2 = inferenceModelId('protocol1', {
			model: {
				url: 'http://example.com/model.onnx',
				method: 'GET',
				headers: { Authorization: 'Bearer token' },
			},
		});
		const id3 = inferenceModelId('protocol1', {
			model: {
				url: 'http://example.com/model.onnx',
				method: 'GET',
				headers: { 'X-Custom-Header': 'value', Authorization: 'Bearer token' },
			},
		});
		const id4 = inferenceModelId('protocol2', {
			id: 'feur',
		});

		expect(id1).toBe('protocol1|GET|http://example.com/model.onnx');
		expect(id2).toBe('protocol1|GET|http://example.com/model.onnx|Authorization:Bearer token');
		expect(id3).toBe(
			'protocol1|GET|http://example.com/model.onnx|Authorization:Bearer token|X-Custom-Header:value'
		);
		expect(id4).toBe('protocol2|custom|feur');
	});
}

export function modelUrl(model: HTTPRequest): string {
	if (typeof model === 'string') return model;
	return model.url;
}

export async function infer(
	{
		abortSignal,
		...taskSettings
	}: {
		input: { width: number; height: number; name: string; normalized: boolean };
		output: { name: string; shape: ModelDetectionOutputShapes };
		abortSignal?: AbortSignal;
	},
	buffers: ArrayBuffer[],
	session: import('onnxruntime-web').InferenceSession,
	uiState: typeof import('./uistate.svelte.js').uiState,
	sequence: boolean = false,
	webgpu: boolean = true
): Promise<[BB[][], number[][], number, ort.Tensor]> {
	/*Effectue une inférence de détection sur une ou plusieurs images. 
    -------------inputs----------------
        files : liste de fichiers images
        model : modèle ONNX de détection
            in : [batch,3,640,640]
            out : [batch * 5 (x,y,w,h,conf) * 8400 (le nb de bouding boxes)]
                l'out est sous la forme [xxxxxx,yyyyyy,wwwwww,hhhhhh,confconfconf, (et recommence pr le prochain batch)]
        img_proceed : objet contenant les informations sur l'avancement de l'inférence
            forme : {state : "string", nb : int, time : float}
        sequence : booléen, si il est faux, alors on affiche les informations sur l'inférence,
            sinon, on pars du principe que le programme qui l'appel (inferSequentialy) s'occupe de l'affichage
        webgpu : booléen, si vrai, on utilise l'execution provider webgpu, sinon, on utilise wasm

    -------------outputs----------------
        boundingboxes : liste de bounding boxes 
            forme : [each image [each box [x,y,w,h]]]
        bestScores : liste des meilleurs scores pour chaque box 
            forme : [each image [each box score]]
        start : temps de départ de l'inférence
        inputTensor : tensor d'entrée de l'inférence 
            (pour pouvoir l'utiliser plus tard et pas avoir à load 35 fois les images)
    */

	if (webgpu) {
		console.warn('webgpu not implemented yet, using wasm');
	}
	if (!session) {
		throw new Error('Model not loaded');
	}
	let start = -1;
	if (!sequence) {
		start = Date.now();
	}

	const inputName = session.inputNames[0];
	const outputName = taskSettings?.output?.name ?? 'output0';

	taskSettings = {
		...taskSettings,
		input: {
			width: TARGETWIDTH,
			height: TARGETHEIGHT,
			name: inputName,
			normalized: true,
			...taskSettings?.input,
		},
		output: {
			name: outputName,
			...taskSettings?.output,
		},
	};

	const inputTensor = await loadToTensor(buffers, {
		...taskSettings.input,
		...(abortSignal ? { abortSignal } : {}),
	});

	// TODO figure out a way to use the abortSignal while running the inference
	const outputTensor = await session.run({ [inputName]: inputTensor });

	const bbs = output2BB(
		taskSettings.output.shape,
		outputTensor[outputName].data as Float32Array,
		buffers.length,
		NUMCONF,
		abortSignal
	);

	const [boundingboxes, bestScores] = bbs;
	if (!sequence && uiState) {
		uiState.processing.done = buffers.length;
		uiState.processing.time = (Date.now() - start) / 1000;
	}

	return [boundingboxes, bestScores, start, inputTensor];
}

/**
 * @returns  scores for each class
 */
export async function classify(
	settings: (typeof PROCEDURES.classify.input)['infer']['taskSettings'],
	image: ort.Tensor,
	model: ort.InferenceSession,
	abortSignal: AbortSignal
): Promise<number[]> {
	const inputName = settings.input.name ?? model.inputNames[0];

	const input = await preprocessTensor(settings, image, MEAN, STD, abortSignal);

	const output = await model.run({ [inputName]: input });

	abortSignal?.throwIfAborted();

	const scores = await output[Object.keys(output)[0]]
		.getData(true)
		.then((scores) => /** @type {number[]} */ [...scores.values()]);

	image.dispose();
	return scores;
}

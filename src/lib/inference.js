import * as ort from 'onnxruntime-web';

import { loadToTensor, output2BB, preprocessTensor } from './inference_utils.js';
import { fetchHttpRequest, progressSplitter } from './utils.js';

/**
 * @import { PROCEDURES } from '$worker/procedures.js';
 */

/**
 * @typedef {[number, number, number, number]} BB [x,y,w,h]
 */

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
// nécéssaire sinon ça casse

ort.env.wasm.wasmPaths = {
	// @ts-ignore
	'ort-wasm-simd-threaded.wasm': '/ort-wasm-simd-threaded.wasm'
};

export const TARGETWIDTH = 640; // taille de l'image d'entrée du modèle de détection
export const TARGETHEIGHT = 640; // taille de l'image d'entrée du modèle de détection
const NUMCONF = 0.437; // seuil de confiance pour la détection
const STD = [0.229, 0.224, 0.225]; // valeurs de normalisation pour la classification
const MEAN = [0.485, 0.456, 0.406]; // valeurs de normalisation pour la classification

/**
 *
 * @param {import('swarpc').SwarpcClient<typeof PROCEDURES>} swarpc
 * @param { 'classification' | 'detection' } task
 * @param {object} params
 * @param {string} params.protocolId
 * @param {object} params.requests
 * @param {typeof import('$lib/schemas/common').HTTPRequest.infer} params.requests.model
 * @param {typeof import('$lib/schemas/common').HTTPRequest.infer | undefined} params.requests.classmapping
 * @param {boolean} [params.webgpu]
 * @param {(p: number) => void} [params.onProgress] called everytime the progress changes
 * @param {AbortSignal} [params.abortSignal] signal to abort the loading
 * @returns {Promise<string>} ID of the inference session
 */
export async function loadModel(
	swarpc,
	task,
	{ protocolId, requests, webgpu = false, onProgress, abortSignal }
) {
	onProgress ??= () => {};
	const splitProgress = progressSplitter('model', 0.8, 'classmapping', 0.1, 'loading');

	const id = inferenceModelId(protocolId, requests.model);

	// TODO cancel previous calls once https://github.com/gwennlbh/swarpc/issues/126 is implemented
	const existingSession = await swarpc.inferenceSessionId.broadcast.orThrow(task).catch((e) => {
		console.error(e);
		throw new Error(`Failed to get existing inference session for task ${task}: ${e}`);
	});

	if (existingSession.every((loadedSession) => loadedSession === id)) {
		console.debug(`Model ${task} already loaded with ID ${id} on all nodes`);
		return id;
	}

	const model = await fetchHttpRequest(requests.model, {
		signal: abortSignal,
		cacheAs: 'model',
		onProgress({ transferred, total }) {
			onProgress(splitProgress('model', transferred / total));
		}
	})
		.then((response) => response.arrayBuffer())
		.then((buffer) => new Uint8Array(buffer));

	/** @type {string | undefined} */
	let classmapping = undefined;
	if (requests.classmapping) {
		classmapping = await fetchHttpRequest(requests.classmapping, {
			signal: abortSignal,
			cacheAs: 'model',
			onProgress({ transferred, total }) {
				onProgress(splitProgress('classmapping', transferred / total));
			}
		}).then((res) => res.text());
	}

	const loaded = await swarpc.loadModel.broadcast.once.orThrow({
		task,
		model,
		classmapping,
		webgpu,
		inferenceSessionId: id
	});

	if (!loaded.every(Boolean)) {
		throw new Error(`Failed to load model for task ${task}`);
	}

	onProgress(splitProgress('loading', 1));

	return id;
}

/**
 * @param {string} protocolId
 * @param {import('$lib/database.js').HTTPRequest} request
 * @returns {string}
 */
function inferenceModelId(protocolId, request) {
	/** @type {Array<string|undefined>} */
	let components = [protocolId];

	if (typeof request === 'string') {
		components = [...components, 'GET', request];
	} else {
		components = [
			...components,
			request.method,
			request.url,
			...Object.entries(request.headers ?? {})
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([k, v]) => `${k}:${v}`)
		];
	}

	return components.filter(Boolean).join('|');
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('inferenceModelId', () => {
		const id1 = inferenceModelId('protocol1', 'http://example.com/model.onnx');
		const id2 = inferenceModelId('protocol1', {
			url: 'http://example.com/model.onnx',
			method: 'GET',
			headers: { Authorization: 'Bearer token' }
		});
		const id3 = inferenceModelId('protocol1', {
			url: 'http://example.com/model.onnx',
			method: 'GET',
			headers: { 'X-Custom-Header': 'value', Authorization: 'Bearer token' }
		});

		expect(id1).toBe('protocol1|GET|http://example.com/model.onnx');
		expect(id2).toBe('protocol1|GET|http://example.com/model.onnx|Authorization:Bearer token');
		expect(id3).toBe(
			'protocol1|GET|http://example.com/model.onnx|Authorization:Bearer token|X-Custom-Header:value'
		);
	});
}

/**
 * @param {import('$lib/database').HTTPRequest} model
 * @returns {string}
 */
export function modelUrl(model) {
	if (typeof model === 'string') return model;
	return model.url;
}

/**
 *
 * @param {object} taskSettings
 * @param {object} taskSettings.input
 * @param {number} taskSettings.input.width
 * @param {number} taskSettings.input.height
 * @param {string} taskSettings.input.name
 * @param {boolean} taskSettings.input.normalized
 * @param {object} taskSettings.output
 * @param {string} taskSettings.output.name
 * @param {import('./database.js').ModelDetectionOutputShape} taskSettings.output.shape
 * @param {AbortSignal} [taskSettings.abortSignal]
 * @param {ArrayBuffer[]} buffers
 * @param {import('onnxruntime-web').InferenceSession} session
 * @param {typeof import('./state.svelte.js').uiState} [uiState]
 * @param {boolean} sequence
 * @param {boolean} webgpu
 * @returns {Promise<[BB[][], number[][], number, ort.Tensor[]]>}
 */
export async function infer(
	{ abortSignal, ...taskSettings },
	buffers,
	session,
	uiState,
	sequence = false,
	webgpu = true
) {
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

	taskSettings = {
		...taskSettings,
		input: {
			width: TARGETWIDTH,
			height: TARGETHEIGHT,
			name: session.inputNames[0],
			normalized: true,
			...taskSettings?.input
		},
		output: {
			name: 'output0',
			...taskSettings?.output
		}
	};
	let inputTensor;

	inputTensor = await loadToTensor(buffers, { ...taskSettings.input, abortSignal });

	// TODO figure out a way to use the abortSignal while running the inference
	const outputTensor = await session.run({ [taskSettings.input.name]: inputTensor });

	const bbs = output2BB(
		taskSettings.output.shape,
		/** @type {Float32Array} */ (outputTensor[taskSettings.output.name].data),
		buffers.length,
		NUMCONF,
		abortSignal
	);

	const [boundingboxes, bestScores] = bbs;
	if (!sequence && uiState) {
		uiState.processing.done = buffers.length;
		uiState.processing.time = (Date.now() - start) / 1000;
	}
	// @ts-ignore
	return [boundingboxes, bestScores, start, inputTensor];
}

/**
 *
 * @param {NonNullable<typeof import('$lib/schemas/metadata.js').MetadataInferOptionsNeural.infer['neural']>[number] } settings
 * @param {ort.Tensor} image
 * @param {import('onnxruntime-web').InferenceSession} model
 * @param {AbortSignal} [abortSignal]
 * @returns {Promise<number[]>} scores for each class
 */
export async function classify(settings, image, model, abortSignal) {
	const inputName = settings.input.name ?? model.inputNames[0];

	const input = await preprocessTensor(settings, image, MEAN, STD, abortSignal);

	const output = await model.run({ [inputName]: input });

	abortSignal?.throwIfAborted();

	const scores = await output[Object.keys(output)[0]]
		.getData(true)
		.then((scores) => /** @type {number[]} */ ([...scores.values()]));

	image.dispose();
	return scores;
}

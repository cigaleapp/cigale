import { match, type } from 'arktype';
import fetchProgress from 'fetch-progress';
import * as ort from 'onnxruntime-web';
import { tables } from './idb.svelte.js';
import { imload, output2BB, preprocess_for_classification } from './inference_utils.js';
import { MetadataInferOptionsNeural } from './schemas/metadata.js';

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
ort.env.wasm.numThreads = -1;
// nécéssaire sinon ça casse

ort.env.wasm.wasmPaths = {
	// @ts-ignore
	'ort-wasm-simd-threaded.wasm': '/ort-wasm-simd-threaded.wasm'
};

export const TARGETWIDTH = 640; // taille de l'image d'entrée du modèle de détection
export const TARGETHEIGHT = 640; // taille de l'image d'entrée du modèle de détection
export let MODELDETECTPATH = 'arthropod_detector_yolo11n_conf0.437.onnx'; // chemin du modèle de détection
export let MODELCLASSIFPATH = 'model_classif.onnx'; // chemin du modèle de classification
export const NUMCONF = 0.437; // seuil de confiance pour la détection
export const STD = [0.229, 0.224, 0.225]; // valeurs de normalisation pour la classification
export const MEAN = [0.485, 0.456, 0.406]; // valeurs de normalisation pour la classification
/**
 *
 * @param {string} path
 * @returns {string}
 */
export function torawpath(path) {
	return `https://cigaleapp.github.io/models/${path}`;
}

/**
 *
 * @param {import('./database.js').Protocol} protocol
 * @param {number} modelIndex index du modèle à utiliser dans la liste des modèles pour le protocole actuel
 */
export function classificationInferenceSettings(protocol, modelIndex) {
	const matcher = match
		.case(
			{
				id: type.string.narrow((id) => protocol.metadata.includes(id)),
				type: '"enum"',
				infer: MetadataInferOptionsNeural
			},
			(m) => m.infer.neural[modelIndex]
		)
		.default(() => undefined);

	return tables.Metadata.state
		.map((m) => matcher(m))
		.filter(Boolean)
		.at(0);
}

/**
 *
 * @param {import('./database.js').Protocol} protocol
 * @param {number} modelIndex index of the model to use in the list of models for the current protocol
 * @param { 'classification'|'detection' } task
 * @param {boolean} webgpu
 * @param {import('fetch-progress').FetchProgressInitOptions['onProgress']} [onProgress] called everytime the progress changes
 * @returns {Promise<import('onnxruntime-web').InferenceSession | undefined> }
 */
export async function loadModel(protocol, modelIndex, task, onProgress, webgpu = false) {
	// load un modèle ONNX, soit de classification, soit de détection.

	onProgress ??= () => {};

	const modelOptions = protocol.crop.infer?.[modelIndex];

	let modelUrl = '';

	/**
	 * @type {RequestInit}
	 */
	let requestOptions = {};

	if (task === 'detection') {
		switch (typeof modelOptions?.model) {
			case 'string': {
				modelUrl = modelOptions.model;
				break;
			}
			case 'object': {
				modelUrl = modelOptions.model.url;
				requestOptions = modelOptions.model;
				break;
			}
			default: {
				throw "Le modèle de détection n'est pas spécifié";
			}
		}
	} else {
		const settings = classificationInferenceSettings(protocol, modelIndex);
		switch (typeof settings?.model) {
			case 'string': {
				modelUrl = settings.model;
				break;
			}
			case 'object': {
				modelUrl = settings.model.url;
				requestOptions = settings.model;
				break;
			}
			default: {
				throw "Le modèle de détection n'est pas spécifié";
			}
		}
	}

	if (!modelUrl) {
		throw new Error('Model not found');
	}

	const model = await fetch(modelUrl, requestOptions)
		.then(fetchProgress({ onProgress }))
		.then((response) => response.arrayBuffer())
		.then((buffer) => new Uint8Array(buffer));

	return ort.InferenceSession.create(model, {
		executionProviders: webgpu ? ['webgpu'] : []
	});
}
/**
 *
 * @param {import('./database.js').Protocol} protocol
 * @param {number} modelIndex index of the model to use in the list of models for the current protocol
 * @param {'classification'|'detection'} task
 * @param {ArrayBuffer[]} buffers
 * @param {import('onnxruntime-web').InferenceSession} model
 * @param {typeof import('./state.svelte.js').uiState} [uiState]
 * @param {boolean} sequence
 * @param {boolean} webgpu
 * @returns {Promise<[BB[][], number[][], number, ort.Tensor[]]>}
 */
export async function infer(
	protocol,
	modelIndex,
	task,
	buffers,
	model,
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
		console.log('webgpu not implemented yet, using wasm');
	}
	if (!model) {
		throw new Error('Model not loaded');
	}
	let start = -1;
	if (!sequence) {
		start = Date.now();
		if (uiState) uiState.processing.state = 'inference';
	}
	let taskSettings =
		task === 'detection'
			? protocol.crop?.infer?.[modelIndex]
			: classificationInferenceSettings(protocol, modelIndex);

	taskSettings = {
		...taskSettings,
		input: {
			width: TARGETWIDTH,
			height: TARGETHEIGHT,
			name: model.inputNames[0],
			...taskSettings?.input
		},
		output: {
			name: 'output0',
			...taskSettings?.output
		}
	};
	let inputTensor;

	console.log('loading images...');
	inputTensor = await imload(buffers, taskSettings.input);

	console.log('inference...');
	const outputTensor = await model.run({ [taskSettings.input.name]: inputTensor });
	console.log('done !');
	console.log('output tensor: ', outputTensor);

	console.log('post proc...');
	const bbs = output2BB(
		protocol,
		modelIndex,
		/** @type {Float32Array} */ (outputTensor[taskSettings.output.name].data),
		buffers.length,
		NUMCONF
	);
	console.log('done !');
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
 * @param {import('./database.js').Protocol} protocol
 * @param {number} modelIndex index of the model to use in the list of models for the current protocol
 * @param {ArrayBuffer[]} buffers
 * @param {import('onnxruntime-web').InferenceSession} model
 * @param {typeof import('./state.svelte.js').uiState} [uiState]
 * @returns {Promise<[BB[][], number[][], number, ort.Tensor[][]]>}
 */
export async function inferSequentialy(protocol, modelIndex, buffers, model, uiState) {
	/*Effectue une inférence de détection sur une ou plusieurs images.
    Cette fonction est similaire à infer, mais permet l'inférence une à une 
    et affiche les informations sur l'avancement de l'inférence
    au fur et à mesure.
    */

	if (!model) {
		throw new Error('Model not loaded');
	}

	let boundingboxes = [];
	let bestScores = [];
	let start = Date.now();
	let inputTensors = [];

	for (let i = 0; i < buffers.length; i++) {
		let imfile = buffers[i];
		var BandB = await infer(protocol, modelIndex, 'detection', [imfile], model, uiState, false);
		console.log({ BandB });
		let boundingboxe = BandB[0];
		let bestScore = BandB[1];
		let inputTensor = BandB[3];
		// @ts-ignore
		boundingboxes.push(boundingboxe[0]);
		// @ts-ignore
		bestScores.push(bestScore[0]);
		inputTensors.push(inputTensor);

		if (uiState) {
			uiState.processing.done = i + 1;
			uiState.processing.time = (Date.now() - start) / 1000;
		}
	}
	return [boundingboxes, bestScores, start, inputTensors];
}

/**
 *
 * @param {NonNullable<typeof import('$lib/schemas/metadata.js').MetadataInferOptionsNeural.infer['neural']>[number] } settings
 * @param {ort.Tensor[][]} images
 * @param {import('onnxruntime-web').InferenceSession} model
 * @param {typeof import('./state.svelte.js').uiState} uiState
 * @param {number} start
 * @returns {Promise<Array<Array<number[]>>>} scores pour chaque tensor de chaque image: [each image [each tensor [score classe 0, score classe 1, …]]]
 */
export async function classify(settings, images, model, uiState, start) {
	/*Effectue une inférence de classification sur une ou plusieurs images.
    -------------inputs----------------
        images : liste d'images prétraitées
            forme : [each image [each tensor]]
            enfaite, le plus interessant est limite d'utiliser *presque* directement les images de l'inférence de détection
            (le presque c'est parce qu'il faut d'abord faire un crop des tenseur de détection (cf apply BBsOnTensor dans utils) )
        model : model onnx de classif 
            in: [batch,3,224,224]
            out: [batch*n_classes]
            dans ce code, qui est opti pour un cpu, batch = 1.
        img_proceed : objet contenant les informations sur l'avancement de l'inférence
        start : temps de départ de l'inférence

    -------------outputs----------------
        argmaxs : liste des indices des classes prédites
            forme : [each image [each class index]]
        bestScores : liste des meilleurs scores pour chaque classe
            forme : [each image [each class
    */

	uiState.processing.done = 0;

	const inputName = settings.input.name ?? model.inputNames[0];

	/** @type {number[][][]}  */
	const scores = [];
	uiState.processing.state = 'preprocessing';
	// @ts-ignore
	images = await preprocess_for_classification(settings, images, MEAN, STD);
	uiState.processing.state = 'classification';
	console.log(images);

	for (let i = 0; i < images.length; i++) {
		/** @type {number[][]}  */
		const imageScores = [];
		for (let j = 0; j < images[i].length; j++) {
			let inputTensor = images[i][j];
			const outputTensor = await model.run({ [inputName]: inputTensor });

			console.log('outputs', Object.keys(outputTensor));

			imageScores.push(
				await outputTensor[Object.keys(outputTensor)[0]]
					.getData(true)
					.then((scores) => /** @type {number[]} */ ([...scores.values()]))
			);

			images[i][j].dispose();
			uiState.processing.time = (Date.now() - start) / 1000;
		}

		scores.push(imageScores);
		uiState.processing.done = i + 1;
	}

	return scores;
}

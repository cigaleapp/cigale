import * as ort from 'onnxruntime-web';
import {
	postprocess_BB,
	imload,
	output2BB,
	preprocess_for_classification
} from './inference_utils.js';

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
    - loadClassMapping : charge le mapping des classes

    voici un éxemple de pipeline qui pourrait être utilisée pour effectuer une inférence de détection et de classification :
        0. loadClassMapping & récupérer les fichiers contenant les images
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
export const NMS = true;
/**
 *
 * @param {string} path
 * @returns {string}
 */
export function torawpath(path) {
	// TODO host on IRIT infrastructure?
	return `https://cigaleapp.github.io/models/${path}`;
}
/**
 *
 * @param {boolean} classif
 * @param {boolean} webgpu
 * @returns {Promise<import('onnxruntime-web').InferenceSession | undefined> }
 */
export async function loadModel(classif = false, webgpu = false) {
	// load un modèle ONNX, soit de classification, soit de détection.

	let model;
	const MODELPATH = torawpath(classif ? MODELCLASSIFPATH : MODELDETECTPATH);
	console.log('model path : ', MODELPATH);
	if (webgpu) {
		model = await ort.InferenceSession.create(MODELPATH, { executionProviders: ['webgpu'] });
	} else {
		model = await ort.InferenceSession.create(MODELPATH);
		console.log('model loaded');
	}
	return model;
}
/**
 *
 * @param {ArrayBuffer[]} buffers
 * @param {import('onnxruntime-web').InferenceSession} model
 * @param {typeof import('./state.svelte.js').uiState} [uiState]
 * @param {boolean} sequence
 * @param {boolean} webgpu
 * @returns {Promise<[BB[][], number[][], number, ort.Tensor[]]>}
 */
export async function infer(buffers, model, uiState, sequence = false, webgpu = true) {
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

	// [!] le modèle de détection renvoie [x,y,w,h,conf] mais (x,y) correspond au centre de la bounding box
	if (webgpu) {
		console.log('webgpu not implemented yet, using wasm');
	}
	let start = -1;
	if (!sequence) {
		start = Date.now();
		if (uiState) uiState.processing.state = 'inference';
	}
	const inputName = model.inputNames[0];
	let inputTensor;

	console.log('loading images...');
	inputTensor = await imload(buffers, TARGETWIDTH, TARGETHEIGHT);

	console.log('inference...');
	const outputTensor = await model.run({ [inputName]: inputTensor });
	console.log('done !');
	console.log('output tensor: ', outputTensor);

	console.log('post proc...');
	// @ts-ignore
	const bbs = output2BB(outputTensor.output0.data, buffers.length, NUMCONF, NMS);
	console.log('done !');
	const bestScores = bbs[1];
	const bestBoxes = bbs[0];

	let boundingboxes = [];
	if (!NMS) {
		boundingboxes = postprocess_BB(bestBoxes, buffers.length);
	} else {
		boundingboxes = bestBoxes;
	}
	if (!sequence && uiState) {
		uiState.processing.done = buffers.length;
		uiState.processing.time = (Date.now() - start) / 1000;
	}
	// @ts-ignore
	return [boundingboxes, bestScores, start, inputTensor];
}

/**
 *
 * @param {FileList} files
 * @param {import('onnxruntime-web').InferenceSession} model
 * @param {number} i
 * @param {typeof import('./state.svelte.js').uiState} img_proceed
 * @returns {Promise<[BB[], number[], ort.Tensor[]]>}
 */
async function mapToFiles(files, model, i, img_proceed) {
	let imfile = files[i];
	// @ts-ignore
	var BandB = await infer([imfile], model, img_proceed, false);
	let boundingboxe = BandB[0];
	let bestScore = BandB[1];
	let inputTensor = BandB[3];
	return [boundingboxe[0], bestScore[0], inputTensor];
}

/**
 *
 * @param {ArrayBuffer[]} buffers
 * @param {import('onnxruntime-web').InferenceSession} model
 * @param {typeof import('./state.svelte.js').uiState} [uiState]
 * @returns {Promise<[BB[][], number[][], number, ort.Tensor[][]]>}
 */
export async function inferSequentialy(buffers, model, uiState) {
	/*Effectue une inférence de détection sur une ou plusieurs images.
    Cette fonction est similaire à infer, mais permet l'inférence une à une 
    et affiche les informations sur l'avancement de l'inférence
    au fur et à mesure.
    */

	let boundingboxes = [];
	let bestScores = [];
	let start = Date.now();
	let inputTensors = [];

	for (let i = 0; i < buffers.length; i++) {
		let imfile = buffers[i];
		// @ts-ignore
		var BandB = await infer([imfile], model, uiState, false);
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
 * @param {FileList} files
 * @param {import('onnxruntime-web').InferenceSession} model
 * @param {typeof import('./state.svelte.js').uiState} uiState
 * @returns {Promise<[BB[][], number[][], number, ort.Tensor[][]]>}
 */
export async function inferSequentialyConcurrent(files, model, uiState) {
	/*Effectue une inférence de détection sur une ou plusieurs images de manière 
    concurentielle. 
    */

	let boundingboxes = [];
	let bestScores = [];
	let start = Date.now();
	let inputTensors = [];

	let promises = [];
	for (let i = 0; i < files.length; i++) {
		promises.push(mapToFiles(files, model, i, uiState));
	}

	let results = await Promise.all(promises);
	for (let i = 0; i < results.length; i++) {
		boundingboxes.push(results[i][0]);
		bestScores.push(results[i][1]);
		inputTensors.push(results[i][2]);

		uiState.processing.done = i + 1;
		uiState.processing.time = (Date.now() - start) / 1000;
	}
	return [boundingboxes, bestScores, start, inputTensors];
}
/**
 *
 * @param {ort.Tensor[][]} images
 * @param {import('onnxruntime-web').InferenceSession} model
 * @param {typeof import('./state.svelte.js').uiState} uiState
 * @param {number} start
 * @returns {Promise<[number[][], (string | number | bigint)[][]]>}
 */
export async function classify(images, model, uiState, start) {
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

	const inputName = model.inputNames[0];

	let argmaxs = [];
	let bestScores = [];
	uiState.processing.state = 'preprocessing';
	// @ts-ignore
	images = await preprocess_for_classification(images, MEAN, STD);
	uiState.processing.state = 'classification';
	console.log('coucou');
	console.log(images);

	for (let i = 0; i < images.length; i++) {
		console.log("feur c'est pour gwenn");
		let argmax = [];
		let bestScore = [];
		for (let j = 0; j < images[i].length; j++) {
			let inputTensor = images[i][j];
			const outputTensor = await model.run({ [inputName]: inputTensor });
			// @ts-ignore
			let argmax_ = outputTensor.output.data.indexOf(Math.max(...outputTensor.output.data));
			let bestScore_ = outputTensor.output.data[argmax_];
			argmax.push(argmax_);
			bestScore.push(bestScore_);

			outputTensor.output.dispose();
			images[i][j].dispose();
			uiState.processing.time = (Date.now() - start) / 1000;
		}
		argmaxs.push(argmax);
		bestScores.push(bestScore);

		uiState.processing.done = i + 1;
	}

	return [argmaxs, bestScores];
}

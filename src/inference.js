import { onMount } from 'svelte';
import * as ort from 'onnxruntime-web';
import * as Jimp from 'jimp';
import { postprocess_BB, imload , output2BB} from './inference_utils.js';


ort.env.wasm.wasmPaths = {
    'ort-wasm-simd-threaded.wasm': '/ort-wasm-simd-threaded.wasm'
};

export const TARGETWIDTH = 640;
export const TARGETHEIGHT = 640;
export const MODELPATH = '/arthropod_dectector_wave21_best.onnx';
export const NUMCONF = 0.5;

export async function loadModel() {
    let model;
    try {
        model = await ort.InferenceSession.create(MODELPATH);
        console.log('ONNX Model loaded successfully.');
    } catch (err) {
        console.error('Failed to load ONNX model:', err);
    }
    return model;

}
export async function infer (files,model,img_proceed,sequence= false) {
    let start = -1
    if (!sequence) {
        start = Date.now();
        img_proceed.state = "inference";
    }
    const inputName = model.inputNames[0];

    const inputTensor = await imload(files, TARGETWIDTH, TARGETHEIGHT);
    console.log("inference...")
    const outputTensor = await model.run({ [inputName]: inputTensor });
    console.log("done !")

    console.log("post proc...")
    const bbs = output2BB(outputTensor.output0.data,files.length,NUMCONF);
    console.log("done !");
    const bestScores = bbs[1];
    const bestBoxes = bbs[0];

    const boundingboxes = postprocess_BB(bestBoxes,files.length);
    if (!sequence) {
        img_proceed.nb = files.length;
        img_proceed.time = (Date.now()-start)/1000;
    }

    return [boundingboxes, bestScores,start];
}

export async function inferSequentialy (files,model,img_proceed) {

    let boundingboxes = [];
    let bestScores = [];
    let start = Date.now();
    for (let i=0; i<files.length; i++) {
        let imfile = files[i];
        var BandB = await infer([imfile],model, null,true);
        let boundingboxe = BandB[0];
        let bestScore = BandB[1];

        boundingboxes.push(boundingboxe[0]);
        bestScores.push(bestScore[0]);
        img_proceed.nb = i+1;
        img_proceed.time = (Date.now()-start)/1000;
    }
    return [boundingboxes, bestScores,start];

}



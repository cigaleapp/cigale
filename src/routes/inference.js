import { onMount } from 'svelte';
import * as ort from 'onnxruntime-web';
import * as Jimp from 'jimp';
import { postprocess_BB, imload , output2BB,preprocess_for_classification} from './inference_utils.js';
import { input } from '@tensorflow/tfjs';

//ort.env.wasm.proxy = true;
ort.env.wasm.numThreads = 4;
ort.env.wasm.wasmPaths = {
    'ort-wasm-simd-threaded.wasm': '/ort-wasm-simd-threaded.wasm'
};

export const TARGETWIDTH = 640;
export const TARGETHEIGHT = 640;
export const MODELDETECTPATH = '/arthropod_detector_yolo11n_conf0.437.onnx';
export const MODELCLASSIFPATH = '/model_classif.onnx';
export const NUMCONF = 0.437;
export const STD= [0.229, 0.224, 0.225];
export const MEAN = [0.485, 0.456, 0.406];


export async function loadModel(classif = false) {
    let model;
    let MODELPATH = MODELDETECTPATH;
    if (classif) {
        MODELPATH = MODELCLASSIFPATH;
    }
    

    try {
        model = await ort.InferenceSession.create(MODELPATH);
        console.log('ONNX Model loaded successfully.');
    } catch (err) {
        console.error('Failed to load ONNX model:', err);
    }
    return model;

}
export async function infer (files,model,img_proceed,sequence=false) {
    let start = -1
    if (!sequence) {
        start = Date.now();
        img_proceed.state = "inference";
    }
    const inputName = model.inputNames[0];
    let inputTensor;

    console.log("loading images...")
    inputTensor = await imload(files, TARGETWIDTH, TARGETHEIGHT);

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


    return [boundingboxes, bestScores,start, inputTensor];
}

export async function inferSequentialy (files,model,img_proceed) {

    let boundingboxes = [];
    let bestScores = [];
    let start = Date.now();
    let inputTensors = [];

    for (let i=0; i<files.length; i++) {
        let imfile = files[i];
        var BandB = await infer([imfile],model, img_proceed,false);
        let boundingboxe = BandB[0];
        let bestScore = BandB[1];
        let inputTensor = BandB[3];

        boundingboxes.push(boundingboxe[0]);
        bestScores.push(bestScore[0]);
        inputTensors.push(inputTensor);

        img_proceed.nb = i+1;
        img_proceed.time = (Date.now()-start)/1000;
    }
    model.release();
    return [boundingboxes, bestScores,start, inputTensors];

}

export async function classify (images, model,img_proceed,start) {
    img_proceed.state = "classification";
    img_proceed.nb = 0;

    const inputName = model.inputNames[0];

    let argmaxs = [];
    let bestScores = [];
    images = await preprocess_for_classification(images,MEAN,STD);

    for (let i=0; i<images.length; i++) {
        let outputTensors = [];
        let argmax = [];
        let bestScore = [];
        for (let j=0; j<images[i].length; j++) {
            let inputTensor = images[i][j];
            const outputTensor = await model.run({ [inputName]: inputTensor });
            console.log(outputTensor)

            let argmax_ = outputTensor.output.data.indexOf(Math.max(...outputTensor.output.data));
            let bestScore_ = outputTensor.output.data[argmax_];
            argmax.push(argmax_);
            bestScore.push(bestScore_);

            outputTensor.output.dispose();
            images[i][j].dispose();
            img_proceed.time = (Date.now()-start)/1000;
        }
        argmaxs.push(argmax);
        bestScores.push(bestScore);

        img_proceed.nb = i+1;
        
    }  
    model.release();

    return [argmaxs, bestScores];
}



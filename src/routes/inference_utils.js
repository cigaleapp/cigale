import { onMount } from 'svelte';
import * as ort from 'onnxruntime-web';
import * as Jimp from 'jimp';
import { sub } from '@tensorflow/tfjs';

function IoU(bb1, bb2) {
    let x1 = Math.max(bb1[0], bb2[0]);
    let y1 = Math.max(bb1[1], bb2[1]);
    let x2 = Math.min(bb1[0] + bb1[2], bb2[0] + bb2[2]);
    let y2 = Math.min(bb1[1] + bb1[3], bb2[1] + bb2[3]);

    let intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    let union = bb1[2] * bb1[3] + bb2[2] * bb2[3] - intersection;

    return intersection / union;
}

export function postprocess_BB(boundingboxes,numfiles) {
    let numbb = boundingboxes.length/numfiles;
    let subbb = null;
    for (let k=0; k< numfiles; k++) {
        for (let i = 0; i < boundingboxes[k].length; i++) {
            let x1 = boundingboxes[k][i][0];
            let y1 = boundingboxes[k][i][1];
            let w = boundingboxes[k][i][2];
            let h = boundingboxes[k][i][3];

            for (let j = i; j < boundingboxes[k].length; j++) {
                if (i != j) {
                    let x2 = boundingboxes[k][j][0];
                    let y2 = boundingboxes[k][j][1];
                    let w2 = boundingboxes[k][j][2];
                    let h2 = boundingboxes[k][j][3];

                    if (IoU([x1, y1, w, h], [x2, y2, w2, h2]) > 0.5) {
                        boundingboxes[k].splice(j, 1);
                        j--;
                    }
                }
            }
        }
    }
    return boundingboxes;
}

export async function imload(files, targetWidth, targetHeight) {
    const float32Data = new Float32Array(targetHeight * targetWidth * 3 * files.length);
    for (let f = 0; f < files.length; f++) {
        let file = files[f];

        var img_tensor = await Jimp.Jimp.read(await file.arrayBuffer());
        img_tensor.resize({ w: targetWidth, h: targetHeight });

        var imageBufferData = img_tensor.bitmap.data;

        const [redArray, greenArray, blueArray] = new Array(new Array(), new Array(), new Array());
        for (let i = 0; i < imageBufferData.length; i += 4) {
            redArray.push(imageBufferData[i]);
            greenArray.push(imageBufferData[i + 1]);
            blueArray.push(imageBufferData[i + 2]);
        }

        const transposedData = redArray.concat(greenArray).concat(blueArray);
        let i,
            l = transposedData.length;

        for (i = 0; i < l; i++) {
            float32Data[f * l + i] = transposedData[i] / 255.0; // convert to float
        }
    }

    console.log('done !');
    var tensor = new ort.Tensor('float32', float32Data, [
        files.length,
        3,
        targetHeight,
        targetWidth
    ]);
    return tensor;
}



export function output2BB (output,numImages,minConfidence) {
    console.log("output : ",output);
    let bestBoxes = [];
    let bestPerImageBoxes = [];
    let bestScore = [];
    let bestScorePerImage = 0;
    let suboutput = null;
    let numbb = (output.length/numImages)/5;

    for (let k=0;k<numImages; k++){
        bestPerImageBoxes= [];
        bestScorePerImage = 0;
        suboutput = output.slice(k*numbb*5,(k+1)*numbb*5);

        for (let i=0;i<suboutput.length/5;i++) {

            let conf = suboutput[i+4*numbb];
            if (conf > bestScorePerImage) {
                bestScorePerImage = conf;
            }
 
            
            if (conf > minConfidence) {
                let x = suboutput[i];
                let y = suboutput[i + numbb];
                let w = suboutput[i + 2*numbb];
                let h = suboutput[i+ 3*numbb];

                x = x - w / 2;
				y = y - h / 2;

                bestPerImageBoxes.push([x, y, w, h]);
            }
        }
        bestBoxes.push(bestPerImageBoxes);
        bestScore.push(bestScorePerImage);
    }
    return [bestBoxes,bestScore];
        
}

async function applyBBsOnImage (BBs, image,marge=10) {
    let subimages = [];
    for (let i = 0; i < BBs.length; i++) {
        let x = BBs[i][0];
        let y = BBs[i][1];
        let w = BBs[i][2];
        let h = BBs[i][3];

        // relative bbs 
        x = (x/640)*image.bitmap.width;
        y = (y/640)*image.bitmap.height;
        w = (w/640)*image.bitmap.width;
        h = (h/640)*image.bitmap.height;
        x = x - marge;
        y = y -marge
        w = w + 2*marge;
        h = h + 2*marge;

        x = Math.round(Math.max(0, x));
        y = Math.round(Math.max(0, y));
        w = Math.round(Math.min(image.bitmap.width - x, w));
        h = Math.round(Math.min(image.bitmap.height - y, h));


        let subimage = image.clone();
        subimage = subimage.crop({x, y, w, h});
        subimage = await subimage.getBase64(Jimp.JimpMime.png);
        subimages.push(subimage);   
    }
    return subimages;
}

export async function applyBBsOnImages (BBs, images) {
    let croppedImages = [];
    let subImages = [];

    for (let i = 0; i < images.length; i++) {
        subImages = await applyBBsOnImage(BBs[i], images[i]);
        croppedImages.push(subImages);
    }
    return croppedImages;
}

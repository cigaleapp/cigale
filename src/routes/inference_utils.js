import * as ort from 'onnxruntime-web';
import * as Jimp from 'jimp';

function IoU(bb1, bb2) {
    let x1 = Math.max(bb1[0], bb2[0]);
    let y1 = Math.max(bb1[1], bb2[1]);
    let x2 = Math.min(bb1[0] + bb1[2], bb2[0] + bb2[2]);
    let y2 = Math.min(bb1[1] + bb1[3], bb2[1] + bb2[3]);

    let intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    let union = bb1[2] * bb1[3] + bb2[2] * bb2[3] - intersection;

    return intersection / union;
}

export async function cropTensor (tensor, x1, y1, x2, y2) {
    let data = await tensor.getData();
    let dims = tensor.dims;

    let newDims = [1, dims[1], y2 - y1, x2 - x1]; // NCHW
    let newData = new Float32Array(1 * newDims[1] * newDims[2] * newDims[3]);

    for (let x = x1; x < x2; x++) {
        for (let y = y1; y<y2; y++) {
            for (let c = 0; c<dims[1]; c++) {
                //   --- /!\ si ça marche pas, faut ptet inverser x et y--- 
                let i = c * dims[2] * dims[3] + y* dims[3] + x;
                let newI = c * newDims[2] * newDims[3] + (y-y1) * newDims[3] + (x-x1);
                newData[newI] = data[i];
            }   
        }
    }
    return new ort.Tensor(tensor.type, newData, newDims);
}

export async function applyBBsOnTensor (BBs,tensor,marge=10) {
    let croppedTensors = [];
    for (let i = 0; i < BBs.length; i++) {
        let x = BBs[i][0];
        let y = BBs[i][1];
        let w = BBs[i][2];
        let h = BBs[i][3];

        let tsrwidth = tensor.dims[3];
        let tsrheight = tensor.dims[2];

        x = x - marge;
        y = y -marge
        w = w + 2*marge;
        h = h + 2*marge;

        x = Math.max(0, x);
        y = Math.max(0, y);
        w = Math.min(tsrwidth - x, w);
        h = Math.min(tsrheight - y, h);
        

        x = Math.round(x);
        y = Math.round(y);
        w = Math.round(w);
        h = Math.round(h);

        let croppedTensor = await cropTensor(tensor, x, y, x + w, y + h);
        croppedTensors.push(croppedTensor);
    }
    return croppedTensors;
}

export async function applyBBsOnTensors (BBs,tensors) {
    let croppedTensors = [];
    for (let i = 0; i < tensors.length; i++) {
        let croppedTensor = await applyBBsOnTensor( BBs[i],tensors[i]);
        croppedTensors.push(croppedTensor);
    }
    return croppedTensors;
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

export async function preprocess_for_classification(tensors,mean, std) {
    let new_ctensors = [];
    for (let i=0;i<tensors.length;i++) {
        let c = tensors[i];
        c = await normalizeTensors(c, mean,std);
        c = await resizeTensors(c, 224,224);
        new_ctensors.push(c);
    }
    return new_ctensors;
}

export async function loadClassMapping(classmapping) {
    const response = await fetch(classmapping);
    const text = await response.text();
    classmap = text.split('\n');
    return classmap;
}

export function labelize (output,classmap) {
    let labels_inter = [];
    for (let i=0;i<output[0].length;i++) {
        let l = [];
        for (let j=0; j<output[0][i].length; j++) {
            let index = output[0][i][j];
            l.push(classmap[index]);
        }
        labels_inter.push(l)
    }
    return [labels_inter,output[1]];
}

export async function imload(files, targetWidth, targetHeight) {
    var float32Data = new Float32Array(targetHeight * targetWidth * 3 * files.length);
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
    float32Data = new Float32Array(0);
    return tensor;
}
  

export async function normalizeTensor (tensor, mean, std,) {
    const data = await tensor.getData();
    const dims = tensor.dims;

    for (let x = 0; x<dims[2]; x++) {
        for (let y=0; y<dims[3]; y++) {
            for (let c=0; c<dims[1]; c++) {
                let i = c*dims[2]*dims[3] + x*dims[3] + y;
                data[i] = (data[i] - mean[c]) / std[c];
            }
        }
    }
    const newTensor = new ort.Tensor(tensor.type, data, dims);
    return newTensor;
}

export async function normalizeTensors (tensors, mean, std) {
    let newTensors = [];
    for (let i=0; i<tensors.length; i++) {
        let newtsr = await normalizeTensor(tensors[i], mean, std);
        newTensors.push(newtsr);
    }

    for (let i=0; i<tensors.length; i++) {
        tensors[i].dispose();
    }

    return newTensors;

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

export async function resizeTensors(tensors, targetWidth, targetHeight) {
    let resizedTensors = [];
    for (let i = 0; i < tensors.length; i++) {
        let resizedTensor = await resizeTensor(tensors[i], targetWidth, targetHeight);
        resizedTensors.push(resizedTensor);
    }

    for (let i = 0; i < tensors.length; i++) {
        tensors[i].dispose();
    }

    return resizedTensors;
}

async function resizeTensor(tensor, targetWidth, targetHeight) {
    // resize using nearest neighbor interpolation
    const data = await tensor.getData();
    const dims = tensor.dims;

    const resizedData = new Float32Array(targetHeight * targetWidth * 3);
    const resizedDims = [1, 3, targetHeight, targetWidth];

    const widthRatio = dims[3] / targetWidth;
    const heightRatio = dims[2] / targetHeight;

    for (let x = 0; x < targetWidth; x++) {
        for (let y = 0; y < targetHeight; y++) {
            for (let c = 0; c < 3; c++) {
                const i = c * targetHeight * targetWidth + y * targetWidth + x;
                const j = c * dims[2] * dims[3] + Math.floor(y * heightRatio) * dims[3] + Math.floor(x * widthRatio);
                resizedData[i] = data[j];
            }
        }
    }

    const resizedTensor = new ort.Tensor(tensor.type, resizedData, resizedDims);
    return resizedTensor;
}

async function applyBBsOnImage (BBs, image,marge=10) {
    let subimages = [];
    let subimageMIMES = [];
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
        let subimageMIME = await subimage.getBase64(Jimp.JimpMime.png);
        subimages.push(subimage);   
        subimageMIMES.push(subimageMIME);
    }
    return [subimageMIMES, subimages];
}

export async function applyBBsOnImages (BBs, images) {
    let croppedImages = [];
    let croppedImagesMIME = [];
    let subImages = [];
    let subImagesMIME = [];

    for (let i = 0; i < images.length; i++) {
        subImages = await applyBBsOnImage(BBs[i], images[i]);
        croppedImages.push(subImages[1]);
        croppedImagesMIME.push(subImages[0]);

    }
    //return [croppedImagesMIME,croppedImages];
    return [croppedImagesMIME];
}

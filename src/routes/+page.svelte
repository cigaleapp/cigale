<script>
	import * as Jimp from 'jimp';

	import {infer,loadModel, inferSequentialy,STD,MEAN, classify} from "./inference.js"
	import {applyBBsOnImages,imload, normalizeTensors, applyBBsOnTensors, resizeTensors} from "./inference_utils.js"
	import {img_proceed} from './state.svelte.js';

	//ort.env.wasm.wasmPaths = 'https://unpkg.com/onnxruntime-web@dev/dist/';

	// Reactive state variables.
	let image_file; // Holds the selected file(s) from the input.
	let processed_canvas; // The off-screen canvas showing the resized/preprocessed image.
	let crop_canvas; // The canvas containing the cropped insect.
	let processedContainer; // Container DOM element for the preprocessed canvas.
	let cropContainer; // Container DOM element for the cropped image.
	export let croppedImagesURL = [];
	let model = null;
	export let labels = [];
	let label_table = [];
	let classmapping = "/class_mapping.txt";
	let classmap = [];
	export let conf = [];

	// Load the class mapping file.
	async function loadClassMapping() {
		const response = await fetch(classmapping);
		const text = await response.text();
		classmap = text.split('\n');
	}

	async function processImage() {
		img_proceed.nb = 0;
		img_proceed.time = 0;
		img_proceed.state= "loading"

		if (image_file && image_file.length > 0) {
			let files = Array.from(image_file);
			if (!model) {model = await loadModel();}
			
			// 1. Ask the user to load the image: get the first file.
			const file = image_file[0];
			const img = await createImageBitmap(file);

			// 2. Load and preprocess the image using an off-screen canvas.
			const targetWidth = 640;
			const targetHeight = 640;

			const canvas = document.createElement('canvas');
			canvas.width = targetWidth;
			canvas.height = targetHeight;

			const ctx = canvas.getContext('2d');
			ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

			processed_canvas = canvas;

			// Extract pixel data from the canvas.
			const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
			img_proceed.state= "inference"
			ctx.putImageData(imageData, 0, 0);
			
			//var BsandBs = await infer(image_file,model, img_proceed);

			var BsandBs = await inferSequentialy(image_file,model, img_proceed);

			let boundingboxes = BsandBs[0];
			let bestScores = BsandBs[1];
			let start = BsandBs[2];
			let inputTensors = BsandBs[3];
			//console.log('inputTensors before: ', await  inputTensors[0].getData());
			//inputTensors = await normalizeTensors(inputTensors, [0.5,0.5,0.5],[0.5,0.5,0.5]);
			//console.log('inputTensors after: ',  await inputTensors[0].getData());

			let best_boxes = boundingboxes[0];
			let bestScore = bestScores[0];

			console.log('Best boxes : ', best_boxes);
			console.log("best score : ", bestScore);

			img_proceed.nb = 0;
			img_proceed.state= "post processing"
			for (let i = 0; i < best_boxes.length; i++) {
				ctx.strokeStyle = 'red';
				ctx.lineWidth = 2;
				ctx.strokeRect(best_boxes[i][0], best_boxes[i][1], best_boxes[i][2], best_boxes[i][3]);
			}

			
			
			
			img_proceed.state= "finished"
			let ctensors = await applyBBsOnTensors( boundingboxes, inputTensors);
			

			// initialisation des labels : 
			labels = [];
			conf = []
			for (let i=0;i<ctensors.length;i++) {
				let l = [];
				let c = [];
				for (let j=0; j<ctensors[i].length; j++) {
					l.push("un sect (je crois j'ai pas compris)");
					c.push(0);
				}
				labels.push(l);
				conf.push(c);
			}

			// ça c'est la partie affichage 
			let croppedImagesURL_buffer = [];
			for (let i=0;i<ctensors.length;i++) {
				let croppedImagesURL_inter = [];
				let c = ctensors[i];
				for (let j=0; j<c.length; j++) {
					let img = c[j].toDataURL();
					croppedImagesURL_inter.push(img);
				}
				croppedImagesURL_buffer.push(croppedImagesURL_inter);
			}
			croppedImagesURL = croppedImagesURL_buffer;

			// normalisation des images pr le resnet
			let new_ctensors = [];
			for (let i=0;i<ctensors.length;i++) {
				let c = ctensors[i];
				c = await normalizeTensors(c, MEAN,STD);
				c = await resizeTensors(c, 224,224);
				new_ctensors.push(c);
			}

			// initialisation de la table de labels
			await loadClassMapping();
			console.log('classmap : ', classmap);

			// ça marche aussi mais c'est moins opti hihi
			//let cImages = await applyBBsOnImages( boundingboxes, images);
			//croppedImagesURL = cImages[0];

			console.log("loading classifier...");
			let cmodel =  await loadModel(true);
			console.log("classifying...");
			let coutput = await classify(new_ctensors, cmodel,img_proceed,start);
			console.log('output : ', coutput);
			

			let labels_inter = [];
			labels = [];
			for (let i=0;i<coutput[0].length;i++) {
				let l = [];
				for (let j=0; j<coutput[0][i].length; j++) {
					let index = coutput[0][i][j];
					l.push(classmap[index]);
				}
				labels_inter.push(l)
			}
			labels = labels_inter;
			conf = coutput[1];
			console.log("label",labels);



		}
	}

	// Reactive statement: when processedContainer and processed_canvas are set,
	// update the container's content to display the preprocessed image.
	$: if (processedContainer && processed_canvas) {
		processedContainer.innerHTML = '';
		processedContainer.appendChild(processed_canvas);
	}

	// Reactive statement: similarly update the container for the cropped image.
	$: if (cropContainer && crop_canvas) {
		cropContainer.innerHTML = '';
		cropContainer.appendChild(crop_canvas);
	}
</script>
<style>
    .grid-container {
        display: grid;
        grid-template-columns: repeat(10, 1fr);
        gap: 10px;
        padding: 20px;
    }
    .grid-item img {
        width: 100%;
        height: auto;
        border-radius: 5px;
        box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.1);
    }
</style>

<h1>dect'insect</h1>

<!-- Step 1: Ask the user to load an image -->
<input type="file" accept="image/*" bind:files={image_file} on:change={processImage} multiple />

<!-- Step 3: Display the preprocessed image -->
<h2>Preprocessed Image</h2>
<div bind:this={processedContainer}></div>

<!-- Step 5: Display the cropped insect image -->
<h2>Cropped Insect</h2>
<div bind:this={cropContainer}></div>

<h3>{img_proceed.state}</h3>
<p>image proceed : {img_proceed.nb}  ;  time taken (s): {img_proceed.time}</p>

<div class="grid-container">
    {#each croppedImagesURL as row,i}
        {#each row as image,j}
            <div class="grid-item">

				<p>({i};{j}):{labels[i][j]}:{conf[i][j]}</p>
                <img src={image} alt="Cropped Image">
            </div>
        {/each}
    {/each}
</div>



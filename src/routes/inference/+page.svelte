<script>
	import { loadModel, inferSequentialy, classify, torawpath } from '$lib/inference.js';
	import { labelize, applyBBsOnTensors, loadClassMapping } from '$lib/inference_utils.js';
	import { uiState as img_proceed } from '$lib/state.svelte.js';

	//ort.env.wasm.wasmPaths = 'https://unpkg.com/onnxruntime-web@dev/dist/';

	// Reactive state variables.
	/*** @type {FileList}*/
	let image_file; // Holds the selected file(s) from the input.
	/*** @type {HTMLDivElement}*/
	let processedContainer; // Container DOM element for the preprocessed canvas.
	/**@type {string[]}*/
	let croppedImagesURL = [];
	// le model de détection et de classif
	/**
	 * @type {import('onnxruntime-web').InferenceSession | null}
	 */
	let model = null;
	/**
	 * @type {import('onnxruntime-web').InferenceSession | null}
	 */
	let cmodel = null;
	// les labels à afficher sur les images crops
	/**@type {string[][]}*/
	let labels = [];
	// fichier contenant le mapping des classes
	let classmapping = torawpath('class_mapping.txt');
	/**@type {number[][]}*/
	let conf = [];
	/**
	 * @type {HTMLCanvasElement}
	 */
	let canvas;

	async function processImage() {
		let classmap = [];
		img_proceed.processing.done = 0;
		img_proceed.processing.total = 0;
		img_proceed.processing.time = 0;
		img_proceed.processing.state = 'loading';

		// ça charge le fichier de mapping de classes et en créé un tableau
		classmap = await loadClassMapping(classmapping);
		console.log('classmap : ', classmap);

		if (image_file && image_file.length > 0) {
			if (!model) {
				model = await loadModel();
			}

			// 1. Ask the user to load the image: get the first file.
			const file = image_file[0];
			const img = await createImageBitmap(file);

			// 2. Load and preprocess the image using an off-screen canvas.
			const targetWidth = 640;
			const targetHeight = 640;

			canvas.width = targetWidth;
			canvas.height = targetHeight;

			const ctx = canvas.getContext('2d');
			if (!ctx) {
				throw new Error('Could not get 2d context from canvas');
			}
			ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

			// Extract pixel data from the canvas.
			const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
			img_proceed.processing.state = 'inference';
			ctx.putImageData(imageData, 0, 0);

			//var BsandBs = await infer(image_file,model, img_proceed);
			// le inferSequentialy appel juste de manière séquentielle infer
			// BsandBs = [boundingboxes, bestScores, start, inputTensors]
			// boundingboxes sous la forme [each image [each boxes [x,y,w,h]]]
			// bestScores sous la forme [each image [each score]]
			// start : le temps de départ (pour le calcul du temps total)
			// inputTensors : les tensors d'entrée, ils servent à ne pas être recalculé à chaque fois
			const buffers = await Promise.all([...image_file].map((file) => file.arrayBuffer()));
			var BsandBs = await inferSequentialy(buffers, model, img_proceed);

			let boundingboxes = BsandBs[0];
			// @ts-ignore
			let start = BsandBs[2];
			let inputTensors = BsandBs[3];

			// bon là juste on trace les bb comme ça
			img_proceed.processing.done = 0;
			img_proceed.processing.state = 'postprocessing';
			// @ts-ignore
			img_proceed.time = (Date.now() - start) / 1000;
			//for (let i = 0; i < best_boxes.length; i++) {
			//	ctx.strokeStyle = 'red';
			//	ctx.lineWidth = 2;
			//	ctx.strokeRect(best_boxes[i][0], best_boxes[i][1], best_boxes[i][2], best_boxes[i][3]);
			//}

			img_proceed.processing.state = 'finished';
			// crop chaque tenseurs d'entrée (i.e les images) avec les bounding boxes
			// @ts-ignore
			let ctensors = await applyBBsOnTensors(boundingboxes, inputTensors);

			// initialisation des labels pour pas que l'affichage bug
			labels = [];
			conf = [];
			for (let i = 0; i < ctensors.length; i++) {
				let l = [];
				let c = [];
				for (let j = 0; j < ctensors[i].length; j++) {
					l.push('en profonde réflexion...');
					c.push(0);
				}
				labels.push(l);
				conf.push(c);
			}
			img_proceed.processing.time = (Date.now() - start) / 1000;

			// on affiche les images crops obtenues avec le applyBBsOnTensors
			img_proceed.processing.state = 'visualizing';
			img_proceed.processing.done = 0;
			let croppedImagesURL_buffer = [];
			for (let i = 0; i < ctensors.length; i++) {
				let croppedImagesURL_inter = [];
				// @ts-ignore
				let c = ctensors[i];
				for (let j = 0; j < c.length; j++) {
					// @ts-ignore
					let img = c[j].toDataURL();
					croppedImagesURL_inter.push(img);
					img_proceed.processing.done += 1;
					img_proceed.processing.time = (Date.now() - start) / 1000;
				}
				croppedImagesURL_buffer.push(croppedImagesURL_inter);
			}
			// @ts-ignore
			croppedImagesURL = croppedImagesURL_buffer;
			// ensuite on libère la ram du model de détection

			model.release();
			model = null;

			// le true c'est juste pr dire qu'on vas load le model de classif
			if (!cmodel) {
				cmodel = await loadModel(true);
			}
			// on classifie chaque image crop, coutput = [each image [each class]] ; [each image [each conf]]
			// @ts-ignore
			let coutput = await classify(ctensors, cmodel, img_proceed, start);
			// on passe de la coutput à [each image[each label]] et [each image[each conf]]*
			// @ts-ignore
			let labelandconf = labelize(coutput, classmap);
			labels = labelandconf[0];
			conf = labelandconf[1];

			// on libère la ram du model de classif
			cmodel.release();
			cmodel = null;
			console.log('finiiiiis');
		}
	}
	// bon le reste c'est du html c'est pas moi qu'ais fait c'est chatgpt parce que flm
</script>

<h1>dect'insect</h1>

<!-- Step 1: Ask the user to load an image -->
<input type="file" accept="image/*" bind:files={image_file} on:change={processImage} multiple />

<!-- Step 3: Display the preprocessed image -->
<h2>Preprocessed Image</h2>
<div bind:this={processedContainer}>
	<canvas bind:this={canvas}></canvas>
</div>

<!-- Step 5: Display the cropped insect image -->
<h2>Cropped Insect</h2>

<h3>{img_proceed.processing.state}</h3>
<p>image proceed : {img_proceed.processing.done} ; time taken (s): {img_proceed.processing.time}</p>

<div class="grid-container">
	{#each croppedImagesURL as row, i (i)}
		{#each row as image, j (j)}
			<div class="grid-item">
				<p>
					{labels[i][j]}:
					{conf[i][j]}
				</p>
				<img src={image} alt="croped image" />
			</div>
		{/each}
	{/each}
</div>

<style>
	h1 {
		text-align: center;
		margin-top: 20px;
	}
	h2 {
		margin-top: 20px;
	}
	.grid-container {
		display: grid;
		grid-template-columns: repeat(10, 1fr);
		gap: 10px;
		padding: 20px;
		background-color: cadetblue;
	}
	.grid-item img {
		width: 100%;
		height: auto;
		border-radius: 5px;
		box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.1);
	}
</style>

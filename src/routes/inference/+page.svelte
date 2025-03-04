<script>
	import { loadModel, inferSequentialy, classify, torawpath } from './inference.js';
	import { labelize, applyBBsOnTensors, loadClassMapping } from './inference_utils.js';
	import { img_proceed } from './state.svelte.js';

	//ort.env.wasm.wasmPaths = 'https://unpkg.com/onnxruntime-web@dev/dist/';

	// Reactive state variables.
	let image_file; // Holds the selected file(s) from the input.
	let processedContainer; // Container DOM element for the preprocessed canvas.
	let croppedImagesURL = [];
	// le model de détection et de classif
	let model = null;
	let cmodel = null;
	// les labels à afficher sur les images crops
	let labels = [];
	// fichier contenant le mapping des classes
	let classmapping = torawpath('class_mapping.txt');
	let conf = [];

	let canvas;

	async function processImage() {
		let classmap = [];
		img_proceed.nb = 0;
		img_proceed.time = 0;
		img_proceed.state = 'loading';

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
			ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

			// Extract pixel data from the canvas.
			const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
			img_proceed.state = 'inference';
			ctx.putImageData(imageData, 0, 0);

			//var BsandBs = await infer(image_file,model, img_proceed);
			// le inferSequentialy appel juste de manière séquentielle infer
			// BsandBs = [boundingboxes, bestScores, start, inputTensors]
			// boundingboxes sous la forme [each image [each boxes [x,y,w,h]]]
			// bestScores sous la forme [each image [each score]]
			// start : le temps de départ (pour le calcul du temps total)
			// inputTensors : les tensors d'entrée, ils servent à ne pas être recalculé à chaque fois
			var BsandBs = await inferSequentialy(image_file, model, img_proceed);

			let boundingboxes = BsandBs[0];
			let start = BsandBs[2];
			let inputTensors = BsandBs[3];

			// bon là juste on trace les bb comme ça
			img_proceed.nb = 0;
			img_proceed.state = 'post processing';
			img_proceed.time = (Date.now() - start) / 1000;
			//for (let i = 0; i < best_boxes.length; i++) {
			//	ctx.strokeStyle = 'red';
			//	ctx.lineWidth = 2;
			//	ctx.strokeRect(best_boxes[i][0], best_boxes[i][1], best_boxes[i][2], best_boxes[i][3]);
			//}

			img_proceed.state = 'finished';
			// crop chaque tenseurs d'entrée (i.e les images) avec les bounding boxes
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
			img_proceed.time = (Date.now() - start) / 1000;

			// on affiche les images crops obtenues avec le applyBBsOnTensors
			img_proceed.state = 'affichage';
			img_proceed.nb = 0;
			let croppedImagesURL_buffer = [];
			for (let i = 0; i < ctensors.length; i++) {
				let croppedImagesURL_inter = [];
				let c = ctensors[i];
				for (let j = 0; j < c.length; j++) {
					let img = c[j].toDataURL();
					croppedImagesURL_inter.push(img);
					img_proceed.nb += 1;
					img_proceed.time = (Date.now() - start) / 1000;
				}
				croppedImagesURL_buffer.push(croppedImagesURL_inter);
			}
			croppedImagesURL = croppedImagesURL_buffer;
			// ensuite on libère la ram du model de détection

			model.release();
			model = null;

			// le true c'est juste pr dire qu'on vas load le model de classif
			if (!cmodel) {
				cmodel = await loadModel(true);
			}
			// on classifie chaque image crop, coutput = [each image [each class]] ; [each image [each conf]]
			let coutput = await classify(ctensors, cmodel, img_proceed, start);
			// on passe de la coutput à [each image[each label]] et [each image[each conf]]
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

<h3>{img_proceed.state}</h3>
<p>image proceed : {img_proceed.nb} ; time taken (s): {img_proceed.time}</p>

<div class="grid-container">
	{#each croppedImagesURL as row, i (i)}
		{#each row as image, j (j)}
			<div class="grid-item">
				<p>
					{labels[i][j]}:
					{conf[i][j]}
				</p>
				<img src={image} alt="Cropped Image" />
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

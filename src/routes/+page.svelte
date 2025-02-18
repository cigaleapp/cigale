<script>
	import AreaObservations from '$lib/AreaObservations.svelte';
	import Dropzone from '$lib/Dropzone.svelte';
	import * as mobilenet from '@tensorflow-models/mobilenet';
	import * as tf from '@tensorflow/tfjs';
	let image_file = $state();
	let classe = $state();
	let certainty = $state();

	let canva_element = $state();

	$effect(() => {
		if (image_file) {
			let img = Array.from(image_file)[0];
			let reader = new FileReader();
			reader.onload = function (e) {
				let img = new Image();
				img.src = e.target.result;
				img.onload = async function () {
					let tensor = tf.browser.fromPixels(img).resizeBilinear([224, 224]).toFloat();
					tensor = tensor.div(tensor.max());
					tensor = tensor.sub(tensor.mean());

					let tensor_copy = tf.browser.fromPixels(img).clone();

					tensor_copy = tensor_copy.resizeBilinear([224, 224]).toFloat();
					tensor_copy = tensor_copy.div(255.0);

					canva_element.width = 224;
					canva_element.height = 224;
					await tf.browser.toPixels(tensor_copy, canva_element);

					// eslint-disable-next-line no-unused-vars
					tensor = tensor.expandDims();

					const model = await mobilenet.load();
					const predictions = await model.classify(img);

					console.log(predictions);
					classe = predictions[0].className;
					certainty = predictions[0].probability;
				};
			};
			reader.readAsDataURL(img);
		}
	});

	/** @type {Array<{ index: number, image: string, title: string, stacksize: number, loading?: number }>} */
	const images = $state([]);
</script>

<h1>Démo observations lol</h1>
<p>Zone ou on peut selectionner en glissant = fond gris</p>

<Dropzone
	clickable={images.length === 0}
	onfiles={({ files }) => {
		console.log(`Adding ${files.length} files`);
		console.log(files);
		images.push(
			...files.map((file, index) => ({
				index: images.length + index,
				image: URL.createObjectURL(file),
				title: file.name,
				stacksize: Math.random() > 0.2 ? Math.ceil(Math.random() * 5) : 1,
				loading: Math.random() > 0.8 ? (Math.random() > 0.3 ? Math.random() : -1) : undefined
			}))
		);
	}}
>
	<section class="demo-observations">
		<AreaObservations {images} loadingText="Analyse…" />
	</section>
</Dropzone>

<h1>Welcome to chocolat</h1>
<input type="file" accept="image/*" bind:files={image_file} />
<p>classse : {classe} with certainty : {certainty}</p>
<canvas id="canvas" bind:this={canva_element}></canvas>

<style>
	.demo-observations {
		padding: 4em;
		background-color: rgb(from var(--fg-neutral) r g b / 0.1);
	}
</style>

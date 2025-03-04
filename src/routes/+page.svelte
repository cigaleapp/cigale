<script>
	import AreaObservations from '$lib/AreaObservations.svelte';
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
				img.src = e.target?.result?.toString() ?? '';
				img.onload = async function () {
					let tensor = tf.browser.fromPixels(img).resizeBilinear([224, 224]).toFloat();
					tensor = tensor.div(tensor.max());
					tensor = tensor.sub(tensor.mean());

					let tensor_copy = tf.browser.fromPixels(img).clone();

					// @ts-ignore
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

	const images = [
		'https://parlonssciences.ca/sites/default/files/2019-11/What_is_an_insect.jpg',
		'https://www.mnhn.fr/system/files/styles/medium/private/2023-05/Phasme.jpg.webp?itok=ShPjddHh',
		'https://c02.purpledshub.com/uploads/sites/62/2023/10/What-are-insects.jpg?w=1029&webp=1',
		'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBOmE9xQpSvkASuRBHnw43Nz6fGcM9P0Ly9Q&s',
		'https://i.imgur.com/oH8fyj6.png',
		'https://www.dgaae.de/files/user-upload/insekt_des_jahres/2024/Stierhornk%C3%A4fer_Schmitt.jpg',
		'https://www.coastalmountains.org/wp-content/uploads/2023/09/bug1.jpg',
		'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSy4ENS-jTKY1misqIH__jY0fl7Z2Z3r0D_uA&s',
		'https://i1.sndcdn.com/artworks-60T5acZkPilLZTnc-qOoVZw-t500x500.jpg',
		'https://www.terro.com/media/Articles/TERRO/How-to-ID-Insects.jpg',
		'https://i.pinimg.com/originals/d4/b6/c4/d4b6c4366f33a5e45694ccfa466c09f8.jpg',
		'https://cdn.pixabay.com/photo/2023/04/25/03/02/butterfly-7949342_640.jpg',
		'https://www.bioexplorer.net/images/1-Blue-Morpho.jpg'
	].map((image, index) => ({
		index,
		image,
		title: `IMG_${Math.ceil(Math.random() * 100000)}.JPEG`,
		stacksize: Math.random() > 0.2 ? Math.ceil(Math.random() * 5) : 1,
		loading: Math.random() > 0.8 ? (Math.random() > 0.3 ? Math.random() : -1) : undefined
	}));
</script>

<h1>Démo observations lol</h1>
<p>Zone ou on peut selectionner en glissant = fond gris</p>

<section class="demo-observations">
	<AreaObservations {images} loadingText="Analyse…" />
</section>

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

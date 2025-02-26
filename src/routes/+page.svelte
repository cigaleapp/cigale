<script>
	import ButtonInk from '$lib/ButtonInk.svelte';
	import { exportProtocol, importProtocol } from '$lib/protocols';
	import * as mobilenet from '@tensorflow-models/mobilenet';
	import * as tf from '@tensorflow/tfjs';
	import { toasts } from '$lib/toasts.svelte.js';
	import { base } from '$app/paths';
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
				if (!e.target) return;
				if (typeof e.target.result !== 'string') return;
				img.src = e.target.result;
				img.onload = async function () {
					let tensor_copy = tf.browser.fromPixels(img).clone();

					// @ts-ignore
					tensor_copy = tensor_copy.resizeBilinear([224, 224]).toFloat();
					tensor_copy = tensor_copy.div(255.0);

					canva_element.width = 224;
					canva_element.height = 224;
					await tf.browser.toPixels(tensor_copy, canva_element);

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
</script>

<h1>Welcome to chocolat</h1>
<input type="file" accept="image/*" bind:files={image_file} />
<p>classse : {classe} with certainty : {certainty}</p>
<canvas id="canvas" bind:this={canva_element}></canvas>

<ButtonInk
	onclick={async () => {
		await exportProtocol(base, 'test');
	}}
>
	Export
</ButtonInk>

<ButtonInk
	onclick={async () => {
		try {
			const protocol = await importProtocol();
			toasts.success(
				`Protocole ${protocol.name} (dont ${protocol.metadata.length} métadonnées) importé`
			);
		} catch (e) {
			toasts.error(e?.toString() ?? 'Erreur inattendue');
		}
	}}
>
	Import
</ButtonInk>

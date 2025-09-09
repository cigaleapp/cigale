<script>
	import { decodeRawPhoto, imageDataToBlobURL } from '$lib/images';

	/** @type {string|undefined} */
	let src = $state();

	/**
	 * Load a RAW image file and decode it
	 * @param {InputEvent & { target: HTMLInputElement }} param0
	 */
	async function load({ target: { files } }) {
		src = await files?.[0].arrayBuffer().then(decodeRawPhoto).then(imageDataToBlobURL);
	}
</script>

<input type="file" oninput={load} />
<p>Ça prend ~40 secondes sur mon PC pour un .CR2 en 4K</p>
<img {src} alt="" />

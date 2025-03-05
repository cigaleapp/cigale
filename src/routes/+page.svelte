<script>
	import AreaObservations from '$lib/AreaObservations.svelte';
	import Dropzone from '$lib/Dropzone.svelte';
	import * as db from '$lib/idb.svelte';
	import { tables } from '$lib/idb.svelte';
	import { formatISO } from 'date-fns';
	import { SvelteMap } from 'svelte/reactivity';

	/** @type {Map<number, string>} */
	const previewURLs = new SvelteMap();

	/** @type {Array<{ index: number, image: string, title: string, stacksize: number, loading?: number }>} */
	const images = $derived(
		tables.Image.state.map((image) => ({
			image: previewURLs.get(image.id) ?? '',
			title: image.filename,
			index: image.id,
			stacksize: 1,
			loading: image.bufferExists && previewURLs.has(image.id) ? undefined : -1
		}))
	);

	$inspect(tables.Image.state);

	/**
	 * @param {string} contentType
	 * @param {ArrayBuffer} buffer
	 * */
	function arrayBufferToObjectURL(contentType, buffer) {
		const blob = new Blob([buffer], { type: contentType });
		return URL.createObjectURL(blob);
	}

	/**
	 * @param {File} file
	 * @param {number} id
	 */
	async function writeImage(file, id) {
		console.log('writeImage', file, id);
		const image = await tables.Image.raw.get(id.toString());
		if (!image) return;
		const bytes = await file.arrayBuffer();
		await db.set('ImageFile', {
			id: id.toString(),
			bytes
		});
		previewURLs.set(id, arrayBufferToObjectURL(file.type, bytes));
		await tables.Image.update(id.toString(), 'bufferExists', true);
	}

	$effect(() => {
		for (const image of tables.Image.state) {
			if (previewURLs.has(image.id)) continue;
			void (async () => {
				const file = await db.get('ImageFile', image.id.toString());
				if (!file) return;
				previewURLs.set(image.id, arrayBufferToObjectURL(image.contentType, file.bytes));
			})();
		}
	});
</script>

<h1>Démo observations lol</h1>
<p>Zone ou on peut selectionner en glissant = fond gris</p>

<Dropzone
	clickable={images.length === 0}
	onfiles={async ({ files }) => {
		const currentLength = images.length;
		await Promise.all(
			files.map(async (file, index) => {
				const id = currentLength + index;
				console.log(`adding image ${id} (cur length ${currentLength})`);
				await tables.Image.set({
					id: id.toString(),
					filename: file.name,
					addedAt: formatISO(new Date()),
					metadata: {},
					bufferExists: false,
					contentType: file.type
				});
				await writeImage(file, id);
			})
		);
	}}
>
	<section class="demo-observations">
		<AreaObservations {images} loadingText="Analyse…" />
	</section>
</Dropzone>

<style>
	.demo-observations {
		padding: 4em;
		background-color: rgb(from var(--fg-neutral) r g b / 0.1);
	}
</style>

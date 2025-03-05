<script>
	import AreaObservations from '$lib/AreaObservations.svelte';
	import Dropzone from '$lib/Dropzone.svelte';
	import * as db from '$lib/idb.svelte';
	import { tables } from '$lib/idb.svelte';
	import Logo from '$lib/Logo.svelte';
	import { storeMetadataValue } from '$lib/metadata';
	import { toasts } from '$lib/toasts.svelte';
	import { formatISO } from 'date-fns';
	import { SvelteMap } from 'svelte/reactivity';
	import { inferSequentialy, loadModel } from './inference/inference';
	import { img_proceed } from './inference/state.svelte';

	/** @type {Map<number, string>} */
	const previewURLs = new SvelteMap();

	/** @type {Array<{ index: number, image: string, title: string, stacksize: number, loading?: number }>} */
	const images = $derived(
		tables.Image.state.map((image) => ({
			image: previewURLs.get(image.id) ?? '',
			title: image.filename,
			index: image.id,
			stacksize: 1,
			loading:
				image.bufferExists && image.metadata.bounding_boxes && previewURLs.has(image.id)
					? undefined
					: -1
		}))
	);

	let loadingLogoDrawPercent = $state(0);
	let loadingLogoDrawingForwards = $state(true);
	$effect(() => {
		setInterval(() => {
			loadingLogoDrawPercent =
				loadingLogoDrawPercent + (loadingLogoDrawingForwards ? 1 : -1) * 0.03;
			if (loadingLogoDrawPercent > 1) {
				loadingLogoDrawingForwards = !loadingLogoDrawingForwards;
				loadingLogoDrawPercent = 0;
			}
		}, 10);
	});

	let cropperModel = $state();
	async function loadCropperModel() {
		cropperModel = await loadModel(false);
		toasts.success('Modèle de recadrage chargé');
	}

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
		await analyzeImage(bytes, id);
	}

	/**
	 * @param {ArrayBuffer} buffer
	 * @param {number} id
	 */
	async function analyzeImage(buffer, id) {
		if (!cropperModel) {
			toasts.error(
				'Modèle de recadrage non chargé, patentiez ou rechargez la page avant de rééssayer'
			);
			return;
		}

		const [boundingBoxes] = await inferSequentialy([buffer], cropperModel, img_proceed);
		await storeMetadataValue({
			subjectId: id.toString(),
			metadataId: 'bounding_boxes',
			value: JSON.stringify(boundingBoxes)
		});
	}

	$effect(() => {
		if (!cropperModel) return;
		for (const image of tables.Image.state) {
			if (image.bufferExists && !image.metadata.bounding_boxes) {
				void (async () => {
					const file = await db.get('ImageFile', image.id.toString());
					if (!file) return;
					await analyzeImage(file.bytes, image.id);
				})();
			}
		}
	});

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

{#await loadCropperModel()}
	<section class="loading">
		<Logo drawpercent={loadingLogoDrawPercent} />
		<p>Chargement du modèle de recadrage…</p>
	</section>
{:then _}
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
		<section class="observations" class:empty={!images.length}>
			<AreaObservations {images} loadingText="Analyse…" />
			{#if !images.length}
				<p>Cliquer ou déposer des images ici</p>
			{/if}
		</section>
	</Dropzone>
{:catch error}
	<section class="loading errored">
		<Logo variant="error" />
		<h2>Oops!</h2>
		<p>Impossible de charger le modèle de recadrage</p>
		<p class="message">{error?.toString() ?? 'Erreur inattendue'}</p>
	</section>
{/await}

<style>
	.observations {
		padding: 4em;
		display: flex;
		flex-grow: 1;
	}

	.observations.empty {
		justify-content: center;
		align-items: center;
		text-align: center;
	}

	.loading {
		display: flex;
		flex-direction: column;
		gap: 1.2em;
		justify-content: center;
		align-items: center;
		height: 100vh;
		/* Logo size */
		--size: 5em;
	}

	.loading.errored {
		gap: 0.5em;
	}

	.loading.errored *:not(p.message) {
		color: var(--fg-error);
	}
</style>

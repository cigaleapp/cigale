<script>
	import AreaObservations from '$lib/AreaObservations.svelte';
	import { toAreaObservationProps } from '$lib/AreaObservations.utils';
	import Dropzone from '$lib/Dropzone.svelte';
	import { tables } from '$lib/idb.svelte';
	import { deleteImageFile, imageFileIds } from '$lib/images';
	import Logo from '$lib/Logo.svelte';
	import { deleteObservation } from '$lib/observations';
	import { m } from '$lib/paraglide/messages.js';
	import { cancelTask, importMore } from '$lib/queue.svelte.js';
	import { getSettings } from '$lib/settings.svelte';
	import { uiState } from '$lib/state.svelte.js';

	const fileIds = $derived(imageFileIds(tables.Image.state));

	const images = $derived(
		toAreaObservationProps(fileIds, [], [], {
			showBoundingBoxes: () => false,
			isQueued: (fileId) => typeof fileId === 'string' && uiState.queuedImages.has(fileId),
			isLoaded: (fileId) => typeof fileId === 'string' && uiState.hasPreviewURL(fileId)
		})
	);

	const allImages = $derived(
		[
			...images,
			...uiState.processing.files.map(({ name, id }) => ({
				id,
				virtual: true,
				image: '',
				title: name,
				stacksize: 1,
				loading: uiState.loadingImages.has(id) ? +Infinity : -Infinity,
				boundingBoxes: [],
				addedAt: new Date()
			}))
		]
			.toSorted((a, b) => a.id.localeCompare(b.id))
			.map((props, i) => ({
				...props,
				index: i
			}))
	);

	const empty = $derived(allImages.length === 0);
</script>

<Dropzone
	filetypes={[
		'image/jpeg',
		'application/zip',
		'image/png',
		'image/tiff',
		'.cr2',
		'.rw2',
		'.dng',
		'.crw',
		'.raw',
		'.cr3'
	]}
	clickable={images.length === 0}
	onfiles={({ files }) => importMore(files)}
>
	<section class="observations" class:empty>
		<AreaObservations
			bind:selection={uiState.selection}
			images={allImages}
			errors={uiState.erroredImages}
			sort={getSettings().gallerySort}
			loadingText={m.loading_text()}
			ondelete={async (id) => {
				cancelTask(id, 'Cancelled by user');
				uiState.processing.removeFile(id);
				await deleteObservation(id);
				await deleteImageFile(id);
			}}
		/>
		{#if empty}
			<div class="empty-state">
				<Logo variant="empty" />
				<p>{m.click_or_drop_images_or_export()}</p>
			</div>
		{/if}
	</section>
</Dropzone>

<style>
	.observations {
		padding: 2.5em;
		display: flex;
		flex-direction: column;
		flex-grow: 1;
	}

	.observations.empty {
		justify-content: center;
		align-items: center;
		text-align: center;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		gap: 1.2em;
		justify-content: center;
		align-items: center;
		/* Logo size */
		--size: 5em;
		max-width: 20em;
		margin: auto;
	}
</style>

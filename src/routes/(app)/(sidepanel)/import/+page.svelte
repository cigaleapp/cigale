<script>
	import { fade } from 'svelte/transition';

	import AreaObservations from '$lib/AreaObservations.svelte';
	import CardImage from '$lib/CardImage.svelte';
	import CardMedia from '$lib/CardMedia.svelte';
	import Dropzone from '$lib/Dropzone.svelte';
	import { promptForFiles } from '$lib/files';
	import { tables } from '$lib/idb.svelte';
	import { deleteImageFile } from '$lib/images';
	import { ACCEPTED_IMPORT_TYPES } from '$lib/import.svelte';
	import Logo from '$lib/Logo.svelte';
	import { deleteObservation } from '$lib/observations';
	import { cancelTask, importMore } from '$lib/queue.svelte.js';
	import { uiState } from '$lib/state.svelte.js';
	import { unique } from '$lib/utils';

	const allImages = $derived([
		...unique(
			tables.Image.state.map(({ filename, id, addedAt, fileId, sessionId, metadata }) => ({
				id: fileId ?? id,
				addedAt,
				sessionId,
				metadata,
				name: filename,
				virtual: false,
				data: tables.Image.getFromState(id)
			})),
			// Since id can (and mostly is) fileId, we have to uniquify
			// by the id because multiple Images can reference the same ImageFile
			(image) => image.id
		),
		...uiState.processing.files.map(({ name, id, addedAt }) => ({
			id,
			sessionId: uiState.currentSessionId,
			addedAt,
			name,
			metadata: {},
			virtual: true,
			data: null
		}))
	]);

	const empty = $derived(allImages.length === 0);
</script>

<Dropzone
	filetypes={ACCEPTED_IMPORT_TYPES}
	clickable={allImages.length === 0}
	onfiles={({ files }) => importMore(files)}
>
	<section class="observations" class:empty in:fade={{ duration: 100 }}>
		<AreaObservations
			items={allImages}
			zone="import"
			onemptyclick={async () => {
				if (uiState.selection.length > 0) return;
				importMore(await promptForFiles({ accept: ACCEPTED_IMPORT_TYPES, multiple: true }));
			}}
		>
			{#snippet item(image, { id, name })}
				{#if image}
					<CardImage
						boxes="none"
						{image}
						ondelete={async () => {
							cancelTask(id, 'Cancelled by user');
							uiState.processing.removeFile(id);
							await deleteImageFile(id);
						}}
					/>
				{:else}
					{@const error = uiState.erroredImages.get(id)}
					{@const queued = uiState.queuedImages.has(id)}
					<CardMedia
						{id}
						title={name}
						status={error ? 'errored' : queued ? 'queued' : 'loading'}
						tooltip={error}
						image={undefined}
						dimensions={undefined}
						ondelete={async () => {
							cancelTask(id, 'Cancelled by user');
							uiState.processing.removeFile(id);
							await deleteObservation(id);
							await deleteImageFile(id);
						}}
					/>
				{/if}
			{/snippet}
		</AreaObservations>
		{#if empty}
			<div class="empty-state">
				<Logo variant="empty" />
				<p>Cliquer ou déposer des images, ou un export de résultats (.zip)</p>
			</div>
		{/if}
	</section>
</Dropzone>

<style>
	.observations {
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

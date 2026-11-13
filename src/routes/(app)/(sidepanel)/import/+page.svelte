<script lang="ts">
	import { fade } from 'svelte/transition';

	import IconCamera from '~icons/ri/camera-line';
	import IconImport from '~icons/ri/upload-2-line';
	import AreaObservations from '$lib/AreaObservations.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import CardImage from '$lib/CardImage.svelte';
	import CardMedia from '$lib/CardMedia.svelte';
	import Dropzone from '$lib/Dropzone.svelte';
	import { promptForFiles } from '$lib/files';
	import { tables } from '$lib/idb.svelte';
	import { deleteImageOrSound } from '$lib/images';
	import { ACCEPTED_IMPORT_TYPES } from '$lib/import/index.js';
	import Logo from '$lib/Logo.svelte';
	import { goto } from '$lib/paths.js';
	import { cancelTask, importMore } from '$lib/queue.svelte.js';
	import { uiState } from '$lib/uistate.svelte.js';
	import { unique } from '$lib/utils';
	import CardSound from '$lib/CardSound.svelte';

	const allFiles = $derived([
		...unique(
			tables.Image.state.map(({ filename, id, addedAt, fileId, sessionId, metadata }) => ({
				id: fileId ?? id,
				addedAt,
				sessionId,
				metadata,
				name: filename,
				virtual: false,
				data: { image: tables.Image.getFromState(id), sound: undefined },
			})),
			// Since id can (and mostly is) fileId, we have to uniquify
			// by the id because multiple Images can reference the same ImageFile
			(image) => image.id
		),
		...unique(
			tables.Sound.state.map(({ filename, id, addedAt, fileId, sessionId, metadata }) => ({
				id: fileId ?? id,
				addedAt,
				sessionId,
				metadata,
				name: filename,
				virtual: false,
				data: { sound: tables.Sound.getFromState(id), image: undefined },
			})),
			// Since id can (and mostly is) fileId, we have to uniquify
			// by the id because multiple Images can reference the same ImageFile
			(sound) => sound.id
		),
		...uiState.processing.files.map(({ name, id, addedAt }) => ({
			id,
			sessionId: uiState.currentSessionId,
			addedAt,
			name,
			metadata: {},
			virtual: true,
			data: { image: undefined, sound: undefined },
		})),
	]);

	const empty = $derived(allFiles.length === 0);
</script>

<Dropzone
	filetypes={ACCEPTED_IMPORT_TYPES}
	clickable={false}
	onfiles={({ files }) => importMore(files)}
>
	<main class="observations" class:empty in:fade={{ duration: 100 }}>
		<AreaObservations items={allFiles} zone="import">
			{#snippet item({ image, sound }, { id, name })}
				{#if image}
					<CardImage
						boxes="none"
						{image}
						ondelete={async () => {
							cancelTask(id, 'Cancelled by user');
							uiState.processing.removeFile(id);
							await deleteImageOrSound(id);
						}}
					/>
				{:else if sound}
					<CardSound
						{sound}
						ondelete={async () => {
							cancelTask(id, 'Canceled by user');
							uiState.processing.removeFile(id);
							await deleteImageOrSound(id);
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
						ondelete={() => {
							cancelTask(id, 'Cancelled by user');
							uiState.processing.removeFile(id);
						}}
					/>
				{/if}
			{/snippet}
		</AreaObservations>
		{#if empty}
			<div class="empty-state">
				<Logo variant="empty" />
				<p>Glisser et déposer des images, ou un export de résultats (.zip). Ou sinon:</p>
				<ButtonSecondary
					onclick={async () => {
						importMore(
							await promptForFiles({ accept: ACCEPTED_IMPORT_TYPES, multiple: true })
						);
					}}
				>
					<IconImport />
					Choisir des fichiers
				</ButtonSecondary>
				<ButtonSecondary onclick={async () => goto('/(app)/capture')}>
					<IconCamera />
					Prendre des photos
				</ButtonSecondary>
			</div>
		{/if}
	</main>
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

<!-- 

@component
Preview a File object.
Supported content types:
audio/*, 
video/*, 
image/*,
text/*,
application/pdf
application/json
any utf-8 encoded text
 
-->

<script lang="ts">
	import { fade } from 'svelte/transition';

	import IconFullscreen from '~icons/ri/fullscreen-line';

	import ButtonIcon from './ButtonIcon.svelte';
	import ButtonInk from './ButtonInk.svelte';
	import ButtonSecondary from './ButtonSecondary.svelte';
	import { downloadAsFile } from './download.js';
	import Modal from './Modal.svelte';

	interface Props {
		file: File | undefined;
	}

	const { file }: Props = $props();

	let openFullscreen: undefined | (() => void) = $state();
	let contentCopied = $state(false);
	$effect(() => {
		if (!contentCopied) return;
		const timeout = setTimeout(() => (contentCopied = false), 2000);
		return () => clearTimeout(timeout);
	});

	async function download() {
		if (!file) return;
		return downloadAsFile(file, file.name, file.type);
	}

	const componentId = $props.id();

	const supertype = $derived(
		file?.type.split('/')[0] as
			| 'application'
			| 'audio'
			| 'font'
			| 'example'
			| 'image'
			| 'message'
			| 'model'
			| 'multipart'
			| 'text'
			| 'video'
			| `x-${string}`
	);
</script>

<div class="file-preview" class:empty={!file}>
	{#if !file}
		<p class="empty">Aucun fichier</p>
	{:else if file.size > 2e9}
		<div class="unknown">
			<p>Fichier trop volumineux pour être prévisualisé</p>
			<ButtonInk onclick={download}>Télécharger</ButtonInk>
		</div>
	{:else if supertype === 'image'}
		<img src={URL.createObjectURL(file)} alt={file.name} class="image" />
	{:else if supertype === 'audio'}
		<audio controls src={URL.createObjectURL(file)} class="audio">
			Your browser does not support the audio element.
		</audio>
	{:else if supertype === 'video'}
		<!-- svelte-ignore a11y_media_has_caption -->
		<video controls src={URL.createObjectURL(file)} class="video">
			Your browser does not support the video element.
		</video>
	{:else if file.type === 'application/pdf'}
		<iframe src={URL.createObjectURL(file)} class="pdf" title={file.name}></iframe>
	{:else if supertype === 'text' || file.type === 'application/json' || file.type.startsWith('text/')}
		{#await file.text() then text}
			<Modal
				key="modal_fullscreen_filepreview_{componentId}"
				title={file.name}
				bind:open={openFullscreen}
			>
				<pre class="fullscreen">{text}</pre>
				<footer class="fullscreen-actions">
					<ButtonSecondary onclick={download}>Télécharger</ButtonSecondary>
					<ButtonSecondary
						onclick={async () => {
							await navigator.clipboard.writeText(text);
							contentCopied = true;
						}}
					>
						{#if contentCopied}
							<span in:fade class="success">Contenu copié !</span>
						{:else}
							<span in:fade>Copier le contenu</span>
						{/if}
					</ButtonSecondary>
				</footer>
			</Modal>
			<div class="floating-button">
				<ButtonIcon help="Afficher en plein écran" onclick={() => openFullscreen?.()}>
					<IconFullscreen />
				</ButtonIcon>
			</div>
			<pre>{text}</pre>
		{:catch error}
			<p>Error loading file preview: {error.message}</p>
			<ButtonInk onclick={download}>Download</ButtonInk>
		{/await}
	{:else}
		<div class="unknown">
			<p>Cannot preview this file type ({file.type}).</p>
			<ButtonInk onclick={download}>Download</ButtonInk>
		</div>
	{/if}
</div>

<style>
	.file-preview {
		width: 100%;
		border-radius: var(--corner-radius);
		overflow: hidden;
		--max-height: 100%;
		--padding: 0px;
		height: var(--max-height);
		padding: var(--padding);
		--effective-max-height: calc(var(--max-height) - 2 * var(--padding));
		background-color: color-mix(in srgb, var(--fg-neutral) 3%, var(--bg-neutral));

		&:has(.text) {
			--padding: 2em;
		}

		&.empty {
			display: flex;
			justify-content: center;
			align-items: center;
		}

		&:has(.unknown) {
			display: flex;
			align-items: center;
			justify-content: center;
		}
	}

	.unknown {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 0.5em;
	}

	p.empty {
		color: var(--gay);
	}

	img,
	video {
		max-height: var(--effective-max-height);
		object-fit: contain;
		width: 100%;
	}

	pre {
		font-size: 0.8rem;
	}

	.file-preview > pre {
		overflow: auto;
		max-height: var(--effective-max-height);
	}

	pre.fullscreen {
		overflow: auto;
		max-height: 70vh;
	}

	.file-preview {
		position: relative;
	}

	.floating-button {
		position: absolute;
		top: 0.5em;
		right: 0.5em;
	}

	.fullscreen-actions {
		display: flex;
		justify-content: center;
		gap: 1em;
		margin-top: 1em;

		.success {
			color: var(--fg-success);
		}
	}
</style>

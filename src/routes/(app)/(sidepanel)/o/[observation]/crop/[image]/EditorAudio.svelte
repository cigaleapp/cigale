<script lang="ts">
	import type { SelectedBox } from './+page.svelte';
	import type { DecodedAudioMono } from '$lib/audio/decode.js';
	import type * as DB from '$lib/database.js';

	import { decodeToMono } from '$lib/audio/decode.js';
	import { databaseHandle } from '$lib/idb.svelte.js';
	import { accessImages, resolveObjectWithBytes } from '$lib/storage/utils.js';
	import { toasts } from '$lib/toasts.svelte.js';
	import { overrideStyle } from '$lib/utils.js';

	import AudioPlayer from './AudioPlayer.svelte';
	import { fittedImageRect } from './DraggableBoundingBox.svelte.js';
	import { playhead } from './playhead.svelte.js';
	import Spectrogram from './Spectrogram.svelte';
	import Waveform from './Waveform.svelte';

	interface Props {
		selectedBox: SelectedBox;
		showConfirmedOverlay: () => Promise<void>;
		audioIsLoading: boolean;
		file: DB.AudioFile;
	}

	let { selectedBox, showConfirmedOverlay, audioIsLoading = $bindable(), file }: Props = $props();

	let audioSrc = $state<string>();
	let spectrogramSrc = $state<string>();
	let decodedAudio = $state<DecodedAudioMono>();

	let loading = $state({ spectrogram: true, audio: true });

	$effect(() => {
		audioIsLoading = loading.spectrogram || loading.audio;
	});

	$effect(() => {
		void loadSpectrogram();
	});

	$effect(() => {
		void loadAudio();
	});

	async function loadSpectrogram() {
		const spectrogram = await accessImages('AudioFile', file, 'full');
		if (spectrogramSrc) URL.revokeObjectURL(spectrogramSrc);
		spectrogramSrc = URL.createObjectURL(new Blob([spectrogram], { type: 'image/png' }));
	}

	async function loadAudio() {
		loading.audio = true;

		const resolved = await resolveObjectWithBytes(databaseHandle(), 'AudioFile', file.id);

		if (audioSrc) URL.revokeObjectURL(audioSrc);

		if (!resolved) {
			toasts.error(`Fichier ${file.filename} introuvable`);
			audioSrc = undefined;
			return;
		}

		decodedAudio = await decodeToMono(resolved.bytes);

		audioSrc = URL.createObjectURL(new Blob([resolved.bytes]));
	}

	// Disable chrome swipe-to-next/prev page
	$effect(overrideStyle('html, body', 'overscroll-behavior-x', 'none'));
</script>

<div class="editor">
	<!-- <div class="playhead" style:--position-percentage="{playhead.positionNormalized * 100}%" /> -->

	<div class="minimap">
		<Waveform minimap decoded={decodedAudio} />
	</div>

	<div class="waveform">
		<Waveform decoded={decodedAudio} />
	</div>

	<div
		class="spectrogram"

		// style:max-height="{

		// fittedImageRect("contain", )
		// file.spectrogram.imageDimensions.height}px"
	>
		{#if spectrogramSrc}
			<Spectrogram
				src={spectrogramSrc}
				{file}
				bind:loading={loading.spectrogram}
				{showConfirmedOverlay}
				{selectedBox}
			/>
		{/if}
	</div>

	<div class="player">
		<AudioPlayer
			bind:playhead={playhead.position}
			src={audioSrc}
			bind:loading={loading.audio}
		/>
	</div>
</div>

<style>
	.editor {
		height: 100%;
		display: grid;
		border-right: 1px solid var(--faint);
		row-rule: 1px solid var(--faint);
		grid-template-rows: max-content 3fr 5fr max-content;
	}

	.waveform,
	.minimap {
		display: flex;
		align-items: center;
	}

	.spectrogram {
		/* margin-top: auto; */
		flex: 1 1;
		/** Match with spectrogram background */
		/* background: black; */
	}

	.editor {
		position: relative;

		.playhead {
			position: absolute;
			left: var(--position-percentage);
			top: 0;
			bottom: 0;

			width: 3px;
			background: var(--fg-primary);
			z-index: 10;

			/* Triangle at top of playhead bar */
			&::before {
				--width: 10px;
				content: '';
				position: absolute;
				top: 0;
				left: 50%;
				transform: translateX(-50%);
				width: 0;
				height: 0;
				border-left: var(--width) solid transparent;
				border-right: var(--width) solid transparent;
				border-top: var(--width) solid var(--fg-primary);
			}
		}
	}
</style>

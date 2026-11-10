<script lang="ts" module>
export const cursor = $state({
	
})
</script>
<script lang="ts">
	import type { SelectedBox } from './+page.svelte';
	import type { DecodedAudioMono } from '$lib/audio/decode.js';
	import type * as DB from '$lib/database.js';

	import { watch } from 'runed';

	import { decodeToMono } from '$lib/audio/decode.js';
	import { databaseHandle } from '$lib/idb.svelte.js';
	import { IsMobile } from '$lib/mobile.svelte.js';
	import { accessImages, resolveObjectWithBytes } from '$lib/storage/utils.js';
	import { toasts } from '$lib/toasts.svelte.js';
	import { overrideStyle } from '$lib/utils.js';

	import { zoom } from './+page.svelte';
	import AudioPlayer from './AudioPlayer.svelte';
	import { fittedImageRect } from './DraggableBoundingBox.svelte.js';
	import { playhead } from './playhead.svelte.js';
	import Ruler from './Ruler.svelte';
	import Spectrogram from './Spectrogram.svelte';
	import Waveform from './Waveform.svelte';
	import ZoomableMarks from './ZoomableMarks.svelte';

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

	let cursor = $state<null | { time: number; frequency: number }>(null);

	let waveformWidthPx = $state<number>();

	let loading = $state({ spectrogram: true, audio: true });

	$effect(() => {
		audioIsLoading = Object.values(loading).some((v) => v);
	});

	watch([() => file.id], () => {
		void loadSpectrogram();
	});

	watch([() => file.id], () => {
		void loadAudio();
	});

	async function loadSpectrogram() {
		if (spectrogramSrc) URL.revokeObjectURL(spectrogramSrc);
		spectrogramSrc = undefined;
		const spectrogram = await accessImages('AudioFile', file, 'full');
		spectrogramSrc = URL.createObjectURL(new Blob([spectrogram], { type: 'image/png' }));
	}

	async function loadAudio() {
		decodedAudio = undefined;
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

	const mobile = new IsMobile();



	const visibleDurationRange = $derived.by(() => {
		if (!waveformWidthPx) return [0, file.dimensions.duration] as const;

		// Get starting milliseconds from zoom.origin.x and zoom.scale, and convert to milliseconds
		const startMs =
			file.dimensions.duration * (0.5 - 0.5 / zoom.scale - zoom.origin.x / waveformWidthPx);

		const durationMs = file.dimensions.duration / zoom.scale;

		return [startMs, startMs + durationMs] as const;
	});
</script>

<div class="editor" class:mobile={mobile.current}>
	<div class="minimap">
		<Waveform minimap decoded={decodedAudio} />
	</div>

	<div class="waveform">
		<Waveform decoded={decodedAudio} />
	</div>

	<div class="audio-position" bind:clientWidth={waveformWidthPx}>
		<div class="ruler">
			<Ruler
				horizontal
				domain={visibleDurationRange}
				label={(value) => {
					value /= 1000;
					if (file.dimensions.duration > 60e3)
						return `${Math.floor(value / 60)}:${Math.floor(value % 60)
							.toString()
							.padStart(2, '0')}`;
					return `${Math.floor(value)}s`;
				}}
			/>
		</div>

		<div class="aligner"></div>
	</div>

	<div class="spectrogram">
		{#if spectrogramSrc}
			<Spectrogram
				src={spectrogramSrc}
				{file}
				bind:loading={loading.spectrogram}
				bind:cursor
				{showConfirmedOverlay}
				{selectedBox}
			/>
		{/if}
	</div>

	<div class="bottom">
		<AudioPlayer src={audioSrc} bind:loading={loading.audio} />

		<div class="infos">
			<div class="cursor">
				{cursor?.time}
			</div>
		</div>
	</div>
</div>

<style>
	.editor {
		height: 100%;
		display: grid;
		border-right: 1px solid var(--faint);
		row-rule: 1px solid var(--faint);
		grid-template-rows: max-content 3fr max-content 5fr max-content;

		&.mobile {
			color-scheme: dark;
		}
	}

	.audio-position {
		width: 100%;

		.ruler {
			position: relative;
			width: 100%;
		}

		.aligner {
			width: 4rem;
		}
	}

	.waveform,
	.minimap,
	.bottom,
	.audio-position {
		display: flex;
		align-items: center;
	}

	.bottom {
		justify-content: space-between;
	}

	.spectrogram {
		/* margin-top: auto; */
		flex: 1 1;
		/** Match with spectrogram background */
		/* background: black; */
	}
</style>

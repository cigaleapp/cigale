<script lang="ts">
	import type { CenteredBoundingBox } from '$lib/BoundingBoxes.svelte.js';

	import { watch } from 'runed';
	import { untrack } from 'svelte';

	import IconPause from '~icons/ri/pause-line';
	import IconPlay from '~icons/ri/play-line';
	import { FULL_IMAGE_CROPBOX, toTopLeftCoords } from '$lib/BoundingBoxes.svelte.js';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import { defineKeyboardShortcuts } from '$lib/keyboard.svelte.js';
	import { switchValue } from '$lib/utils.js';

	interface Props {
		/** blob url of the audio file */
		src: string | undefined;
		/** Bind to it */
		loading?: boolean;
		/** Optional playhead instance. Update its .position alongside the audio player */
		playhead?: { bindPlayer: (element: HTMLAudioElement) => void; position: number };
		/** Only play a certain part of the audio. 0-1 coordinates. Only x (start) and w (duration) area used */
		box?: CenteredBoundingBox;
	}

	let { src, loading = $bindable(true), playhead, box = FULL_IMAGE_CROPBOX }: Props = $props();

	let playing = $state(false);

	let element = $state<HTMLAudioElement>();

	let duration = $state(NaN);

	const croppedStart = $derived(duration * toTopLeftCoords(box).x);
	const croppedEnd = $derived(duration * (toTopLeftCoords(box).x + box.w));

	let currentTime = $derived(croppedStart);

	watch([() => src], () => {
		playing = false;
	});

	function togglePlayPause() {
		if (!playing) element?.play();
		else element?.pause();
	}

	function formatDuration(ms: number): `${string}:${string}` {
		if (!Number.isFinite(ms) || Number.isNaN(ms)) return '--:--';

		const mins = Math.floor((ms * 1e-3) / 60);
		const secs = (ms * 1e-3) % 60;

		const amt = (v: number) => v.toFixed(0).toString().padStart(2, '0');

		return `${amt(mins)}:${amt(secs)}`;
	}

	defineKeyboardShortcuts('cropping', {
		Space: {
			help: 'Pause / Reprendre',
			do: togglePlayPause,
		},
	});


	$effect(() => {
		if (!element) return;
		if (currentTime >= croppedEnd) {
			element.pause();
			element.currentTime = croppedStart * 1e-3;
		}
	});
</script>

<audio
	{src}
	preload="auto"
	controls
	bind:this={element}
	{@attach (node) => {
		playhead?.bindPlayer(node);
	}}
	bind:readyState={
		null,
		(state) => {
			loading = switchValue(state, {
				0: true,
				1: true,
				2: true,
				3: false,
				4: false,
			});
		}
	}
	bind:duration={
		null,
		(d) => {
			duration = d * 1e3;
		}
	}
	bind:currentTime={
		() => croppedStart * 1e-3,
		(time) => {
			currentTime = time * 1e3;
			if (playhead) playhead.position = time * 1e3;
		}
	}
	onplay={() => {
		playing = true;
	}}
	onpause={() => {
		playing = false;
	}}
	onended={() => {
		playing = false;
	}}
	onload={() => {
		loading = false;
	}}
></audio>

<div class="player" class:disabled={loading || !src}>
	<div class="playpause">
		<ButtonIcon
			help="Pause / Reprendre"
			disabled={loading || !src}
			onclick={() => {
				togglePlayPause();
			}}
		>
			{#if playing}
				<IconPause />
			{:else}
				<IconPlay />
			{/if}
		</ButtonIcon>
	</div>

	<div class="time">
		{#if croppedEnd < duration}
			<code class="elapsed">
				{formatDuration(currentTime)}
			</code>
			<span class="separator">&gt;</span>
			<code class="total">
				{formatDuration(croppedEnd)}
			</code>
		{:else}
			<code class="elapsed">
				{formatDuration(currentTime)}
			</code>

			<span class="separator">/</span>
			<code class="total">
				{formatDuration(duration)}
			</code>
		{/if}
	</div>

	<!-- <div class="seekbar">
		<ProgressBar alwaysActive progress={playhead / duration} />
	</div> -->
	<div class="volume"></div>

	<div class="more-controls"></div>
</div>

<style>
	audio {
		display: none;
	}

	.playpause {
		font-size: 1.2em;
	}

	.player {
		width: 100%;
		padding: 0.5em;
		height: var(--audio-player-height);
		display: flex;
		align-items: center;
		gap: 1em;
		color: var(--fg-neutral);

		&.disabled {
			opacity: 0.5;
		}
	}

	.time {
		display: flex;
		align-items: center;
		gap: 0.5em;

		code {
			font-size: 0.85rem;
		}

		.separator {
			color: var(--gay);
		}
	}
</style>

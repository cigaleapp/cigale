<script lang="ts">
	import type { CenteredBoundingBox } from '#lib/BoundingBoxes.svelte.js';

	import { watch } from 'runed';

	import IconPause from '~icons/ri/pause-line';
	import IconPlay from '~icons/ri/play-line';
	import IconVolumeDown from '~icons/ri/volume-down-line';
	import IconVolumeUp from '~icons/ri/volume-up-line';
	import { FULL_IMAGE_CROPBOX, toTopLeftCoords } from '#lib/BoundingBoxes.svelte.js';
	import ButtonIcon from '#lib/ButtonIcon.svelte';
	import { defineKeyboardShortcuts } from '#lib/keyboard.svelte.js';
	import { isRegularNumber, round, switchValue } from '#lib/utils.js';

	interface Props {
		/** blob url of the audio file */
		src: string | undefined;
		/** Bind to it */
		loading?: boolean;
		/** Optional playhead instance. Update its .position alongside the audio player */
		playhead?: { bindPlayer: (element: HTMLAudioElement) => void; position: number };
		/** Only play a certain part of the audio. 0-1 coordinates. Only x (start) and w (duration) area used */
		box?: CenteredBoundingBox;
		/**
		 * In milliseconds.
		 * Explicit duration if the HTML audio element doesn't give it:
		 * if duration isn't stored as metadata, duration will only be available
		 * to <audio> after reaching the end.
		 * If the audio was already decoded somewhere else (eg to render a waveform)
		 * and the true duration is thus available, we can display it
		 * right away.
		 */
		precomputedDuration?: number;
		autoplay?: boolean;
		/**
		 * Value is in [0, 1]. Defaults to 1 */
		initialVolume?: number;
		/**
		 * Readonly bindable.
		 * Value is in [0, 1].
		 * Check for infinities or NaNs
		 */
		progress?: number;
	}

	let {
		src,
		loading = $bindable(true),
		progress = $bindable(0),
		playhead,
		box = FULL_IMAGE_CROPBOX,
		precomputedDuration,
		autoplay,
		initialVolume = 1,
	}: Props = $props();

	let element = $state<HTMLAudioElement>();

	let playing = $state(false);
	let volume = $state(initialVolume);
	let duration = $derived(precomputedDuration ?? NaN);

	const croppedStart = $derived(duration * toTopLeftCoords(box).x);
	const croppedEnd = $derived(duration * (toTopLeftCoords(box).x + box.w));

	let currentTime = $derived(croppedStart);

	$effect(() => {
		progress = currentTime / duration;
	});

	watch([() => src], () => {
		playing = false;
	});

	function togglePlayPause() {
		if (!playing) element?.play();
		else element?.pause();
	}

	function formatDuration(ms: number): `${string}:${string}` {
		if (!isRegularNumber(ms)) return '--:--';

		const mins = Math.floor((ms * 1e-3) / 60);
		const secs = (ms * 1e-3) % 60;

		const amt = (v: number) => v.toFixed(0).toString().padStart(2, '0');

		return `${amt(mins)}:${amt(secs)}`;
	}

	defineKeyboardShortcuts('cropping', {
		Space: {
			help: 'Pause / Reprendre',
			when: () => !loading,
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
	{autoplay}
	preload="auto"
	controls
	bind:this={element}
	onclick={(e) => {
		e.stopPropagation();
	}}
	{@attach (node) => {
		playhead?.bindPlayer(node);
	}}
	bind:volume={
		() => initialVolume,
		(vol) => {
			volume = round(vol, 2);
		}
	}
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
			if (!isRegularNumber(d)) return;
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
	<div class="left">
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
	</div>

	<div class="more-controls">
		<ButtonIcon
			help="Baisser le volume"
			disabled={volume <= 0.05}
			onclick={() => {
				if (!element) return;
				element.volume -= 0.1;
			}}
		>
			<IconVolumeDown />
		</ButtonIcon>

		<ButtonIcon
			help="Augmenter le volume"
			disabled={volume >= 0.95}
			onclick={() => {
				if (!element) return;
				element.volume += 0.1;
			}}
		>
			<IconVolumeUp />
		</ButtonIcon>
	</div>
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
		padding: var(--audio-player-padding, 0.5em);
		height: var(--audio-player-height);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1em;
		color: var(--fg-neutral);

		&.disabled {
			opacity: 0.5;
		}
	}

	.left {
		display: flex;
		align-items: center;
		gap: 1em;
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

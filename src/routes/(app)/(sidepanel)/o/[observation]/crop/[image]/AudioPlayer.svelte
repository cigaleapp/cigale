<script lang="ts">
	import { watch } from 'runed';

	import IconPause from '~icons/ri/pause-line';
	import IconPlay from '~icons/ri/play-line';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import { defineKeyboardShortcuts } from '$lib/keyboard.svelte.js';
	import { switchValue } from '$lib/utils.js';

	import { playhead } from './playhead.svelte.js';

	interface Props {
		/** blob url of the audio file */
		src: string | undefined;
		loading: boolean;
	}

	let { src, loading = $bindable(true) }: Props = $props();

	let playing = $state(false);

	let element = $state<HTMLAudioElement>();

	let duration = $state(NaN);

	watch([() => src], () => {
		playing = false;
	});

	function togglePlayPause() {
		if (!playing) element?.play();
		else element?.pause();
	}

	function formatDuration(ms: number): `${string}:${string}` {
		if (!Number.isFinite(ms) || Number.isNaN(ms)) return '--:--';

		const mins = (ms * 1e-3) / 60;
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
</script>

<audio
	{src}
	preload="auto"
	controls
	{@attach (node) => {
		playhead.bindPlayer(node);
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
	bind:this={element}
	bind:currentTime={
		() => 0,
		(time) => {
			playhead.position = time * 1e3;
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
		<code class="elapsed">
			{formatDuration(playhead.position)}
		</code>
		<span class="separator">/</span>
		<code class="total">
			{formatDuration(duration)}
		</code>
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

	.seekbar {
		width: 100%;
		/* --height: 2rem; */
	}
</style>

<script lang="ts">
	import IconPause from '~icons/ri/pause-line';
	import IconPlay from '~icons/ri/play-line';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import { formatDurationShort } from '$lib/date.js';
	import ProgressBar from '$lib/ProgressBar.svelte';

	interface Props {
		/** blob url of the audio file */
		src: string;
		loading: boolean;
		/** position of the playhead in milliseconds, bind to it */
		playhead: number;
	}

	let { src, loading = $bindable(true), playhead = $bindable() }: Props = $props();

	let playing = $state(false);

	let element = $state<HTMLAudioElement>();

	let duration = $state(0);

	function togglePlayPause() {
		if (!playing) element?.play();
		else element?.pause();
	}

	function formatDuration(ms: number): `${string}:${string}` {
		const mins = (ms * 1e-3) / 60;
		const secs = (ms * 1e-3) % 60;

		const amt = (v: number) => v.toFixed(0).toString().padStart(2, '0');

		return `${amt(mins)}:${amt(secs)}`;
	}
</script>

<audio
	{src}
	controls
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
			playhead = time * 1e3;
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

<div class="player">
	<div class="playpause">
		<ButtonIcon
			help="Pause / Reprendre"
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
			{formatDuration(playhead)}
		</code>
		<span class="separator">/</span>
		<code class="total">
			{formatDuration(duration)}
		</code>
	</div>

	<div class="seekbar">
		<ProgressBar alwaysActive progress={playhead / duration} />
	</div>
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

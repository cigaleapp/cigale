<script lang="ts">
	import IconPause from '~icons/ri/pause-line';
	import IconPlay from '~icons/ri/play-line';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
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

	function togglePlayPause() {
		if (!playing) element?.play();
		else element?.pause();
	}
</script>

<audio
	{src}
	controls
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
		<span class="elapsed"></span>
		<span class="separator"></span>
		<span class="total"></span>
	</div>

	<div class="seekbar">
		<ProgressBar />
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
	}
</style>

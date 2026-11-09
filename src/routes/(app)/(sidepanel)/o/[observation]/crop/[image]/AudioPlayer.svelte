<script lang="ts">
	interface Props {
		/** blob url of the audio file */
		src: string;
		loading: boolean;
		/** position of the playhead in milliseconds, bind to it */
		playhead: number;
	}

	let { src, loading = $bindable(true), playhead = $bindable() }: Props = $props();
</script>

<audio
	{src}
	controls
	bind:currentTime={
		() => 0,
		(time) => {
			playhead = time * 1e3;
		}
	}
	onload={() => {
		loading = false;
	}}
></audio>

<style>
	audio {
		width: 100%;
	}
</style>

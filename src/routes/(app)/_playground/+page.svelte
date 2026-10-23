<svelte:options runes={true} />

<script lang="ts">
	import AudioAnnotator from '$lib/audio/AudioAnnotator.svelte';
</script>

<div class="ann">
	<AudioAnnotator url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" />
</div>

<style>
	.ann {
		max-width: 600px;
	}
</style>

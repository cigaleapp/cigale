<svelte:options runes={true} />

<script lang="ts">
	import AudioAnnotator from '$lib/audio/AudioAnnotator.svelte';
</script>

<div class="ann">
	<AudioAnnotator url="/20260407163000.wav" />
</div>

<style>
	.ann {
		max-width: 800px;
	}
</style>

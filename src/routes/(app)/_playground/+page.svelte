<svelte:options runes={true} />

<script lang="ts">
	import CardObservation from '$lib/CardObservation.svelte';
</script>

<CardObservation
	title="Test title"
	image="https://picsum.photos/200/300"
	selected={false}
	loading={0.5}
/>

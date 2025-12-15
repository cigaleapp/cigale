<script lang="ts">
	let { children } = $props();
</script>

<div class="liste">
	{@render children()}
</div>

<style>
	.liste {
		gap: var(--metadata-list-gap, 1.5em);
		display: flex;
		flex-direction: column;
		scrollbar-color: var(--gray) transparent;
		scrollbar-gutter: stable;
		scrollbar-width: thin;
		overflow-y: auto;
	}
</style>

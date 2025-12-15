<script lang="ts">
	import Logo from '$lib/Logo.svelte';
</script>

<div class="empty">
	<Logo --size="5rem" variant="empty" />
	<p>Sélectionnez une option</p>
</div>

<style>
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		width: 100%;
		flex-grow: 1;
		gap: 1rem;
	}
</style>

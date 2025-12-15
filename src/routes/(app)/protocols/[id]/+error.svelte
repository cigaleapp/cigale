<script lang="ts">
	import { page } from '$app/state';
	import Logo from '$lib/Logo.svelte';
</script>

<div class="error">
	<Logo variant="error" />
	Métadonnée “{page.params.metadata}” introuvable
</div>

<style>
	.error {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		flex-grow: 1;
		height: 100%;
		padding: 2em;
		gap: 1em;
		color: var(--fg-error);
		font-size: 1.5em;

		--size: 5em;
	}
</style>

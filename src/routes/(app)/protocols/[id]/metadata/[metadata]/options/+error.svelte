<script lang="ts">
	import { page } from '$app/state';
	import Logo from '$lib/Logo.svelte';
</script>

<div class="error">
	<Logo variant="error" />
	Aucune option trouvée avec la clé {page.params.option}
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

		--size: 5em;
	}
</style>

<script lang="ts">
	import { fade } from 'svelte/transition';

	import Logo from './Logo.svelte';

	interface Props {
		loading?: boolean;
		failure?: string;
		empty?: boolean;
	}

	const { loading = false, failure = '', empty = false }: Props = $props();
</script>

{#if failure}
	<div class="error" in:fade={{ duration: 200 }}>
		<Logo variant="error" />
		{failure}
	</div>
{:else if loading}
	<div class="loading" in:fade={{ duration: 200 }}>
		<Logo loading />
		Chargement…
	</div>
{:else if empty}
	<div class="empty" in:fade={{ duration: 200 }}>
		<Logo variant="empty" />
		Rien à voir ici
	</div>
{/if}

<style>
	div {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;

		height: 100%;
		width: 100%;

		--size: 5rem; /* Logo size */

		color: var(--fg-neutral);
	}
</style>

<script lang="ts">
	import type { Snippet } from 'svelte';

	import { Portal } from 'bits-ui';

	const { children }: { children: Snippet } = $props();
</script>

<Portal to="#portal-target-mobile-topbar">
	<div class="topbar">
		{@render children?.()}
	</div>
</Portal>

<style>
	.topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.5rem;
	}
</style>

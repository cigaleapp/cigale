
<script lang="ts">
	import type { Snippet } from 'svelte';

	import { Portal } from 'bits-ui';

	const { children }: { children: Snippet } = $props();
</script>

<Portal to="#portal-target-mobile-bottombar">
	<div class="bottombar">
		{@render children?.()}
	</div>
</Portal>

<style>
	.bottombar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: .5rem 1.5rem;
		border-radius: var(--corner-radius) var(--corner-radius) 0 0;
		border-top: 1px solid var(--gray);
	}
</style>


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
		padding: 0rem 1.5rem;
	}
</style>

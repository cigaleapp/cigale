<script lang="ts">
	import type { Snippet } from 'svelte';

	import { Portal } from 'bits-ui';

	type  Props = {
		children: Snippet;
	}

	const { children, }: Props = $props();
</script>

<Portal to="#portal-target-mobile-topbar">
	<div class="topbar">
		{@render children()}
	</div>
</Portal>

<style>
	.topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 1rem;
		gap: 1rem;
		width: 100%;
	}
</style>

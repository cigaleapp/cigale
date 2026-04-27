<script lang="ts">
	import type { Snippet } from 'svelte';

	import { Portal } from 'bits-ui';

	import { IsMobile } from '$lib/mobile.svelte.js';

	type Props = {
		children: Snippet;
	};

	const { children }: Props = $props();
	const mobile = new IsMobile();
</script>

<!-- This ensures the portal content is copied over if the target element gets destroyed then recreated (this happens when mobile.current changes). See file://./+layout.svelte -->
{#key mobile.current}
	<Portal to="#portal-target-mobile-topbar">
		<div class="topbar">
			{@render children()}
		</div>
	</Portal>
{/key}

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

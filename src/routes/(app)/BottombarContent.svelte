<script lang="ts">
	import type { Snippet } from 'svelte';

	import { Portal } from 'bits-ui';

	import { IsMobile } from '$lib/mobile.svelte.js';

	const { children }: { children: Snippet } = $props();

	const mobile = new IsMobile();
</script>

{#if mobile.current}
	<Portal to="#portal-target-mobile-bottombar">
		<div class="bottombar">
			{@render children?.()}
		</div>
	</Portal>
{/if}

<style>
	.bottombar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 1.5rem;
		border-radius: var(--corner-radius) var(--corner-radius) 0 0;
		border-top: 1px solid rgb(from var(--gray) r g b / 50%);
	}
</style>

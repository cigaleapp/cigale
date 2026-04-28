<script lang="ts">
	import type { Snippet } from 'svelte';

	import { Portal } from 'bits-ui';

	import { IsMobile } from '$lib/mobile.svelte.js';
	import ProgressBar from '$lib/ProgressBar.svelte';
	import { uiState } from '$lib/state.svelte';

	type Props = {
		children: Snippet;
	};

	const { children }: Props = $props();
	const mobile = new IsMobile();
</script>

{#if mobile.current}
	<Portal to="#portal-target-mobile-topbar">
		<div class="with-progressbar">
			<div class="topbar">
				{@render children()}
			</div>

			<div class="progress-bar">
				<ProgressBar progress={uiState.processing.progress} />
			</div>
		</div>
	</Portal>
{/if}

<style>
	.topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.25rem 1rem;
		gap: 1rem;
		width: 100%;
	}

	.with-progressbar {
		border-bottom: 1px solid rgb(from var(--gray) r g b / 25%);
	}

	.with-progressbar {
		position: relative;
		.progress-bar {
			display: flex;
			align-items: end;
			position: absolute;
			inset: auto 0 0 0;
		}
	}
</style>

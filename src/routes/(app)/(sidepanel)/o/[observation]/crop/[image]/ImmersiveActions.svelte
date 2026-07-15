<script lang="ts">
	import { fade } from 'svelte/transition';

	import IconDelete from '~icons/ri/delete-bin-line';
	import IconReset from '~icons/ri/reset-left-fill';
	import ButtonInk from '$lib/ButtonInk.svelte';
	import ConfidencePercentage from '$lib/ConfidencePercentage.svelte';

	import { focusedImage, zoom } from './+page.svelte';
	import {
		canRevertCrop,
		deleteBoundingBox,
		getInitialCrops,
		revertToInferredCrop,
	} from './actions.svelte';
	import { activeTool } from './Toolbar.svelte';

	const focused = $derived(focusedImage());
	const confidence = $derived(getInitialCrops()[focused?.id ?? '']?.confidence);
</script>

{#if !zoom.panning && zoom.scale <= 1.2}
	<div class="immersive-actions" out:fade={{ duration: 100 }}>
		{#if focused}
			<ButtonInk
				disabled={!canRevertCrop(focused.id)}
				onclick={async () => {
					await revertToInferredCrop(focused.id);
				}}
			>
				<IconReset />
				Réinit.
			</ButtonInk>

			<div class="confidence">
				{#if confidence}
					<ConfidencePercentage compact value={confidence} />
					<p>Confiance</p>
				{/if}
			</div>
			<ButtonInk
				dangerous
				onclick={async () => {
					await deleteBoundingBox(focused.id);
				}}
			>
				<IconDelete />
				Suppr.
			</ButtonInk>
		{:else}
			<p>
				{activeTool().mobileHelp ?? activeTool().help}
			</p>
		{/if}
	</div>
{/if}

<style>
	.immersive-actions {
		display: grid;
		grid-template-columns: repeat(auto-fill, 25%);
		align-items: center;
		justify-content: center;
		border-radius: var(--corner-radius);
		text-align: center;
		color: white;
		background: rgba(0 0 0 / 0.75);
		padding: 0.5rem 2rem;
		gap: 1em;
		--bg: transparent;
		color-scheme: dark;
	}

	.confidence {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}

	p {
		font-size: 0.8rem;
		color: rgba(255 255 255 / 0.75);
		grid-column: 1 / 4;
	}
</style>

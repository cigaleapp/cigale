<script lang="ts">
	import ButtonInk from '$lib/ButtonInk.svelte';
	import Field from '$lib/Field.svelte';
	import ProgressTree from '$lib/ProgressTree.svelte';

	import { exporter } from './platforms.svelte.js';
</script>

{#if exporter.state !== 'idle'}
	<div class="progress">
		<Field composite>
			{#snippet label()}
				<div class="header-with-cancel">
					{#if exporter.uploading}
						<span>Envoi en cours</span>
						<div class="cancel">
							<ButtonInk
								onclick={() => {
									exporter.aborter.abort();
								}}
							>
								Annuler
							</ButtonInk>
						</div>
					{:else}
						<span>Envoi terminé</span>
					{/if}
				</div>
			{/snippet}
			<ProgressTree bind:push={exporter.notify} bind:finish={exporter.notifyDone} />
		</Field>
	</div>
{/if}

{#if exporter.error}
	<div class="error">
		<p>{exporter.error}</p>
	</div>
{/if}

<style>
	.header-with-cancel {
		display: flex;
		gap: 1em;
		justify-content: space-between;
		/* Prevents jumping around when cancel button (dis)appears */
		height: 1.25lh;
	}
</style>

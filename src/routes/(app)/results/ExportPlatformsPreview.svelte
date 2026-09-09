<script lang="ts">
	import IconOpenExternal from '~icons/ri/arrow-right-up-box-line';
	import Account from '$lib/Account.svelte';
	import ButtonInk from '$lib/ButtonInk.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import EnumButtons from '$lib/EnumButtons.svelte';
	import Field from '$lib/Field.svelte';
	import { tables } from '$lib/idb.svelte.js';
	import ProgressTree from '$lib/ProgressTree.svelte';
	import { uiState } from '$lib/uistate.svelte.js';

	import { exporter } from './platforms.svelte.js';

	const externalPageUrl = $derived.by(() => {
		if (!exporter.account) return;
		const protocol = uiState.currentProtocol;
		const session = uiState.currentSession;

		if (!protocol) return;
		if (!session) return;
		return exporter.account.sessionPage(protocol, session);
	});
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

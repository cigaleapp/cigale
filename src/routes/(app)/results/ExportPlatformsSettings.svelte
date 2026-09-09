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

	const externalPageUrl = $derived(
		exporter.sessionAccount?.sessionPage(uiState.currentProtocol, uiState.currentSession)
	);
</script>

{#if exporter.sessionProvider && externalPageUrl}
	<div class="page">
		<Field label="Disponible sur {exporter.sessionProvider.displayName}">
			<ButtonSecondary
				onclick={() => {
					if (!externalPageUrl) return;
					window.open(externalPageUrl, '_blank');
				}}
			>
				<IconOpenExternal />
				Voir
			</ButtonSecondary>
		</Field>
	</div>
{/if}

<div class="providers">
	<Field label={exporter.sessionAccount ? 'Changer de compte' : 'Choisir un compte'}>
		<EnumButtons
			cards
			value={exporter.selectedAccountId}
			options={exporter.compatibleAccounts.map((account) => ({
				key: account.id,
				label: account.displayName,
				account,
			}))}
			onchange={(id) => {
				exporter.selectAccount(id);
			}}
		>
			{#snippet children({ account })}
				<Account {account} />
			{/snippet}
		</EnumButtons>
	</Field>
</div>

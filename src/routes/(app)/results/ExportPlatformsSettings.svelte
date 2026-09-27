<script lang="ts">
	import IconOpenExternal from '~icons/ri/arrow-right-up-box-line';
	import Account from '$lib/Account.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import EnumButtons from '$lib/EnumButtons.svelte';
	import Field from '$lib/Field.svelte';
	import { uiState } from '$lib/uistate.svelte.js';

	import { exporter } from './platforms.svelte.js';

	const externalPageUrl = $derived(
		exporter.sessionAccount?.sessionPage(uiState.currentProtocol, uiState.currentSession)
	);
</script>

<div class="page">
	{#if exporter.sessionProvider && externalPageUrl && !exporter.uploading}
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
	{:else}
		<Field label={exporter.uploading ? 'Envoi…' : 'Pas encore envoyé'}>
			<ButtonSecondary disabled onclick={() => {}}>
				<IconOpenExternal />
				Voir
			</ButtonSecondary>
		</Field>
	{/if}
</div>

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

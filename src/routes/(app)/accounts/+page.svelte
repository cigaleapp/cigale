<script lang="ts">
	import { KoboToolbox } from '$lib/accounts.js';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import Field from '$lib/Field.svelte';
	import { tables } from '$lib/idb.svelte.js';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import ModalConfirm from '$lib/ModalConfirm.svelte';

	const { data } = $props();

	let kobocollectModal: undefined | (() => void) = $state();
	let kobocollectToken = $state('');
	let kobocollectForm = $state('');
	const kobocollectAccount = $derived(
		kobocollectForm ? new KoboToolbox(new URL(kobocollectForm)) : undefined
	);
</script>

<ModalConfirm
	key="modal_add_kobotoolbox_account"
	title="Ajouter un compte KoboToolbox"
	confirm="Se connecter"
	bind:open={kobocollectModal}
	onconfirm={async () => {
		if (!kobocollectAccount) return;
		kobocollectAccount.token = kobocollectToken;
		const data = await kobocollectAccount.login();
		await tables.Account.add(data);
	}}
>
	<Field label="URL du formulaire">
		<InlineTextInput label="Formulaire" bind:value={kobocollectForm} />
	</Field>
	<Field label="Token">
		<InlineTextInput label="Token" bind:value={kobocollectToken} />
	</Field>
	{#if kobocollectAccount}
		<ButtonSecondary onclick={() => {
			window.open(kobocollectAccount.tokenURL, "_blank")
		}}>Obtenir le token</ButtonSecondary>
	{/if}
</ModalConfirm>

<ButtonSecondary onclick={() => kobocollectModal()}>
	{#if kobocollectAccount}
		<img src={kobocollectAccount.logoURL} alt="" class="logo" />
	{/if}
	Ajouter un compte KoboToolbox
</ButtonSecondary>

<ul>
	{#each data.accounts as account (account.id)}
		<li>
			<img src={account.avatarURL.href} />
			{account.displayName}
		</li>
	{/each}
</ul>

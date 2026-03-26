<script lang="ts">
	import type { Snapshot } from './$types.js';

	import { KoboToolbox } from '$lib/accounts/registry.js';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import Field from '$lib/Field.svelte';
	import { tables } from '$lib/idb.svelte.js';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import ModalConfirm from '$lib/ModalConfirm.svelte';

	let kobo = $state({
		modal: () => {},
		token: '',
		form: '',
		error: '',
	});

	const kobocollectAccount = $derived(
		kobo.form ? new KoboToolbox(new URL(kobo.form)) : undefined
	);

	export const snapshot: Snapshot<typeof kobo> = {
		capture: () => kobo,
		restore: (captured) => {
			kobo = captured;
		},
	};
</script>

<ModalConfirm
	key="modal_add_kobotoolbox_account"
	title="Ajouter un compte KoboToolbox"
	confirm="Se connecter"
	bind:open={kobo.modal}
	onconfirm={async () => {
		if (!kobocollectAccount) return;
		kobocollectAccount.token = kobo.token;
		// try {
		const data = await kobocollectAccount.login();
		await tables.Account.add(data);
		// } catch (error) {
		// 	console.error(error);
		// 	kobo.error = String(error);
		// 	throw error;
		// }
	}}
>
	<Field label="URL du formulaire">
		<InlineTextInput label="Formulaire" bind:value={kobo.form} />
	</Field>
	<Field label="Token">
		<InlineTextInput label="Token" bind:value={kobo.token} />
	</Field>
	{#if kobocollectAccount}
		<ButtonSecondary
			onclick={() => {
				window.open(kobocollectAccount.tokenURL, '_blank');
			}}>Obtenir le token</ButtonSecondary
		>
	{/if}
</ModalConfirm>

{#if kobo.error}
	<div class="error">
		{kobo.error}
	</div>
{/if}

<ButtonSecondary onclick={() => kobo.modal()}>
	{#if kobocollectAccount}
		<img src={kobocollectAccount.logoURL.href} alt="" class="logo" />
	{/if}
	Ajouter un compte KoboToolbox
</ButtonSecondary>

<ul>
	{#each tables.Account.state as account (account.id)}
		<li>
			<img src={account.avatarURL.href} />
			{account.displayName}
		</li>
	{/each}
</ul>

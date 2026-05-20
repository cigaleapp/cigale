<script lang="ts">
	import type { AccountConstructor, LoginData } from '$lib/accounts/types.js';

	import { databaseHandle, tables } from '$lib/idb.svelte.js';
	import ModalConfirm from '$lib/ModalConfirm.svelte';

	import ModalAddAccountOauth from './ModalAddAccountOauth.svelte';
	import ModalAddAccountToken from './ModalAddAccountToken.svelte';

	interface Props {
		adding: undefined | AccountConstructor;
		open: undefined | (() => Promise<boolean>);
	}

	let { open = $bindable(), adding }: Props = $props();

	let loginData: undefined | LoginData = $state();

	const db = $derived(databaseHandle());
</script>

<ModalConfirm
	key="modal_add_account"
	title="Ajouter un compte {adding?.displayName}"
	confirm="Ajouter"
	bind:open
	oncancel={() => {
		loginData = undefined;
	}}
	onconfirm={async () => {
		if (!adding) return;
		if (!loginData) return;
		const account = await adding.login(db, loginData);
		await tables.Account.set({ ...account, id: `${account.type}:${account.id}`, addedAt: new Date().toISOString() });
		loginData = undefined;
	}}
>
	<div class="add-account">
		{#if adding?.auth === 'token'}
			<ModalAddAccountToken bind:loginData {adding} />
		{:else if adding?.auth === 'oauth'}
			<ModalAddAccountOauth bind:loginData {adding} />
		{/if}
	</div>
</ModalConfirm>

<style>
	.add-account {
		padding-left: 2em;
		width: 100%;
	}
</style>

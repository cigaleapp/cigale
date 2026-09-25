<script lang="ts">
	import type * as DB from '$lib/database.js';

	import IconDisconnect from '~icons/ri/close-circle-line';
	import IconUser from '~icons/ri/user-line';
	import { providers } from '$lib/accounts/registry.js';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import { corsfix, readableOn } from '$lib/utils.js';

	interface Props {
		tag?: string;
		account: DB.Account;
		disconnect: () => Promise<void>;
	}

	const { tag = 'li', account, disconnect }: Props = $props();

	const provider = $derived(providers.get(account.type));
</script>

<svelte:element this={tag}>
	{#if account.avatarURL}
		<img
			class="avatar"
			src={corsfix(account.avatarURL.href)}
			alt="Photo de {account.username}"
		/>
	{:else}
		<div
			class="avatar empty"
			style:background-color={'color' in account ? account.color : undefined}
			style:color={'color' in account ? readableOn(account.color) : undefined}
		>
			<IconUser />
		</div>
	{/if}

	<p>
		<strong>{account.displayName}</strong>
		{#if provider}
			<span class="with-provider-logo">
				<img src={provider.logoURL.href} alt="Logo de {provider.displayName}" />
				<span>
					{provider.displayName}
					{#if 'domain' in account}
						·
						{account.domain}
					{/if}
				</span>
			</span>
		{:else}
			<strong class="error">Type de compte inconnu</strong>
		{/if}
	</p>
	<section class="actions">
		<ButtonIcon dangerous onclick={disconnect} help="Déconnecter">
			<IconDisconnect />
		</ButtonIcon>
	</section>
</svelte:element>

<style>
	li {
		list-style: none;
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	li > :nth-child(2) {
		width: calc(min(100%, 20rem));
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 0.25em;
	}

	li strong {
		font-size: 1rem;
	}

	li img,
	li .avatar {
		height: 3rem;
		width: 3rem;
		border-radius: var(--corner-radius);
		&.avatar {
			border-radius: 50%;
		}

		&.avatar.empty {
			border: 2px solid var(--faint);
			display: flex;
			justify-content: center;
			align-items: center;
		}
	}

	li .with-provider-logo {
		display: inline-flex;
		align-items: center;
		gap: 0.2em;
		font-size: 0.9em;

		img {
			height: 1.4em;
			width: 1.4em;
		}
	}
</style>

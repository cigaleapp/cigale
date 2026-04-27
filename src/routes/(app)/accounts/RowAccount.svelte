<script lang="ts">
	import type * as DB from '$lib/database.js';
	import type { Snippet } from 'svelte';

	import { format as formatDate, formatDistanceToNow } from 'date-fns';

	import IconDisconnect from '~icons/ri/close-circle-line';
	import { providers } from '$lib/accounts/registry.js';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import OverflowableText from '$lib/OverflowableText.svelte';
	import { tooltip } from '$lib/tooltips.js';

	interface Props {
		tag?: string;
		account: DB.Account;
		disconnect: () => Promise<void>;
	}

	const { tag = 'li', account, disconnect }: Props = $props();

	const provider = $derived(providers.get(account.type));
</script>

<svelte:element this={tag}>
	<img
		class="avatar"
		src="https://cors.gwen.works/{account.avatarURL.href}"
		alt="Photo de {account.username}"
	/>
	<p>
		<strong>{account.displayName}</strong>
		{#if provider}
			<span class="with-provider-logo">
				<img src={provider.logoURL.href} alt="Logo de {provider.displayName}" />
				<span>{provider.displayName}</span>
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

	li img {
		height: 3rem;
		width: 3rem;
		border-radius: var(--corner-radius);
		&.avatar {
			border-radius: 50%;
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

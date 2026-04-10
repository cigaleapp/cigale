<script lang="ts">
	import type * as DB from '$lib/database.js';
	import type { Snippet } from 'svelte';

	import { format as formatDate, formatDistanceToNow } from 'date-fns';

	import { providers } from '$lib/accounts/registry.js';
	import OverflowableText from '$lib/OverflowableText.svelte';
	import { tooltip } from '$lib/tooltips.js';

	interface Props {
		tag?: string;
		account: DB.Account;
		action: Snippet;
	}

	const { tag = 'li', account, action }: Props = $props();

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
				&nbsp;&middot;&nbsp;
				<span
					class="added-at"
					use:tooltip={`Ajouté le ${formatDate(account.addedAt, 'PPPpp')}`}
				>
					<OverflowableText
						no-tooltip
						text={formatDistanceToNow(account.addedAt, { addSuffix: true })}
					/>
				</span>
			</span>
		{:else}
			<strong class="error">Type de compte inconnu</strong>
		{/if}
	</p>
	<div class="action">{@render action()}</div>
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
		font-size: 1.2em;
	}

	li img {
		height: 3.7rem;
		width: 3.7rem;
		border-radius: var(--corner-radius);
		&.avatar {
			border-radius: 50%;
		}
	}

	li .with-provider-logo {
		display: inline-flex;
		align-items: center;
		gap: 0.2em;

		img {
			height: 1.4em;
			width: 1.4em;
		}
	}
</style>

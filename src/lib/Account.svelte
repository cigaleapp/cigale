<script lang="ts">
	import type * as DB from '$lib/database.js';

	import { providers } from '$lib/accounts/registry.js';
	import CompositeAvatar from '$lib/CompositeAvatar.svelte';
	import { databaseHandle } from '$lib/idb.svelte.js';
	import OverflowableText from '$lib/OverflowableText.svelte';

	interface Props {
		account: DB.Account | undefined;
	}
	const { account }: Props = $props();
	const provider = $derived(account ? providers.get(account.type) : undefined);

	async function serverName(account: DB.Account) {
		if (!('domain' in account)) return undefined;
		if (!domain.account) return undefined;
		if (!provider) return;
		const servers = await provider.servers(databaseHandle());
		return servers.find((server) => server.domain === account.domain)?.name ?? account.domain;
	}
</script>

<div class="account">
	<div class="icon">
		{#if account && provider}
			<CompositeAvatar
				avatar={account.avatarURL}
				avatarColor={'color' in account ? account.color : undefined}
				sublogo={provider.logoURL}
			/>
		{:else}
			?
		{/if}
	</div>
	<div class="text">
		{#if account}
			<div class="name">
				<OverflowableText text={account.displayName} />
			</div>
			<div class="provider">
				{#await serverName(account) then server}
					<OverflowableText
						text={[provider?.displayName ?? '(Plateforme inconnue)', server]
							.filter(Boolean)
							.join(' · ')}
					/>
				{/await}
			</div>
		{:else}
			Compte introuvable
		{/if}
	</div>
</div>

<style>
	.account {
		display: flex;
		align-items: center;
		gap: 1em;
	}

	.icon {
		font-size: 1.25em;
	}

	.provider {
		color: var(--gay);
	}
</style>

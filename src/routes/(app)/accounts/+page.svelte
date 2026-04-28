<script lang="ts">
	import type { AccountConstructor } from '$lib/accounts/types.js';

	import { providers } from '$lib/accounts/registry.js';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import { databaseHandle, tables } from '$lib/idb.svelte.js';
	import Logo from '$lib/Logo.svelte';

	import TopbarBackToHome from '../TopbarBackToHome.svelte';
	import ModalAddAccount from './ModalAddAccount.svelte';
	import RowAccount from './RowAccount.svelte';

	let login: undefined | (() => Promise<boolean>) = $state();
	let adding = $state<undefined | AccountConstructor>();

	const db = $derived(databaseHandle());
</script>

<ModalAddAccount {adding} bind:open={login} />

<TopbarBackToHome>Comptes</TopbarBackToHome>

<main>
	<header>
		<section class="text">
			<h1>Comptes</h1>
			<p>Pour ouvrir ou publier des sessions en ligne</p>
		</section>
		<section class="actions">
			{#each providers.list() as provider (provider.id)}
				<ButtonSecondary
					onclick={() => {
						adding = provider;
						login?.();
					}}
				>
					<img
						class="logo"
						src={provider.logoURL.href}
						alt="Logo de {provider.displayName}"
					/>
					<p>{provider.displayName}</p>
				</ButtonSecondary>
			{/each}
		</section>
	</header>

	<section>
		<ul>
			{#each tables.Account.state as account (account.id)}
				<RowAccount
					{account}
					disconnect={async () => {
						const provider = providers.get(account.type);
						if (!provider) return;
						const acct = provider.fromDatabase(db, account);
						await acct.logout();
						await tables.Account.remove(account.id);
					}}
				/>
			{:else}
				<li class="empty">
					<Logo variant="empty" />
					Aucun compte
				</li>
			{/each}
		</ul>
	</section>
</main>

<style>
	main {
		max-width: 600px;
		width: 100%;
		margin: 3rem auto;
	}

	header {
		margin-bottom: 4rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		flex-wrap: wrap;
		gap: 1rem;

		@media (max-width: 600px) {
			justify-content: center;
		}
	}

	header .text {
		display: flex;
		flex-direction: column;

		@media (max-width: 600px) {
			align-items: center;
			justify-content: center;
		}

		h1,
		p {
			text-align: center;
			padding: 0;
		}
	}

	header .actions {
		display: flex;
		align-items: center;
		gap: 1em;
		flex-wrap: wrap;
	}

	ul {
		display: flex;
		flex-direction: column;
		gap: 1.7rem;
		padding: 0;
	}

	li {
		list-style: none;
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	/* .logo + * {
		width: calc(min(100%, 20rem));
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 0.25em;
	} */

	.logo {
		height: 1.7rem;
		width: 1.7rem;
		border-radius: var(--corner-radius);
	}

	li.empty {
		color: var(--gay);
		--size: 5rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}
</style>

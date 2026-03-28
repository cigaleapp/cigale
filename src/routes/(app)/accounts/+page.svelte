<script lang="ts">
	import type { AccountConstructor, LoginData } from '$lib/accounts/types.js';

	import KoboToolbox from '$lib/accounts/kobotoolbox.js';
	import { providers } from '$lib/accounts/registry.js';
	import ButtonInk from '$lib/ButtonInk.svelte';
	import Field from '$lib/Field.svelte';
	import { databaseHandle, tables } from '$lib/idb.svelte.js';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import ModalConfirm from '$lib/ModalConfirm.svelte';
	import RadioButtons from '$lib/RadioButtons.svelte';
	import { safeJSONParse } from '$lib/utils.js';

	import RowAccount from './RowAccount.svelte';

	let adding: undefined | AccountConstructor = $state();
	let login: undefined | (() => Promise<boolean>) = $state();
	let loginData: undefined | LoginData = $state();

	const db = $derived(databaseHandle());
</script>

<ModalConfirm
	key="modal_add_account"
	title="Ajouter un compte {adding?.displayName}"
	confirm="Se connecter"
	bind:open={login}
	onconfirm={async () => {
		if (!adding) return;
		if (!loginData) return;
		const account = await adding.login(db, loginData);
		await tables.Account.add({ ...account, addedAt: new Date().toISOString() });
	}}
>
	{#if adding}
		{#if adding.servers.length > 1}
			<Field label="Serveur">
				<RadioButtons
					options={adding.servers.map((server) => ({ key: server, label: server }))}
					bind:value={
						() => loginData?.server,
						(server) => {
							if (!server) return;
							loginData ??= { server };
							loginData.server = server;
						}
					}
				/>
			</Field>
		{/if}

		{#if adding.auth === 'token'}
			<Field>
				{#snippet label()}
					Token
					{#if adding?.id === 'kobotoolbox' && loginData}
						<p>
							Connecte-toi sur <a href="https://{loginData.server}" target="_blank">
								{loginData.server}
							</a>, puis copier-colle
							<a
								href={KoboToolbox.tokenPageURL(loginData.server).href}
								target="_blank"
							>
								ton token
							</a>
						</p>
					{/if}
				{/snippet}

				<InlineTextInput
					label="Token"
					bind:value={
						() => loginData?.token ?? '',
						(token) => {
							if (!loginData) return;
							if (/^[a-fA-F0-9]$/.test(token.trim())) {
								loginData.token = token;
							} else if (/\{.+\}/s.test(token)) {
								const jsonPart = safeJSONParse(/(\{.+\})/s.exec(token)?.[0] ?? '');
								loginData.token = jsonPart.token ?? '';
								if (!loginData.token && 'detail' in jsonPart.token) {
									loginData.token =
										"Rééssayer en se connectant d'abord à KoboCollect";
								}
							}

							if (!loginData.token) {
								loginData.token = 'Token invalide';
							}
						}
					}
				></InlineTextInput>
			</Field>
		{/if}
	{/if}
</ModalConfirm>
<main>
	<header>
		<h1>Comptes</h1>
		<p>
			Permet d'ouvrir des sessions distantes ou de publier des sessions vers des services
			tierces
		</p>
	</header>

	<section>
		<h2>Ajouter</h2>
		<ul>
			{#each providers.list() as provider (provider.id)}
				<li>
					<img src={provider.logoURL.href} alt="Logo de {provider.displayName}" />
					<p>
						{provider.displayName}
					</p>
					<ButtonInk
						onclick={() => {
							adding = provider;
							login?.();
						}}
					>
						Ajouter
					</ButtonInk>
				</li>
			{/each}
		</ul>
	</section>

	<section>
		<h2>Connectés</h2>
		<ul>
			{#each tables.Account.state as account (account.id)}
				<RowAccount {account}>
					{#snippet action()}
						<ButtonInk
							dangerous
							onclick={async () => {
								const provider = providers.get(account.type);
								if (!provider) return;
								const acct = provider.fromDatabase(db, account);
								await acct.logout();
								await tables.Account.remove(account.id);
							}}
						>
							Déconnecter
						</ButtonInk>
					{/snippet}
				</RowAccount>
			{:else}
				<li class="empty">Aucun compte</li>
			{/each}
		</ul>
	</section>
</main>

<style>
	main {
		width: calc(min(100%, 600px));
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 3rem;
	}

	section {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	ul {
		display: flex;
		flex-direction: column;
		gap: 1.7rem;
	}

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

	li img {
		height: 4rem;
		width: 4rem;
		border-radius: var(--corner-radius);
	}

	li.empty {
		color: var(--gay);
	}
</style>

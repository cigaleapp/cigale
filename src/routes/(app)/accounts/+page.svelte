<script lang="ts">
	import type { Snapshot } from './$types.js';
	import type { Account, AccountConstructor, LoginData } from '$lib/accounts/types.js';

	import { format as formatDate, formatDistanceToNow } from 'date-fns';

	import KoboToolbox from '$lib/accounts/kobotoolbox.js';
	import { providers } from '$lib/accounts/registry.js';
	import ButtonInk from '$lib/ButtonInk.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import Field from '$lib/Field.svelte';
	import { databaseHandle, tables } from '$lib/idb.svelte.js';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import ModalConfirm from '$lib/ModalConfirm.svelte';
	import RadioButtons from '$lib/RadioButtons.svelte';
	import { tooltip } from '$lib/tooltips.js';
	import { safeJSONParse } from '$lib/utils.js';

	let adding: undefined | AccountConstructor = $state();
	let login: undefined | (() => Promise<boolean>) = $state();
	let loginData: undefined | LoginData = $state();
	let loginError = $state('');

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
		await tables.Account.add(account);
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
				{@const provider = providers.get(account.type)}
				<li>
					<img
						class="avatar"
						src="https://cors.gwen.works/{account.avatarURL.href}"
						alt="Photo de {account.username}"
					/>
					<p>
						<strong>{account.displayName}</strong>
						{#if provider}
							<span class="with-provider-logo">
								<img
									src={provider.logoURL.href}
									alt="Logo de {provider.displayName}"
								/>
								<span>{provider.displayName}</span>
								&nbsp;&middot;&nbsp;
								<span
									class="added-at"
									use:tooltip={`Ajouté le ${formatDate(account.addedAt, 'PPPpp')}`}
								>
									{formatDistanceToNow(account.addedAt, { addSuffix: true })}
								</span>
							</span>
						{:else}
							<strong class="error">Type de compte inconnu</strong>
						{/if}
					</p>
					<ButtonInk
						dangerous
						onclick={async () => {
							if (!provider) return;
							const acct = provider.fromDatabase(db, account);
							await acct.logout();
							await tables.Account.remove(account.id);
						}}
					>
						Déconnecter
					</ButtonInk>
				</li>
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
		gap: 1rem;
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

	li.empty {
		color: var(--gay);
	}
</style>

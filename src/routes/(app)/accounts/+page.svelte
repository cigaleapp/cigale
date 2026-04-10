<script lang="ts">
	import type { AccountConstructor, LoginData } from '$lib/accounts/types.js';

	import { fade } from 'svelte/transition';

	import IconCheck from '~icons/ri/check-line';
	import IconFail from '~icons/ri/error-warning-line';
	import KoboToolbox from '$lib/accounts/kobotoolbox.js';
	import { providers } from '$lib/accounts/registry.js';
	import ButtonInk from '$lib/ButtonInk.svelte';
	import { errorMessage } from '$lib/i18n.js';
	import { databaseHandle, tables } from '$lib/idb.svelte.js';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import LoadingSpinner from '$lib/LoadingSpinner.svelte';
	import ModalConfirm from '$lib/ModalConfirm.svelte';
	import RadioButtons from '$lib/RadioButtons.svelte';
	import Stepper from '$lib/Stepper.svelte';
	import { tooltip } from '$lib/tooltips.js';
	import { orEmpty, safeJSONParse } from '$lib/utils.js';

	import RowAccount from './RowAccount.svelte';

	let adding: undefined | AccountConstructor = $state();
	let login: undefined | (() => Promise<boolean>) = $state();
	let loginData: undefined | LoginData = $state();

	let tokenValidation = $state<'empty' | 'loading' | 'ok' | (string & {})>('empty');
	$effect(() => {
		void (async () => {
			if (!loginData?.token) {
				tokenValidation = 'empty';
				return;
			}

			tokenValidation = 'loading';
			const err = await adding?.checkAuth(loginData).catch((e) => errorMessage(e));
			tokenValidation = err ?? 'ok';
		})();
	});

	const db = $derived(databaseHandle());
</script>

<ModalConfirm
	key="modal_add_account"
	title="Ajouter un compte {adding?.displayName}"
	confirm="Se connecter"
	bind:open={login}
	oncancel={() => {
		loginData = undefined;
	}}
	onconfirm={async () => {
		if (!adding) return;
		if (!loginData) return;
		const account = await adding.login(db, loginData);
		await tables.Account.add({ ...account, addedAt: new Date().toISOString() });
		loginData = undefined;
	}}
>
	<div class="add-account">
		{#if adding?.auth === 'token'}
			<Stepper
				steps={[
					...orEmpty(adding.servers.length > 1, {
						name: 'step_server' as const,
						title: 'Choix du serveur',
					}),
					{ name: 'step_login', title: 'Connexion' },
					{ name: 'step_token', title: 'Token' },
				]}
			>
				{#snippet step_server({ done })}
					<RadioButtons
						options={adding!.servers.map(({ domain, name }) => ({
							key: domain,
							label: name ?? domain,
							subtext: name ? domain : '',
						}))}
						bind:value={
							() => loginData?.server,
							(server) => {
								if (!server) return;
								loginData ??= { server };
								loginData.server = server;
								done();
							}
						}
					/>
				{/snippet}
				{#snippet step_login({ done })}
					{#if loginData}
						<p>
							Connecte-toi sur
							<a
								href="https://{loginData.server}"
								target="_blank"
								onclick={() => {
									done();
								}}
							>
								{loginData.server}
							</a>
						</p>
					{/if}
				{/snippet}
				{#snippet step_token({ done })}
					{#if loginData}
						<p>
							Copie-colle
							<a
								href={KoboToolbox.tokenPageURL(loginData.server).href}
								target="_blank"
							>
								ton token
							</a>
							(c'est la partie entre les {'{}'})
						</p>
						<div class="token-with-feedback">
							<InlineTextInput
								label="Token"
								value={loginData?.token ?? ''}
								onblur={(input) => {
									if (!loginData) return;

									let json: undefined | { token?: string } = undefined;

									// if (/^[a-fA-F0-9]+$/.test(input.trim())) {
									// 	json = { token: input.trim() };
									if (/\{.+}/s.test(input)) {
										json = safeJSONParse(/(\{.+})/s.exec(input)?.[0] ?? '');
									} else {
										json = safeJSONParse('{' + input + '}') ?? {
											token: input.trim(),
										};
									}

									if (json?.token) {
										loginData.token = String(json.token);
										done();
									} else {
										loginData.token = '';
									}
								}}
							></InlineTextInput>
							{#if tokenValidation === 'ok'}
								<div class="feedback ok" in:fade={{ duration: 200 }}>
									<IconCheck />
									Token valide
								</div>
							{:else if tokenValidation === 'loading'}
								<div class="feedback" in:fade={{ duration: 200 }}>
									<LoadingSpinner --size="1em" />
									Vérification…
								</div>
							{:else if tokenValidation === 'empty'}
								<div class="feedback" in:fade={{ duration: 200 }}>
									<!-- empty -->
								</div>
							{:else}
								<div
									class="feedback err"
									in:fade={{ duration: 200 }}
									use:tooltip={tokenValidation || 'Erreur inattendue'}
								>
									<IconFail />
									Token invalide
								</div>
							{/if}
						</div>
					{/if}
				{/snippet}
			</Stepper>
		{/if}
	</div>
</ModalConfirm>
<main>
	<header>
		<h1>Comptes</h1>
		<p>Pour ouvrir ou publier des sessions en ligne</p>
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

	.add-account {
		padding-left: 2em;
		width: 100%;

		.token-with-feedback {
			display: flex;
			align-items: center;
			gap: 1em;
			margin-top: 0.5em;
			width: 100%;
		}

		.feedback {
			transition:
				width 250ms ease,
				opacity 100ms ease;
			padding: 1em;
			border-radius: 99999px;
			height: 2ch;
			display: flex;
			justify-content: center;
			align-items: center;
			flex-shrink: 0;
			gap: 0.5ch;
			overflow: hidden;
			white-space: nowrap;

			color: var(--gay);

			&.ok {
				color: var(--fg-success);
				background-color: var(--bg-success);
			}

			&.err {
				color: var(--fg-error);
				background-color: var(--bg-error);
			}
		}
	}
</style>

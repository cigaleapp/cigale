<script lang="ts">
	import type { AccountConstructor, LoginData } from '$lib/accounts/types.js';

	import { CapacitorHttp } from '@capacitor/core';
	import { ArkErrors, type } from 'arktype';
	import { fade } from 'svelte/transition';

	import IconCheck from '~icons/ri/check-line';
	import IconFail from '~icons/ri/error-warning-line';
	import KoboToolbox from '$lib/accounts/kobotoolbox.js';
	import { errorMessage } from '$lib/i18n.js';
	import { databaseHandle, tables } from '$lib/idb.svelte.js';
	import { inAppBrowser } from '$lib/inappbrowser.js';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import LoadingSpinner from '$lib/LoadingSpinner.svelte';
	import ModalConfirm from '$lib/ModalConfirm.svelte';
	import RadioButtons from '$lib/RadioButtons.svelte';
	import Stepper from '$lib/Stepper.svelte';
	import { toasts } from '$lib/toasts.svelte.js';
	import { tooltip } from '$lib/tooltips.js';
	import { orEmpty, safeJSONParse } from '$lib/utils.js';

	interface Props {
		adding: undefined | AccountConstructor;
		open: undefined | (() => Promise<boolean>);
	}

	let { open = $bindable(), adding }: Props = $props();

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
	bind:open
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
								title="Se connecter à {loginData.server}"
								onclick={() => {
									done();
								}}
								{@attach inAppBrowser({
									async onUrlChange(browser, url) {
										if (!loginData) return;

										const kobonaut = await browser
											.cookie('kobonaut')
											.catch(() => null);

										if (!kobonaut) {
											console.debug('kobonaut cookie not found', { url });
											return;
										}

										// Fetch with CapacitorHttp to avoid CORS issue
										// The CORS proxy we usually use doesn't forward cookies, so that isn't an option
										// (see https://github.com/Rob--W/cors-anywhere/issues/56)
										const response = await CapacitorHttp.get({
											url: `https://${loginData.server}/token`,
											headers: {
												Cookie: `kobonaut=${kobonaut}`,
											},
										});

										// In that case, the user probably just isn't logged in on that page, so we wait for another URL change. Weird that kobonaut is set, but whatever.
										// Is can happen when switching between kf. and eu., (happened during testing)
										if (response.status === 401) {
											return;
										}

										if (response.status >= 400) {
											await browser.close();
											toasts.error(
												'Impossible de récupérer le token : échec de la requête'
											);
										}

										const schema = type({ token: 'string' });
										const data = schema(response.data);

										if (data instanceof ArkErrors) {
											await browser.close();
											toasts.error(
												'Impossible de récupérer le token : réponse invalide'
											);
											console.error('Invalid token response', {
												response,
												data,
											});
										} else {
											// So that we aren't already logged-in when adding
											// another account of the same provider
											await browser.clearCookies();
											await browser.close();
											loginData.token = data.token;
											done();
										}
									},
								})}
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
								title="Copie-colle ton token (partie entre les {'{}'})"
								target="_blank"
								{@attach inAppBrowser()}
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

<style>
	.add-account {
		padding-left: 2em;
		width: 100%;
	}

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
</style>

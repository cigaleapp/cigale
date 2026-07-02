<script lang="ts">
	import { ArkErrors } from 'arktype';

	import { page } from '$app/state';
	import Github from '$lib/accounts/github.js';
	import { tables, openDatabase } from '$lib/idb.svelte.js';
	import Logo from '$lib/Logo.svelte';
	import { goto } from '$lib/paths.js';

	async function finish() {
		const code = page.url.searchParams.get('code');
		const state = page.url.searchParams.get('state');

		const db = await openDatabase();

		const account = await Github.login(db, {
			server: 'github.com',
			oauth: {
				authorizationCode: code ?? '',
				state: state ?? '',
				codeVerifier: localStorage.getItem('github_oauth_code_verifier') ?? '',
			},
		});

		await tables.Account.set({
			...account,
			addedAt: new Date().toISOString(),
			id: `github:${account.id}`,
		});

		await goto('/accounts/');
	}
</script>

<div class="callback">
<!-- {#if browser } -->
	{#await (async () => {
		try {
			await finish();
		} catch (e) {
			console.error('Error during GitHub OAuth callback', e);
			throw e;
		}
	})()}}
		<Logo loading />
		<p>Finalisation de la connexion en cours...</p>
	{:then}
		<Logo />
		<p>Connexion réussie, tu peux fermer cet onglet !</p>
	{:catch e}
		<Logo variant="error" />
		<p>Une erreur s'est produite lors de la connexion.</p>
		<code>{e}</code>
		<pre>{e instanceof ArkErrors
				? JSON.stringify(
						e.issues.map((issue) => ({
							a: 67,
						})),
						null,
						2
					)
				: ''}</pre>
	{/await}
</div>

<style>
	.callback {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1em;
		height: 100vh;
		padding: 2em;
		text-align: center;
		--size: 5em;
	}
</style>

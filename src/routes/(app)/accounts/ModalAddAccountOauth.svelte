<script lang="ts">
	import type { AccountConstructor, LoginData } from '$lib/accounts/types.js';

	import { inAppBrowser } from '$lib/inappbrowser.js';
	import Logo from '$lib/Logo.svelte';

	interface Props {
		adding: AccountConstructor;
		loginData: undefined | LoginData;
	}

	let { adding, loginData = $bindable() }: Props = $props();

	const authURL = $derived(adding.authorizeURL());

</script>

<div class="authorize">
	{#if !loginData}
		<a
			href={authURL.toString()}
			title="Se connecter avec {adding.displayName}"
			{@attach inAppBrowser({
				async onUrlChange(browser, url) {
					const query = new URL(url).searchParams;
					if (query.has('code') && query.has('state')) {
						loginData = {
							server: 'github.com',
							oauth: {
								authorizationCode: query.get('code')!,
								state: query.get('state')!,
								codeVerifier: authURL.searchParams.get('code_challenge')!,
							},
						};

						await browser.clearCookies();
						await browser.close();
					}
				},
			})}
		>
			Se connecter
		</a>
	{:else}
		Autorisation obtenue
	{/if}
</div>

<style>
	.authorize {
		height: 100%;
		width: 100%;
	}

	a {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
		height: 100%;
		padding: 1em;
		font-size: 2.5em;
	}
</style>

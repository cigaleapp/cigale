<script lang="ts">
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import Datetime from '$lib/Datetime.svelte';
	import { nukeDatabase, previewingPrNumber } from '$lib/idb.svelte';
	import Modal from '$lib/Modal.svelte';

	const buildCommit = import.meta.env.buildCommit;

	/**
	 * @typedef {object} Props
	 * @property {undefined | (() => void)} [open]
	 */

	/** @type {Props} */
	let { open = $bindable() } = $props();

	/**
	 *
	 * @param {`_${string}`} umbrellaDir
	 */
	function pageURL(umbrellaDir) {
		return `https://cigaleapp.github.io/cigale/${umbrellaDir}/pr-${previewingPrNumber}`;
	}

	/**
	 * @param {`_${string}`} umbrellaDir
	 */
	async function hasPage(umbrellaDir) {
		return fetch(pageURL(umbrellaDir), { method: 'HEAD' })
			.then((res) => res.ok)
			.catch(() => false);
	}
</script>

{#snippet githubUser(
	/** @type {{ url: string; html_url: string; login: string; avatar_url: string }} */ user
)}
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
	<a class="github-user" href={user.html_url} title={`@${user.login}`}>
		<img src={user.avatar_url} alt="Avatar de {user.login}" />
		{#await fetch(user.url).then((res) => res.json())}
			{user.login}
		{:then { name }}
			{name || user.login}
		{:catch _}
			{user.login}
		{/await}
	</a>
{/snippet}

<Modal
	key="modal_preview_pr"
	bind:open
	title="Déploiement de preview pour la PR #{previewingPrNumber}"
>
	{@const prLink = `https://github.com/cigaleapp/cigale/pull/${previewingPrNumber}`}
	{#await fetch(`https://api.github.com/repos/cigaleapp/cigale/pulls/${previewingPrNumber}`).then( (res) => res.json() )}
		<p>
			Déploiement de preview pour la <a href={prLink}>PR #{previewingPrNumber}</a>
		</p>
	{:then { title, user, body }}
		{@const issueNumber = /(Closes|Fixes) #(\d+)/i.exec(body)?.[2]}
		{#if buildCommit}
			{#await fetch(`https://api.github.com/repos/cigaleapp/cigale/commits/${buildCommit}`).then( (res) => res.json() )}
				<span class="build-date">Chargement…</span>
			{:then { commit: { committer: { date } } }}
				<Datetime value={date} show="both" />
			{/await}
		{/if}
		<p>Ceci est un déploiement de preview</p>
		<ul>
			<li>
				<!-- @wc-context: continuation of sentence "deployment PR for..." -->
				pour la PR <a href={prLink}>#{previewingPrNumber} {title}</a> de
				{@render githubUser(user)}
			</li>
			{#if issueNumber}
				<li>
					{#await fetch(`https://api.github.com/repos/cigaleapp/cigale/issues/${issueNumber}`).then( (res) => res.json() ) then { title, number, user, html_url }}
						<!-- @wc-context: continuation of sentence "deployment PR for..." -->
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
						pour l'issue <a href={html_url}>#{number} {title}</a> de
						{@render githubUser(user)}
					{/await}
				</li>
			{/if}
			<br />
		</ul>
		<p>
			{body}
		</p>
	{:catch _}
		#{previewingPrNumber}
	{/await}
	{#snippet footer({ close })}
		{@const open = (/** @type {string} */ url) => () => {
			window.open(url);
			close?.();
		}}
		<ButtonSecondary
			help="Supprime toutes les données pour ce déploiement de preview"
			onclick={() => {
				nukeDatabase();
				window.location.reload();
			}}
		>
			Nettoyer la base de données
		</ButtonSecondary>

		<ButtonSecondary
			onclick={open(`https://github.com/cigaleapp/cigale/pull/${previewingPrNumber}`)}
		>
			Voir sur Github
		</ButtonSecondary>

		{#await hasPage('_playwright') then ok}
			{#if ok}
				<ButtonSecondary onclick={open(pageURL('_playwright'))}>Tests E2E</ButtonSecondary>
			{/if}
		{/await}

		{#await hasPage('_vitest') then ok}
			{#if ok}
				<ButtonSecondary onclick={open(pageURL('_vitest'))}>Tests unitaires</ButtonSecondary
				>
			{/if}
		{/await}

		{#await hasPage('_coverage') then ok}
			{#if ok}
				<ButtonSecondary onclick={open(pageURL('_coverage'))}>Coverage</ButtonSecondary>
			{/if}
		{/await}
	{/snippet}
</Modal>

<style>
	p,
	li {
		line-height: 1.5;
	}
	.github-user {
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
		vertical-align: middle;
	}

	.github-user img {
		width: 1.5em;
		height: 1.5em;
		border-radius: 100%;
	}
</style>

<script>
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import { nukeDatabase } from '$lib/idb.svelte';
	import Modal from '$lib/Modal.svelte';
	import { previewingPrNumber } from '$lib/state.svelte';

	/**
	 * @typedef {object} Props
	 * @property {undefined | (() => void)} [open]
	 */

	/** @type {Props} */
	let { open = $bindable() } = $props();
</script>

{#snippet githubUser(
	/** @type {{ url: string; html_url: string; login: string; avatar_url: string }} */ user
)}
	<a class="github-user" href={user.html_url} title={`@${user.login}`}>
		<img src={user.avatar_url} alt="Avatar de {user.login}" />
		{#await fetch(user.url).then((res) => res.json())}
			{user.login}
		{:then { name }}
			{name}
		{:catch _}
			{user.login}
		{/await}
	</a>
{/snippet}

<Modal key="preview-pr" bind:open title="Preview de la PR #{previewingPrNumber}">
	{@const prLink = `https://github.com/cigaleapp/cigale/pull/${previewingPrNumber}`}
	{#await fetch(`https://api.github.com/repos/cigaleapp/cigale/pulls/${previewingPrNumber}`).then( (res) => res.json() )}
		<p>
			Ceci est un déploiement de preview pour la PR
			<a href={prLink}>
				#{previewingPrNumber}
			</a>
		</p>
	{:then { title, user, issue_url, ...data }}
		<p>Ceci est un déploiement de preview</p>
		<ul>
			<li>
				pour la PR
				<a href={prLink}>{title}</a>
				de
				{@render githubUser(user)}
			</li>
			{#if issue_url}
				<li>
					{#await fetch(issue_url).then((res) => res.json()) then { title, number, user, html_url }}
						pour l'issue <a href={html_url}>#{number} {title}</a> de {@render githubUser(user)}
					{/await}
				</li>
			{/if}
			<br />
		</ul>
		<p>
			{data.body}
		</p>
	{:catch _}
		#{previewingPrNumber}
	{/await}
	{#snippet footer({ close })}
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
			onclick={() => {
				window.open(`https://github.com/cigaleapp/cigale/pull/${previewingPrNumber}`);
				close();
			}}
		>
			Voir sur Github
		</ButtonSecondary>
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

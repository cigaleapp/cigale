<script>
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import { nukeDatabase, previewingPrNumber } from '$lib/idb.svelte';
	import Modal from '$lib/Modal.svelte';
	import { m } from '$lib/simple-messages';

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
	title={m.preview_deployment_for_pr_no({ number: previewingPrNumber })}
>
	{@const prLink = `https://github.com/cigaleapp/cigale/pull/${previewingPrNumber}`}
	{#await fetch(`https://api.github.com/repos/cigaleapp/cigale/pulls/${previewingPrNumber}`).then( (res) => res.json() )}
		<p>
			{@html m.preview_deployment_for_pr_no__html({ number: previewingPrNumber, prLink })}
		</p>
	{:then { title, user, body }}
		{@const issueNumber = /(Closes|Fixes) #(\d+)/i.exec(body)?.[2]}
		<p>{m.preview_deployment_is_for_loaded_first_part()}</p>
		<ul>
			<li>
				{@html m.preview_deployment_is_for_loaded_second_part__html({ title, prLink })}
				{@render githubUser(user)}
			</li>
			{#if issueNumber}
				<li>
					{#await fetch(`https://api.github.com/repos/cigaleapp/cigale/issues/${issueNumber}`).then( (res) => res.json() ) then { title, number, user, html_url }}
						{@html m.preview_deployment_for_issue_no__html({ html_url, number, title })}
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
			help={m.preview_deployment_cleanup_database_help()}
			onclick={() => {
				nukeDatabase();
				window.location.reload();
			}}
		>
			{m.preview_deployment_cleanup_database()}
		</ButtonSecondary>

		<ButtonSecondary
			onclick={open(`https://github.com/cigaleapp/cigale/pull/${previewingPrNumber}`)}
		>
			{m.preview_deployment_view_on_github()}
		</ButtonSecondary>

		{#await hasPage('_playwright') then ok}
			{#if ok}
				<ButtonSecondary onclick={open(pageURL('_playwright'))}>
					{m.preview_deployment_e2e_tests()}
				</ButtonSecondary>
			{/if}
		{/await}

		{#await hasPage('_vitest') then ok}
			{#if ok}
				<ButtonSecondary onclick={open(pageURL('_vitest'))}>
					{m.preview_deployment_unit_tests()}
				</ButtonSecondary>
			{/if}
		{/await}

		{#await hasPage('_coverage') then ok}
			{#if ok}
				<ButtonSecondary onclick={open(pageURL('_coverage'))}>
					{m.preview_deployment_coverage()}
				</ButtonSecondary>
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

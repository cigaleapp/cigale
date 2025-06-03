<script>
	import { page } from '$app/state';
	import { removeNamespaceFromMetadataId } from '$lib/protocols.js';
	import IconTaxonomy from '~icons/ph/graph';
	import IconInfo from '~icons/ph/info';
	import IconOptions from '~icons/ph/list-dashes';
	import IconInference from '~icons/ph/magic-wand';

	const { children, data } = $props();
	const { id, label } = $derived(data.metadata);
</script>

<div class="header-and-scrollable">
	<header>
		<h2>
			<span class="supertitle">Métadonnée</span>
			<span class="title">{label || removeNamespaceFromMetadataId(id)}</span>
			<code class="id">{id}</code>
		</h2>

		<nav>
			{#snippet navlink(
				/** @type {string} */ path,
				/** @type {string} */ name,
				/** @type {import('svelte').Component} */ Icon
			)}
				<a
					href="#/protocols/{data.protocol.id}/metadata/{removeNamespaceFromMetadataId(id)}/{path}"
					class:active={page.url.hash.includes(`/${path}`)}
				>
					<Icon />
					{name}
				</a>
			{/snippet}

			{@render navlink('infos', 'Informations', IconInfo)}
			{@render navlink('options', 'Options', IconOptions)}
			{@render navlink('inference', 'Inférence', IconInference)}
			{@render navlink('taxonomy', 'Taxonomie', IconTaxonomy)}
		</nav>
	</header>

	<div class="scrollable">{@render children()}</div>
</div>

<style>
	.header-and-scrollable {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.scrollable {
		overflow: auto;
	}

	header {
		display: flex;
		/* position: sticky; */
		flex-direction: column;
		/* top: 0; */
		gap: 2rem;
		padding: 2rem;
		border-bottom: 1px solid var(--gay);
	}

	h2 {
		display: flex;
		flex-direction: column;
	}

	h2 * {
		line-height: 1;
	}

	h2 .supertitle {
		font-size: 0.7em;
		text-transform: uppercase;
		letter-spacing: 2px;
	}

	h2 .title {
		font-weight: normal;
		font-size: 2.5rem;
	}

	h2 .id {
		font-size: 0.8em;
		color: var(--gray);
		font-weight: normal;
	}

	nav {
		display: flex;
		gap: 2rem;
	}

	nav a {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--text);
		text-decoration: none;
		position: relative;
	}

	nav a:is(:hover, :focus-visible) {
		color: var(--fg-primary);
	}

	nav a::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: -8px;
		height: 3px;
		border-radius: 10000px;
	}

	nav a.active::after {
		background-color: var(--bg-primary);
	}
</style>

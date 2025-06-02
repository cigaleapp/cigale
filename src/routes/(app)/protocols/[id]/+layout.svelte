<script>
	import { page } from '$app/state';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import { tables } from '$lib/idb.svelte.js';
	import { removeNamespaceFromMetadataId } from '$lib/protocols';
	import { seo } from '$lib/seo.svelte';
	import IconVersioning from '~icons/ph/arrow-circle-up';
	import IconCropping from '~icons/ph/crop';
	import IconExports from '~icons/ph/file-archive';
	import IconInfo from '~icons/ph/info';
	import IconMetadata from '~icons/ph/list-bullets';

	seo({ title: `Protocole ${page.params.id}` });

	const { children, data } = $props();
	let { id, name } = $derived(data);
</script>

<div class="sidebar-and-main">
	<aside>
		<heading>
			<h1>
				<InlineTextInput
					label="Nom du protocole"
					discreet
					value={name}
					onblur={async (newname) => {
						await tables.Protocol.update(id, 'name', newname);
						name = newname;
					}}
				/>
			</h1>
			<code class="subtitle">
				<InlineTextInput
					label="ID du protocole"
					discreet
					value={id}
					onblur={async (newid) => {
						await tables.Protocol.update(id, 'id', newid);
						id = newid;
					}}
				/>
			</code>
		</heading>

		<nav>
			{@render navlink('Informations', 'infos', IconInfo)}
			{@render navlink('Versioning', 'versioning', IconVersioning)}
			{@render navlink('Exports', 'exports', IconExports)}
			{@render navlink('Recadrage', 'cropping', IconCropping)}
			{@render navlink('Métadonnées', 'metadata', IconMetadata)}
			<nav class="metadata">
				{#each data.metadata as key (key)}
					{#await tables.Metadata.get(key) then def}
						<a href="#/protocols/{id}/metadata/{key}">
							<div class="icon-standin"></div>
							{#if def?.label}
								{def.label}
							{:else}
								<code>{removeNamespaceFromMetadataId(key)}</code>
							{/if}
						</a>
					{/await}
				{/each}
			</nav>
		</nav>
	</aside>
	<main>
		{@render children()}
	</main>
</div>

{#snippet navlink(
	/** @type {string} */ name,
	/** @type {string} */ href,
	/** @type {import('svelte').Component} */ Icon
)}
	<a href="#/protocols/{id}/{href}" class="navlink" class:active={page.route.id?.endsWith(href)}>
		<Icon />
		{name}
	</a>
{/snippet}

<style>
	.sidebar-and-main {
		display: flex;
		height: 100%;
	}

	main {
		overflow: auto;
		width: 100%;
	}

	aside {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		height: 100%;
		border-right: 1px solid var(--gray);
		padding: 1.2em;
	}

	h1 {
		font-weight: normal;
		font-size: 2em;
		line-height: 1;
	}

	.subtitle {
		color: var(--gray);
	}

	nav {
		display: flex;
		flex-direction: column;
		gap: 0.75em;
	}

	nav a {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.5em;
		text-decoration: none;
	}

	:global(svg),
	.icon-standin {
		width: 1.5em;
		height: 1.5em;
		flex-shrink: 0;
	}

	nav a :global(:is(svg, .icon-standin)) {
		margin-left: calc(0.5em + 4px);
	}

	nav a::before {
		content: '';
		position: absolute;
		height: 100%;
		width: 4px;
		border-radius: 10000px;
	}

	nav a.active::before {
		background-color: var(--bg-primary);
	}

	nav a:not(.active):is(:hover, :focus-visible)::before {
		background-color: var(--bg-primary-translucent);
	}
</style>

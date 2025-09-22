<script>
	import { page } from '$app/state';
	import IconDatatype from '$lib/IconDatatype.svelte';
	import { tables } from '$lib/idb.svelte.js';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import { METADATA_TYPES, removeNamespaceFromMetadataId } from '$lib/schemas/metadata.js';
	import Tooltip from '$lib/Tooltip.svelte';
	import IconCascades from '~icons/ph/tree-view';
	import IconInfo from '~icons/ph/info';
	import IconOptions from '~icons/ph/list-dashes';
	import IconInference from '~icons/ph/magic-wand';
	import { updater } from '../../updater.svelte.js';
	import { uppercaseFirst } from '$lib/i18n.js';
	import { tooltip } from '$lib/tooltips.js';

	const { children, data } = $props();
	const { id, label, type } = $derived(data.metadata);
</script>

<div class="header-and-scrollable">
	<header>
		<div class="text">
			<span class="supertitle">Métadonnée</span>
			<h2>
				<span class="title">
					<InlineTextInput
						discreet
						help="Nom de la métadonnée"
						value={label || removeNamespaceFromMetadataId(id)}
						onblur={updater(async (p, value) => {
							if (!value) return;
							await tables.Metadata.update(id, 'label', value);
						})}
					/>
				</span>
			</h2>
			<code class="id">
				<Tooltip text="Identifiant de la métadonnée">{removeNamespaceFromMetadataId(id)}</Tooltip>
			</code>
			<div class="datatype">
				<IconDatatype {type} />
				{uppercaseFirst(METADATA_TYPES[type].label ?? '')}
			</div>
		</div>

		<nav>
			{#snippet navlink(
				/** @type {string} */ path,
				/** @type {string} */ name,
				/** @type {import('svelte').Component} */ Icon,
				/** @type {string|undefined} */ help = undefined
			)}
				<a
					href="#/protocols/{data.protocol.id}/metadata/{removeNamespaceFromMetadataId(id)}/{path}"
					class:active={page.url.hash.includes(`/${path}`)}
					use:tooltip={help}
				>
					<Icon />
					{name}
				</a>
			{/snippet}
			{@render navlink('infos', 'Informations', IconInfo)}
			{#if type === 'enum'}
				{@render navlink('options', 'Options', IconOptions)}
				<!-- TODO support inference on non-enums -->
				{@render navlink('inference', 'Inférence', IconInference)}
			{/if}
			{@render navlink(
				'cascades',
				'Cascades',
				IconCascades,
				"Changer les valeurs d'autres métadonnées en fonction de celle-ci"
			)}
		</nav>
	</header>

	<div class="scrollable" class:padded={!page.route.id?.includes('/options')}>
		{@render children()}
	</div>
</div>

<style>
	.header-and-scrollable {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.scrollable {
		overflow: auto;
		height: 100%;
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

	header .text {
		display: flex;
		flex-direction: column;
	}

	header .text * {
		line-height: 1;
		margin: 0;
		padding: 0;
	}

	header .supertitle {
		text-transform: uppercase;
		letter-spacing: 2px;
		font-weight: bold;
		margin-bottom: -0.5em;
	}

	header .title {
		font-weight: normal;
		font-size: 2.5rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	header .datatype {
		display: flex;
		align-items: center;
		gap: 0.5em;
		margin-top: 0.5em;

		:global(svg) {
			font-size: 1.2rem;
		}
	}

	header .id {
		color: var(--gray);
		font-weight: normal;
		margin-top: -0.5em;
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

	.scrollable.padded {
		padding: 2rem 1.75rem;
		:global(> *) {
			max-width: 1000px;
		}
	}
</style>

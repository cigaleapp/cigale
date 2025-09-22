<script>
	import { page } from '$app/state';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import VirtualList from '@sveltejs/svelte-virtual-list';
	import { href } from '$lib/paths.js';
	import { removeNamespaceFromMetadataId } from '$lib/schemas/metadata.js';
	import { slugify } from '$lib/utils.js';
	import IconSearch from '~icons/ph/magnifying-glass';
	import IconClose from '~icons/ph/x';
	import { updater } from '../updater.svelte.js';
	import { set } from '$lib/idb.svelte.js';

	const { data, children } = $props();
	let options = $derived(data.options ?? []);

	let q = $state('');

	let searchResults = $derived(
		q
			? // Using Fuse would be very expensive for metadata with 10k+ options
				options.filter((o) =>
					[o.key, o.label].some((field) => field.toLowerCase().includes(q.toLowerCase()))
				)
			: options
	);

	/**
	 *
	 * @param {string} key
	 */
	function optionUrl(key) {
		return href('/protocols/[id]/metadata/[metadata]/options/[option]', {
			id: data.protocol.id,
			metadata: removeNamespaceFromMetadataId(data.metadata.id),
			option: key
		});
	}
</script>

<div class="aside-and-main">
	<aside>
		<div class="new-option">
			<!-- <IconAdd /> -->
			<InlineTextInput
				discreet
				label="Nom de la nouvelle option"
				placeholder="Nouvelle option…"
				value=""
				onblur={updater(async (m, label) => {
					if (!label) return;

					let key = slugify(label);
					if (options.find((o) => o.key === key)) {
						key += '_' + options.filter((o) => o.key.startsWith(key)).length;
					}

					await set('MetadataOption', {
						id: `${data.metadata.id}:${key}`,
						metadataId: data.metadata.id,
						key,
						label,
						description: ''
					});
				})}
			/>
		</div>
		<search>
			<IconSearch />
			<InlineTextInput
				discreet
				label="Rechercher une option"
				placeholder="Rechercher…"
				bind:value={q}
				onblur={() => {}}
			/>
			<ButtonIcon --font-size="0.7em" onclick={() => (q = '')} help="Effacer la recherche">
				<IconClose />
			</ButtonIcon>
		</search>
		<nav>
			<VirtualList items={searchResults} let:item>
				{@const { key, label } = item}
				<a href={optionUrl(key)} class:active={page.params.option === key}>
					{label}
				</a>
			</VirtualList>
		</nav>
	</aside>
	<div class="content">
		{@render children()}
	</div>
</div>

<style>
	.aside-and-main {
		display: grid;
		grid-template-columns: 300px 1fr;
		height: 100%;
		overflow: hidden;
	}

	aside {
		padding: 2rem;
		border-right: 1px solid var(--gay);
		display: grid;
		grid-template-rows: max-content max-content 1fr;
		overflow: hidden;
	}

	.content {
		flex-grow: 1;
		overflow: auto;
		padding: 2rem;
	}

	search {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		margin-bottom: 1rem;
		border: 2px solid var(--gay);
		border-radius: 0.5rem;
		padding: 0.25rem 0.25rem;
	}

	.new-option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	nav {
		display: flex;
		height: 100%;
		width: 100%;
		min-height: 0;
	}

	nav :global(svelte-virtual-list-viewport) {
		width: 100%;
	}

	nav a {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--text);
		text-decoration: none;
		position: relative;
		margin-left: 8px;
		padding: 0.25em 0;
	}

	nav a:is(:hover, :focus-visible) {
		color: var(--fg-primary);
	}

	nav a::after {
		content: '';
		position: absolute;
		left: -8px;
		top: 0;
		bottom: 0;
		width: 3px;
		border-radius: 10000px;
	}

	nav a.active::after {
		background-color: var(--bg-primary);
	}
</style>

<script>
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { href } from '$lib/paths.js';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import { tables } from '$lib/idb.svelte.js';
	import { removeNamespaceFromMetadataId } from '$lib/schemas/metadata.js';
	import Fuse from 'fuse.js';
	import slugify from 'slugify';
	import IconSearch from '~icons/ph/magnifying-glass';
	import IconClose from '~icons/ph/x';

	const { data, children } = $props();
	let options = $derived('options' in data.metadata ? data.metadata.options : []);

	let q = $state('');

	const searcher = $derived(new Fuse(options, { keys: ['label', 'key', 'description'] }));
	let searchResults = $derived(q ? searcher.search(q).map((result) => result.item) : options);

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
				onblur={async (label, setValue) => {
					if (!label) return;
					const newOption = {
						label,
						description: '',
						key: slugify(label, { lower: true })
					};
					options = [newOption, ...options];
					await tables.Metadata.update(data.metadata.id, 'options', $state.snapshot(options));
					await invalidateAll();
					setValue('');
					// eslint-disable-next-line svelte/no-navigation-without-resolve
					await goto(optionUrl(newOption.key));
				}}
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
			{#each searchResults as { key, label } (key)}
				<a href={optionUrl(key)} class:active={page.params.option === key}>
					{label}
				</a>
			{/each}
		</nav>
	</aside>
	<div class="content">
		{@render children()}
	</div>
</div>

<style>
	.aside-and-main {
		display: flex;
		height: 100%;
		overflow: hidden;
	}

	aside {
		padding: 2rem;
		border-right: 1px solid var(--gay);
		overflow-y: scroll;
	}

	.content {
		flex-grow: 1;
		overflow: auto;
		padding: 2rem;
	}

	nav {
		display: flex;
		flex-direction: column;
		gap: 1rem;
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

	nav a {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--text);
		text-decoration: none;
		position: relative;
		margin-left: 8px;
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

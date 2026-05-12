<script lang="ts">
	import type * as DB from '$lib/database.js';
	import type { NamespacedMetadataID } from '$lib/schemas/common.js';
	import type { Snippet } from 'svelte';

	import { dequal } from 'dequal';
	import Fuse from 'fuse.js';
	import { Debounced, Previous } from 'runed';
	import { fade } from 'svelte/transition';

	import {scrollController}from '$lib/scrollcontroller.svelte.js'
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import Logo from '$lib/Logo.svelte';

	interface Props {
		query: string;
		resultsCount: number;
		children: Snippet<
			[shownDefinitions: DB.Metadata[], searchResults: NamespacedMetadataID[] | undefined]
		>;
		definitions: DB.Metadata[];
		scroll: { y: number };
	}

	let {
		children,
		definitions,
		query = $bindable(),
		resultsCount = $bindable(),
		scroll = $bindable(),
	}: Props = $props();

	const debouncedSearch = new Debounced(() => query, 300);

	$effect(() => {
		if (query === '') debouncedSearch.setImmediately('');
	});

	const searcher = $derived(
		new Fuse(definitions, {
			keys: ['label', 'id', 'description'],
			includeMatches: true,
		})
	);

	const searchResults = $derived(
		debouncedSearch.current
			? searcher
					.search(debouncedSearch.current)
					.map(({ item, matches: [label, id, description] }) => ({
						id: item.id,
						highlights: {
							label,
							id,
							description,
						},
					}))
			: undefined
	);

	const previousSearchResults = new Previous(() => searchResults);

	$effect(() => {
		resultsCount = searchResults?.length ?? 0;
	});

	$effect(() => {
		if (!previousSearchResults.current) return;
		const currentKeys = searchResults?.map((r) => r.id);
		const previousKeys = previousSearchResults.current.map((r) => r.id);
		if (dequal(currentKeys, previousKeys)) return;
		scroll.y = 0;
	});

	const shownDefinitions = $derived(
		definitions
			.filter((def) => searchResults?.some((r) => r.id === def.id) ?? true)
			.map((def) => ({ ...def, group: '' }))
	);
</script>

{#if shownDefinitions.length > 0 || !query}
	<div class="scrollable" data-testid="descriptors" in:fade={{ duration: 200 }}
	
	{@attach scrollController(scroll)}
	>
		{@render children(
			shownDefinitions,
			searchResults?.map((r) => r.id)
		)}
	</div>
{:else}
	<div class="empty">
		<Logo variant="empty" />
		Aucun résultat pour “{query}”
		<br />
		<ButtonSecondary
			onclick={() => {
				query = '';
			}}
		>
			Tout afficher
		</ButtonSecondary>
	</div>
{/if}

<style>
	.loading,
	.empty {
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: 1em;
		padding: 2em;
		/* Logo size */
		--size: 5em;
	}

	.scrollable {
		overflow-y: scroll;
		height: 100%;
		scrollbar-gutter: stable;
	}
</style>

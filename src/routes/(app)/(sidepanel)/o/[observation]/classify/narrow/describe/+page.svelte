<script lang="ts">
	import type * as DB from '$lib/database.js';

	import Fuse from 'fuse.js';
	import { Debounced, watch } from 'runed';

	import { page } from '$app/state';
	import { databaseHandle, tables } from '$lib/idb.svelte.js';
	import Logo from '$lib/Logo.svelte';
	import Metadata from '$lib/Metadata.svelte';
	import {
		deleteMetadataValue,
		metadataOptionsOf,
		storeMetadataValue,
	} from '$lib/metadata/storage.js';
	import MetadataList from '$lib/MetadataList.svelte';
	import { scrollfader } from '$lib/scrollfader.js';
	import { uiState } from '$lib/state.svelte.js';
	import { compareBy, cancellable } from '$lib/utils.js';

	import { narrowingState } from '../+layout.svelte';

	// Destructuring causes unecessary updates since we derive the entire narrowingState object
	const definitions = $derived(narrowingState.definitions);
	const metadataValues = $derived(narrowingState.metadataValues);


	const observation = $derived(tables.Observation.getFromState(page.params.observation ?? ''));

	const debouncedSearch = new Debounced(() => narrowingState.search.query, 300);

	$effect(() => {
		if (narrowingState.search.query === '') debouncedSearch.setImmediately('');
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

	$effect(() => {
		narrowingState.search.resultsCount = searchResults?.length ?? 0;
	});

	/**
	 * Contains EVERY options for every metadata.
	 * This is a SHALLOW $state, otherwise it makes the browser lag the hell out cuz Svelte's runtime tries to deeply proxify everything (some metadata can have tens of thousands of options).
	 */
	const options: Record<string, Map<string, DB.MetadataEnumVariant>> = $state.raw({});

	// TODO: use this in sidepanel too! it works nicely.
	const optionsLoader = cancellable(async (sig) => {
		loadingOptions = 0;

		if (!uiState.currentProtocol) {
			console.log('no current protocol (early)')
			loadingOptions = definitions.length;
			return;
		}

		// Prevent double-load
		if (Object.keys(options).length >= definitions.length) {
			console.log('options already loaded')
			loadingOptions = definitions.length;
			return;
		}


			if (!uiState.currentProtocol) {
				console.log('no current protocol')
				loadingOptions = definitions.length;
				return;
			}

			console.log('start loading')
			for (const def of definitions) {
				sig.throwIfAborted();
				options[def.id] ??= new Map();
				console.log('loading options for', def.id)
				const results = await metadataOptionsOf(
					databaseHandle(),
					uiState.currentProtocol.id,
					def.id
				);

				for (const option of results) {
					sig.throwIfAborted();
					options[def.id].set(option.key, option);
				}

				loadingOptions++;
			}

			console.log('finished loading', options)
			loadingOptions = definitions.length;

	})

	let loadingOptions = $state(0);
	watch([() => definitions], () => {
		loadingOptions = 0;
		const loader = optionsLoader();

		loader.do()
		return loader.cancel
	});

</script>

<main>
	{#if !loadingOptions || Object.keys(options).length < definitions.length}
		<div class="loading">
			<Logo drawpercent={loadingOptions / definitions.length} />
			Chargement des options...
			<br>
			{loadingOptions} / {definitions.length}
		</div>
	{:else}
		<div class="scrollable">
			<MetadataList
				definitions={definitions
					.filter((def) => searchResults?.some((r) => r.id === def.id) ?? true).map(def => ({...def, group: ""}))
					}
				ordering={searchResults?.map((result) => result.id) ??
					uiState.currentProtocol?.metadataOrder}
				groups={undefined}
			>
				{#snippet children(definition)}
					<div class="metadata">
						<Metadata
							options={[...(options[definition.id]?.values() ?? [])]}
							requiredness="none"
							{definition}
							value={metadataValues[definition.id]}
							onchange={async (value) => {
								if (metadataValues[definition.id]?.value === value) return;

								const choiceIndex = narrowingState.choicesHistory.indexOf(
									definition.id
								);
								// Delete old value if we had one
								if (choiceIndex !== -1)
									narrowingState.choicesHistory.splice(choiceIndex, 1);
								// Add new value to end unless we're removing it (undefined case)
								if (value) {
									await storeMetadataValue({
										db: databaseHandle(),
										subjectId: observation.id,
										metadataId: definition.id,
										type: 'enum',
										manuallyModified: true,
										sessionId: uiState.currentSession?.id,
										// updateReactiveState: false,
										value,
									});
									narrowingState.choicesHistory.push(definition.id);
								} else {
									await deleteMetadataValue({
										db: databaseHandle(),
										subjectId: observation.id,
										metadataId: definition.id,
										sessionId: uiState.currentSession?.id,
										// updateReactiveState: false,
									});
								}
							}}
						/>
					</div>
				{/snippet}
			</MetadataList>
		</div>
	{/if}
</main>

<style>
	main {
		padding: 1em;
		height: 100%;
	}

	.loading {
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
		overflow: auto;
		height: 100%;
	}

	.metadata {
		/* 
		Fiddled with manually in order to get approx. 66 chars/line max 
		See https://www.uxpin.com/studio/blog/optimal-line-length-for-readability/
		*/
		max-width: 650px;
	}
</style>

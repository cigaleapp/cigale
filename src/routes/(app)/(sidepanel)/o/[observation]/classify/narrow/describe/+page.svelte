<script lang="ts">
	import type * as DB from '$lib/database.js';
	import type { NamespacedMetadataId } from '$lib/metadata/namespacing.js';

	import Fuse from 'fuse.js';
	import { Debounced } from 'runed';

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
	import { ensureNamespacedMetadataId, namespaceOfMetadataId } from '$lib/schemas/metadata.js';
	import { uiState } from '$lib/state.svelte.js';
	import { cancellable, entries } from '$lib/utils.js';

	import { narrowingState } from '../+layout.svelte';

	// Destructuring causes unecessary updates since we derive the entire narrowingState object
	const definitions = $derived(narrowingState.definitions);
	const metadataValues = $derived(narrowingState.metadataValues);

	const observation = $derived(tables.Observation.getFromState(page.params.observation ?? ''));

	const debouncedSearch = new Debounced(() => narrowingState.search.describe.query, 300);

	$effect(() => {
		if (narrowingState.search.describe.query === '') debouncedSearch.setImmediately('');
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
		narrowingState.search.describe.resultsCount = searchResults?.length ?? 0;
	});

	const shownDefinitions = $derived(
		definitions
			.filter((def) => searchResults?.some((r) => r.id === def.id) ?? true)
			.map((def) => ({ ...def, group: '' }))
	);

	/**
	 * Contains EVERY options for every metadata.
	 * This is a SHALLOW $state, otherwise it makes the browser lag the hell out cuz Svelte's runtime tries to deeply proxify everything (some metadata can have tens of thousands of options).
	 */
	const options: Record<NamespacedMetadataId, Map<string, DB.MetadataEnumVariant>> = $state.raw(
		{}
	);

	// TODO: use this in sidepanel too! it works nicely.
	const optionsLoader = cancellable(async (sig, definitions: DB.Metadata[]) => {
		loadingOptions = 0;

		if (!uiState.currentProtocol) {
			loadingOptions = definitions.length;
			return;
		}

		// Prevent double-load
		const loadedCount = Object.keys(options).length;
		if (loadedCount > 0 && loadedCount >= definitions.length) {
			loadingOptions = definitions.length;
			return;
		}

		if (!uiState.currentProtocol) {
			loadingOptions = definitions.length;
			return;
		}

		for (const def of definitions) {
			sig.throwIfAborted();
			options[def.id] ??= new Map();
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

		loadingOptions = definitions.length;
	});

	let loadingOptions = $state(0);
	$effect(() => {
		loadingOptions = 0;
		const loader = optionsLoader(definitions);

		loader.do();
		return loader.cancel;
	});

	const remainingMetadataValues = $derived.by<Record<NamespacedMetadataId, Set<string>>>(() => {
		const result: Record<NamespacedMetadataId, Set<string>> = Object.fromEntries(
			definitions
				// Don't consider metadata that has been chosen
				.filter((def) => !(def.id in (observation?.metadataOverrides ?? {})))
				.map((def) => [def.id, new Set()])
		);

		for (const candidate of narrowingState.candidates.remaining) {
			for (const [cascadeMetadata, key] of entries(candidate.cascade ?? {})) {
				const metadataId = ensureNamespacedMetadataId(
					cascadeMetadata,
					namespaceOfMetadataId(definitions[0].id)
				);
				if (!(metadataId in result)) continue;
				result[metadataId].add(key.toString());
			}
		}

		return result;
	});

</script>

<main>
	{#if !loadingOptions || Object.keys(options).length < definitions.length}
		<div class="loading">
			<Logo drawpercent={loadingOptions / definitions.length} />
			Chargement des options...
			<br />
			{loadingOptions} / {definitions.length}
		</div>
	{:else}
		<div class="scrollable">
			<MetadataList
				definitions={shownDefinitions}
				ordering={searchResults?.map((result) => result.id) ??
					uiState.currentProtocol?.metadataOrder}
				groups={undefined}
			>
				{#snippet children(definition)}
					<div class="metadata">
						<Metadata
							options={[...(options[definition.id]?.values() ?? [])]}
							optionIsDisabled={(option) => {
								if (!option) return false;
								const remaining = remainingMetadataValues[definition.id];
								if (!remaining) return false;
								if (remaining.size === 0) return false;
								return !remaining.has(option.key);
							}}
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
		padding: 1em;
	}
</style>

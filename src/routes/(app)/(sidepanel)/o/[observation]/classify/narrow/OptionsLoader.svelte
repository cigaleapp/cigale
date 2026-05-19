<script lang="ts" module>
	/**
	 * Contains EVERY options for every metadata.
	 * This is a SHALLOW $state, otherwise it makes the browser lag the hell out cuz Svelte's runtime tries to deeply proxify everything (some metadata can have tens of thousands of options).
	 */
	export const options: Record<
		NamespacedMetadataID,
		Map<string, DB.MetadataEnumVariant>
	> = $state.raw({});
</script>

<script lang="ts">
	import type * as DB from '$lib/database.js';
	import type { NamespacedMetadataID } from '$lib/schemas/common.js';
	import type { Snippet } from 'svelte';

	import { databaseHandle } from '$lib/idb.svelte.js';
	import Logo from '$lib/Logo.svelte';
	import { metadataOptionsOf } from '$lib/metadata/storage.js';
	import { uiState } from '$lib/state.svelte.js';
	import { cancellable } from '$lib/utils.js';

	import { narrowingState } from './+layout.svelte';

	interface Props {
		children: Snippet;
	}

	const { children }: Props = $props();

	const definitions = $derived(narrowingState.definitions);

	let loadingOptions = $state(0);
	let loadingDescriptors = $state(false);

	// TODO: use this in sidepanel too! it works nicely.
	const optionsLoader = cancellable(async (sig, definitions: DB.Metadata[], loaded: boolean) => {
		loadingOptions = 0;

		if (!uiState.currentProtocol) {
			loadingOptions = definitions.length;
			return;
		}

		// Prevent double-load
		const loadedCount = Object.keys(options).length;
		if (loadedCount > 0 && loadedCount >= definitions.length && loaded) {
			loadingOptions = definitions.length;
			return;
		}

		if (!uiState.currentProtocol) {
			loadingOptions = definitions.length;
			return;
		}

		loadingDescriptors = true;

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

		await narrowingState.loadAllCandidates(sig, options);

		loadingDescriptors = false;
		loadingOptions = definitions.length;
	});

	$effect(() => {
		loadingOptions = 0;
		const loader = optionsLoader(definitions, narrowingState.loaded);

		loader.do();
		return loader.cancel;
	});
</script>

{#if !loadingOptions || Object.keys(options).length < definitions.length || loadingDescriptors}
	<div class="loading">
		{#if loadingOptions < definitions.length}
			<Logo drawpercent={loadingOptions / definitions.length} />
			Chargement des options...
			<br />
			{loadingOptions} / {definitions.length}
		{:else}
			<Logo loading />
			Chargement des descripteurs...
		{/if}
	</div>
{:else}
	{@render children()}
{/if}

<style>
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
</style>

<script>
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import IconMerge from '~icons/ph/selection-background';
	import IconSplit from '~icons/ph/arrows-out-light';
	import KeyboardHint from '$lib/KeyboardHint.svelte';
	import IconDelete from '~icons/ph/trash';
	import deepEqual from 'deep-equal';
	import { tables, idComparator } from '$lib/idb.svelte';
	import Logo from '$lib/Logo.svelte';
	import Metadata from '$lib/Metadata.svelte';
	import MetadataList from '$lib/MetadataList.svelte';
	import { getSettings } from '$lib/settings.svelte';
	import { uiState } from '$lib/state.svelte.js';
	import { page } from '$app/state';

	/**
	 * @typedef {object} Props
	 * @property {string[]} images source **href**s of the images/observations we're modifying the metadata on
	 * @property {() => void} onmerge callback to call when the user wants to merge images or observations into a single one
	 * @property {() => void} onaddmetadata callback to call when the user wants to add metadata
	 * @property {() => void} ondelete callback to call when the user wants to delete the images or observations
	 * @property {() => void} onsplit callback to call when the user wants to split the selected observation(s)
	 * @property {boolean} [cansplit=false] whether the user is allowed to split the selected observation(s)
	 * @property {(key: string, value: import('$lib/metadata').RuntimeValue) => void} onmetadatachange callback to call when a metadata's value is modified
	 * @property {boolean} [canmerge=false] whether the user is allowed to merge images or observations
	 * @property {Record<string, import('$lib/database').MetadataValue | undefined>} metadata values of the metadata we're viewing. Undefined if a metadata has multiple differing values for the selection.
	 */

	/** @type {Props} */
	let { images, onmerge, ondelete, onsplit, cansplit, onmetadatachange, canmerge, metadata } =
		$props();

	const definitions = $derived.by(() => {
		const protocol = tables.Protocol.state.find((p) => p.id === uiState.currentProtocol);
		if (!protocol) return [];
		return protocol.metadata
			.map((id) => tables.Metadata.state.find((m) => m.id === id))
			.filter((m) => m !== undefined)
			.toSorted(({ id: a }, { id: b }) => {
				// Sort id "species" before all others
				if (a === 'species') return -1;
				if (b === 'species') return 1;
				return idComparator(a, b);
			});
	});

	const showTechnicalMetadata = $derived(getSettings().showTechnicalMetadata);
</script>

<div class="pannel" class:empty={images.length === 0}>
	{#if images.length > 0}
		<div class="images">
			{#each images as image, i (i)}
				<img src={image} alt={'image ' + i} />
			{/each}
		</div>
		<MetadataList>
			{#each definitions as definition (definition.id)}
				{@const value = metadata[definition.id]}
				{#if definition.label || showTechnicalMetadata}
					<!-- 
						There's to ways to have a undefined value:
						- either the metadata does not exist on the observation/image yet (in that case, definition.id is not in metadata); or
						- we have multiple multiple differing values for the images (and no override ) 
					-->
					<Metadata
						conflicted={value === undefined && definition.id in metadata && images.length > 1}
						{...definition}
						{...value ?? { value: undefined }}
						onblur={async (v) => {
							if (v === undefined) return;
							if (deepEqual(v, value?.value)) return;
							onmetadatachange(definition.id, v);
						}}
					>
						{#if definition.label}
							{definition.label}
						{:else}
							<code>{definition.id}</code>
						{/if}
					</Metadata>
				{/if}
			{/each}
		</MetadataList>
	{:else}
		<section class="empty-selection">
			<Logo variant="empty" />
			<p>Sélectionnez une ou plusieurs images pour voir et modifier leurs métadonnées</p>
		</section>
	{/if}
	<section class="button">
		{#if page.url.hash === '#/classify'}
			<div class="side-by-side">
				<ButtonSecondary
					disabled={!canmerge}
					onclick={onmerge}
					help="Regrouper les images et/ou observations sélectionnées en une observation"
				>
					<IconMerge />
					Regrouper
					<KeyboardHint shortcut="$mod+g" />
				</ButtonSecondary>
				<ButtonSecondary
					disabled={!cansplit}
					onclick={onsplit}
					help="Séparer toutes les observations sélectionnées en images seules"
				>
					<IconSplit />
					Séparer
					<KeyboardHint shortcut="$mod+alt+g" />
				</ButtonSecondary>
			</div>
		{/if}
		<ButtonSecondary
			disabled={images.length === 0}
			onclick={ondelete}
			help="Supprimer toutes les images sélectionnées. Attention, impossible d'annuler"
			--bg={images.length > 0 ? 'var(--bg-neutral)' : ''}
			--fg={images.length > 0 ? 'var(--fg-error)' : ''}
			--bg-hover={images.length > 0 ? 'var(--bg-error)' : ''}
			--fg-hover={images.length > 0 ? 'var(--fg-error)' : ''}
		>
			<IconDelete />
			Supprimer {images.length} images
		</ButtonSecondary>
	</section>
</div>

<style>
	.pannel {
		width: 40vw;
		max-width: 700px;
		background-color: var(--bg-neutral);
		overflow-x: auto;
		padding: 1.7em;
		display: grid;
		grid-template-rows: max-content auto max-content;
		height: 100%;
		flex-shrink: 0;
		gap: 30px;
	}

	.pannel.empty {
		grid-template-rows: auto max-content;
	}

	.empty-selection {
		--size: 5rem;
		margin: auto;
		max-width: 300px;
		display: flex;
		justify-content: center;
		flex-direction: column;
		gap: 1em;
		align-items: center;
	}

	.images {
		display: flex;
		flex-direction: row;
		gap: 5px;
		mask-image: linear-gradient(to left, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 30%);
		overflow-x: hidden;
	}

	img {
		height: 50px;
		border-radius: var(--corner-radius);
	}

	.button {
		display: flex;
		gap: 0.75em;
		align-items: center;
		flex-direction: column;
		--width: 100%;
	}

	.button .side-by-side {
		display: flex;
		align-items: center;
		gap: 0.75em;
		width: 100%;
	}
</style>

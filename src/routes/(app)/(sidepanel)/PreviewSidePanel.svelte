<script>
	/**
	 * @import { TopLeftBoundingBox } from '$lib/BoundingBoxes.svelte.js';
	 */
	import { dequal } from 'dequal/lite';
	import { watch } from 'runed';

	import IconObservation from '~icons/ri/bug-line';
	import IconDelete from '~icons/ri/delete-bin-line';
	import IconSplit from '~icons/ri/function-line';
	import IconImage from '~icons/ri/image-2-line';
	import IconMerge from '~icons/ri/shadow-line';
	import IconImport from '~icons/ri/upload-2-line';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import CroppedImg from '$lib/CroppedImg.svelte';
	import { plural } from '$lib/i18n';
	import { tables } from '$lib/idb.svelte';
	import * as idb from '$lib/idb.svelte.js';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import Logo from '$lib/Logo.svelte';
	import { metadataDefinitionComparator, metadataOptionsKeyRange } from '$lib/metadata';
	import Metadata from '$lib/Metadata.svelte';
	import MetadataList from '$lib/MetadataList.svelte';
	import { metadataDefinitionComparator } from '$lib/protocols';
	import { getSettings } from '$lib/settings.svelte';
	import { uiState } from '$lib/state.svelte.js';

	/**
	 * @typedef {object} Props
	 * @property {Array<{ src: string; box?: undefined | TopLeftBoundingBox }>} images source **href**s of the images/observations we're modifying the metadata on
	 * @property {(() => void) | undefined} [onmerge] callback to call when the user wants to merge images or observations into a single one. If not set, the merge button is not shown.
	 * @property {() => void} onaddmetadata callback to call when the user wants to add metadata
	 * @property {() => void} ondelete callback to call when the user wants to delete the images or observations
	 * @property {(() => void) | undefined} [onsplit] callback to call when the user wants to split the selected observation(s). If not set, the split button is not shown.
	 * @property {(() => void) | undefined} [onimport] callback to call when the user wants to import additional images. If not set, the import button is not shown.
	 * @property {boolean} [cansplit=false] whether the user is allowed to split the selected observation(s)
	 * @property {(key: string, value: undefined | import('$lib/schemas/metadata').RuntimeValue) => void} onmetadatachange callback to call when a metadata's value is modified
	 * @property {boolean} [canmerge=false] whether the user is allowed to merge images or observations
	 * @property {Record<string, import('$lib/database').MetadataValue & { merged: boolean } >} metadata values of the metadata we're viewing.
	 */

	/** @type {Props} */
	let {
		images,
		onmerge,
		onimport,
		ondelete,
		onsplit,
		cansplit,
		onmetadatachange,
		canmerge,
		metadata
	} = $props();

	const definitions = $derived.by(() => {
		const protocol = tables.Protocol.state.find((p) => p.id === uiState.currentProtocolId);
		if (!protocol) return [];
		return protocol.metadata
			.filter((id) => !protocol.sessionMetadata.includes(id))
			.map((id) => tables.Metadata.state.find((m) => m.id === id))
			.filter((m) => m !== undefined)
			.toSorted(metadataDefinitionComparator(protocol));
	});

	/**
	 * Contains EVERY options for every metadata.
	 * This is a SHALLOW $state, otherwise it makes the browser lag the hell out cuz Svelte's runtime tries to deeply proxify everything (some metadata can have tens of thousands of options).
	 * @type {Record<string, import('$lib/database').MetadataEnumVariant[]>} */
	const options = $state.raw({});

	let loadingOptions = $state(true);
	watch([() => definitions], () => {
		if (!uiState.currentProtocolId) {
			loadingOptions = false;
			return;
		}

		// Prevent double-load
		if (Object.keys(options).length > 0) {
			loadingOptions = false;
			return;
		}

		idb.list('MetadataOption', metadataOptionsKeyRange(uiState.currentProtocolId, null)).then(
			(result) => {
				// Prevent double-load even if both promises resolved at the same time
				if (Object.keys(options).length > 0) {
					loadingOptions = false;
					return;
				}
				for (const { metadataId, key, ...rest } of result) {
					options[metadataId] ??= [];
					options[metadataId].push({ key: key.toString(), ...rest });
				}
				for (const metadataId of Object.keys(options)) {
					options[metadataId].sort((a, b) => a.label.localeCompare(b.label));
				}
				loadingOptions = false;
			}
		);
	});

	const showTechnicalMetadata = $derived(getSettings().showTechnicalMetadata);

	const singleObservationSelected = $derived(
		uiState.selection.length === 1
			? tables.Observation.state.find((obs) => obs.id === uiState.selection[0])
			: undefined
	);

	const singleImageSelected = $derived(
		uiState.selection.length === 1
			? tables.Image.state.find((img) => [img.id, img.fileId].includes(uiState.selection[0]))
			: undefined
	);

	const selectionCounts = $derived({
		image: uiState.selection.filter((id) =>
			tables.Image.state.some((img) => [img.id, img.fileId].includes(id))
		).length,
		observation: uiState.selection.filter((id) =>
			tables.Observation.state.some((obs) => obs.id === id)
		).length,
		get all() {
			return this.image + this.observation;
		}
	});
</script>

<aside
	data-testid="sidepanel"
	class="sidepanel"
	class:empty={images.length === 0 || loadingOptions}
>
	{#if images.length > 0 && !loadingOptions}
		<div class="images">
			{#each images as { src, box }, i (i)}
				{@const alt = singleObservationSelected
					? `Image ${i + 1} de l'observation ${singleObservationSelected.label}`
					: `Image ${i + 1} de la sélection`}
				{#if box}
					<CroppedImg blurfill {src} {alt} {box} />
				{:else}
					<img {src} {alt} />
				{/if}
			{/each}
		</div>
		<h2>
			{#if singleObservationSelected}
				<IconObservation />
				<InlineTextInput
					label="Nom de l'observation"
					value={singleObservationSelected.label}
					onblur={async (value) => {
						if (value === singleObservationSelected.label) return;
						await tables.Observation.update(
							singleObservationSelected.id,
							'label',
							value
						);
					}}
				/>
			{:else if singleImageSelected}
				<IconImage />
				{singleImageSelected.filename}
			{:else if selectionCounts.image > 0 && selectionCounts.observation > 0}
				{plural(selectionCounts.all, ['1 élément', '# éléments'])}
			{:else if selectionCounts.image > 0}
				{plural(selectionCounts.image, ['1 image', '# images'])}
			{:else if selectionCounts.observation > 0}
				{plural(selectionCounts.observation, ['1 observation', '# observations'])}
			{/if}
		</h2>
		<MetadataList>
			{#each definitions as definition (definition.id)}
				{@const value = metadata[definition.id]}
				{#if definition.label || showTechnicalMetadata}
					<Metadata
						merged={value?.merged}
						{definition}
						{value}
						options={options[definition.id]}
						onchange={async (v) => {
							if (dequal(v, value?.value)) return;
							onmetadatachange(definition.id, v);
						}}
					/>
				{/if}
			{/each}
		</MetadataList>
	{:else if loadingOptions}
		<section class="empty-selection">
			<Logo variant="empty" />
			<p>Chargement des options…</p>
		</section>
	{:else}
		<section class="empty-selection">
			<Logo variant="empty" />
			<p>Sélectionnez une ou plusieurs images pour voir et modifier leurs métadonnées</p>
		</section>
	{/if}
	<section class="button">
		{#if onmerge && onsplit}
			<div class="side-by-side">
				<ButtonSecondary
					disabled={!canmerge}
					onclick={onmerge}
					keyboard="$mod+g"
					help="Regrouper les images et/ou observations sélectionnées en une observation"
				>
					<IconMerge />
					Regrouper
				</ButtonSecondary>
				<ButtonSecondary
					disabled={!cansplit}
					onclick={onsplit}
					keyboard="$mod+Shift+g"
					help="Séparer toutes les observations sélectionnées en images seules"
				>
					<IconSplit />
					Séparer
				</ButtonSecondary>
			</div>
		{/if}
		{#if onimport}
			<ButtonSecondary onclick={onimport}>
				<IconImport />
				Importer d'autres images
			</ButtonSecondary>
		{/if}
		<ButtonSecondary
			disabled={images.length === 0}
			onclick={ondelete}
			keyboard="Delete"
			help="Supprimer toutes les images sélectionnées. Attention, impossible d'annuler"
			danger
		>
			<IconDelete />
			Supprimer {images.length} images
		</ButtonSecondary>
	</section>
</aside>

<style>
	.sidepanel {
		width: 40vw;
		resize: horizontal;
		direction: rtl;
		background-color: var(--bg-neutral);
		overflow-x: auto;
		padding: 1.7em;
		display: grid;
		grid-template-rows: max-content max-content auto max-content;
		height: 100%;
		flex-shrink: 0;
		gap: 30px;
		min-width: 520px;
	}

	/* Direction is set to RTL on .pannel to put the resize handle on the left of the container, this sets it back to LTR for every child so that text still has the correction direction (for French) */
	.sidepanel :global(> *) {
		direction: ltr;
	}

	.sidepanel.empty {
		grid-template-rows: auto max-content;
	}

	h2 {
		display: flex;
		align-items: center;
		gap: 0.5em;
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

	.images :global(> *) {
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

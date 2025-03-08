<script>
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import IconMerge from '~icons/ph/selection-background';
	import IconSplit from '~icons/ph/arrows-out-light';
	import IconDelete from '~icons/ph/trash';
	import { tables } from '$lib/idb.svelte';
	import Logo from '$lib/Logo.svelte';
	import Metadata from '$lib/Metadata.svelte';
	import MetadataList from '$lib/MetadataList.svelte';
	import { getSettings } from '$lib/settings.svelte';
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

	// TODO maybe put as a prop? hmmmmm
	const definitions = $derived(
		Object.fromEntries(
			Object.entries(metadata).map(([id]) => [id, tables.Metadata.state.find((m) => m.id === id)])
		)
	);

	const showTechnicalMetadata = $derived(getSettings().showTechnicalMetadata);
</script>

<div class="pannel">
	<div class="images">
		{#each images as image, i (i)}
			<img src={image} alt={'image ' + i} />
		{:else}
			<!-- svelte-ignore a11y_missing_attribute -->
			<img />
		{/each}
	</div>
	<h1>Métadonnées</h1>
	<MetadataList>
		{#each Object.entries(metadata).sort(([a], [b]) => a.localeCompare(b)) as [id, value] (id)}
			{@const definition = definitions[id]}
			{#if definition && (definition.label || showTechnicalMetadata)}
				<!-- the value variable here contains value, confidence and alternatives -->
				<Metadata
					{...definition}
					{...value ?? { value: undefined }}
					onblur={async (v) => {
						if (v === undefined) return;
						onmetadatachange(id, v);
					}}
				>
					{#if definition.label}
						{definition.label}
					{:else}
						<code>{definition.id}</code>
					{/if}
				</Metadata>
			{:else if !definition}
				<p class="error">
					<Logo variant="error" />
					Métadonnée inconnue
				</p>
			{/if}
		{/each}
	</MetadataList>
	<section class="button">
		{#if page.url.pathname === '/classify'}
			<div class="side-by-side">
				<ButtonSecondary
					disabled={!canmerge}
					onclick={onmerge}
					help="Regrouper les images et/ou observations sélectionnées en une observation"
				>
					<IconMerge />
					Regrouper
				</ButtonSecondary>
				<ButtonSecondary
					disabled={!cansplit}
					onclick={onsplit}
					help="Séparer toutes les observations sélectionnées en images seules"
				>
					<IconSplit />
					Séparer
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
		padding: 1em;
		display: grid;
		grid-template-rows: max-content max-content auto max-content;
		height: 100%;
		flex-shrink: 0;
		gap: 30px;
		border-style: solid;
		border-color: var(--bg-primary);
		border-width: var(--border-thickness);
		border-top-left-radius: var(--corner-radius);
		border-bottom-left-radius: var(--corner-radius);
	}

	h1 {
		font-size: 1.5em;
		font-weight: bolder;
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

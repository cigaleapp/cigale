<!-- 
@component

A zone where observations can be selected, by dragging or via keyboard shortcuts.

The zone where dragging can be performed is defined by the _parent element_ of the component.

⚠️ Using this component registers keyboard shortcuts for the whole page: 

- `CmdOrCtrl+A` to select all observations
- `CmdOrCtrl+D` to deselect all observations

-->

<script generics="GroupName extends string">
	import { uiState } from '$lib/state.svelte';
	import * as dates from 'date-fns';
	import { onMount } from 'svelte';
	import CardObservation from './CardObservation.svelte';
	import { DragSelect } from './dragselect.svelte';
	import { defineKeyboardShortcuts } from './keyboard.svelte';
	import { mutationobserver } from './mutations';
	import { m } from './paraglide/messages';
	import { getSettings, isDebugMode } from './settings.svelte';
	import { compareBy, entries } from './utils';
	import { countThing } from './i18n';

	/**
	 * @import { CardObservation as Item } from './AreaObservations.utils'
	 */

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {Item[]} images
	 * @property {'Photo'|'Observation'} nature what kind of items are in `images`
	 * @property {Map<string, string>} [errors] maps image ids to error messages
	 * @property {string[]} [selection=[]]
	 * @property {string} [highlight] id of image to highlight and scroll to
	 * @property {string} [loadingText]
	 * @property {GroupName[]} [groups] list of possible group names, if `groupings` is used. Array order is used to order groups in the UI.
	 * @property {(item: Item) => GroupName} [groupings] function that computes a grouping for each item, to group them up. Return a tuple of [group index, friendly group name]
	 * @property {(id: string) => void} [ondelete] callback the user wants to delete a card
	 * @property {(id: string) => void} [onretry] callback the user wants to retry an errored card
	 * @property {(id: string) => void} [oncardclick] callback when the user clicks on the image. Disables drag selection handling if set.
	 * @property {(e: MouseEvent|TouchEvent|null) => void} [onemptyclick] callback when the user clicks on the empty area
	 * @property {{direction: 'asc' | 'desc', key: 'filename'|'id'|'date'}} sort sort order
	 */

	/** @type {Props } */
	let {
		nature,
		images = $bindable(),
		ondelete,
		onretry,
		oncardclick,
		onemptyclick,
		errors,
		highlight,
		loadingText,
		sort,
		selection = $bindable([]),
		groupings,
		groups
	} = $props();

	/** @type {HTMLElement | undefined} */
	let imagesContainer = $state();
	/** @type {DragSelect |undefined} */
	let dragselect;

	onMount(() => {
		if (!imagesContainer) return;

		dragselect?.destroy();
		dragselect = new DragSelect(imagesContainer, selection, {
			ondeadclick: onemptyclick
		});
		dragselect.setSelection(selection);
		uiState.setSelection = (newSelection) => {
			if (!dragselect) {
				console.error('dragselect not initialized');
				return;
			}
			dragselect.setSelection(newSelection);
		};

		return () => {
			dragselect?.destroy();
			uiState.setSelection = undefined;
		};
	});

	$effect(() => {
		selection = [...new Set(dragselect?.selection ?? [])];
	});

	defineKeyboardShortcuts('observations', {
		// Also register Ctrl-A to select all
		'$mod+a': {
			help: 'Tout sélectionner',
			when: ({ target }) => !(target instanceof HTMLInputElement),
			do: () => {
				dragselect?.setSelection(images.map((img) => img.id));
			}
		},
		// And Ctrl-D to deselect all
		'$mod+d': {
			help: 'Tout désélectionner',
			when: ({ target }) => !(target instanceof HTMLInputElement),
			do: () => {
				selection = [];
				dragselect?.setSelection([]);
			}
		}
	});

	/**
	 * Virtualizes the key for the {#each} block, if needed. See doc for the `virtual` property on `images` prop's type
	 * @param {object} param0
	 * @param {string} param0.id
	 * @param {boolean} [param0.virtual=false] whether the image is virtual (not yet stored in the database)
	 */
	function virtualizeKey({ id, virtual = false }) {
		if (!virtual) return id;
		return `${id}_virtual`;
	}

	$effect(() => {
		const scrollTo = imagesContainer?.querySelector(`[data-id="${highlight}"]`);
		if (!scrollTo) return;
		scrollTo.style.scrollMarginTop = '10vh';
		scrollTo.scrollIntoView({
			behavior: 'instant',
			block: 'start',
			inline: 'nearest'
		});
	});

	/**
	 * @type {Array<readonly [GroupName | "", Item[]]>}
	 */
	const groupedAndSortedImages = $derived.by(() => {
		if (!groupings) return [['', sortImages(images, sort)]];
		return entries(Object.groupBy(images, groupings))
			.filter(([, items]) => items && items.length > 0)
			.map(([key, items]) => /** @type {const} */ ([key, sortImages(items ?? [], sort)]))
			.toSorted(compareBy(([name]) => groups?.indexOf(name) ?? 0));
	});

	/**
	 *
	 * @param {typeof images} images
	 * @param {typeof sort} sort
	 */
	function sortImages(images, sort) {
		return images.toSorted((a, b) => {
			if (sort.direction === 'desc') {
				[a, b] = [b, a];
			}

			switch (sort.key) {
				case 'id':
					return a.id.localeCompare(b.id);
				case 'filename':
					return a.title.localeCompare(b.title);
				case 'date':
					return dates.compareAsc(a.addedAt, b.addedAt);
			}
		});
	}
</script>

<section
	class="images"
	data-testid="observations-area"
	bind:this={imagesContainer}
	use:mutationobserver={{
		childList: true,
		subtree: true,
		onchildList() {
			if (oncardclick) return;
			if (!imagesContainer) return;
			dragselect?.refreshSelectables();
			dragselect?.setSelection(selection);
		}
	}}
>
	{#each groupedAndSortedImages as [groupName, sortedImages] (groupName)}
		<section class="group">
			{#if groupName}
				<header>
					<h2>{groupName}</h2>
					<p>{countThing(nature === 'Photo' ? 'photo' : 'observation', sortedImages.length)}</p>
				</header>
			{/if}
			<div class="items">
				{#each sortedImages as props, i (virtualizeKey(props))}
					<CardObservation
						--card-size-factor={getSettings().gridSize}
						data-testid={i === 0 ? 'first-observation-card' : undefined}
						data-id={props.id}
						data-loading={props.loading}
						data-index={props.index}
						{...props}
						onclick={oncardclick ? () => oncardclick(props.id) : undefined}
						ondelete={ondelete ? () => ondelete(props.id) : undefined}
						onretry={onretry ? () => onretry(props.id) : undefined}
						errored={errors?.has(props.id)}
						statusText={errors?.get(props.id) ??
							(props.loading === -Infinity ? m.queued() : loadingText)}
						highlighted={props.id === highlight}
						selected={selection.includes(props.id.toString())}
						boundingBoxes={props.boundingBoxes}
						applyBoundingBoxes={props.applyBoundingBoxes}
					/>
				{/each}
			</div>
		</section>
	{/each}

	{#if isDebugMode() && images.length > 0}
		<div class="debug">
			{#snippet displayIter(set)}
				{'{'}
				{[...$state.snapshot(set)]
					.map((item) => (item.length > 10 ? '…' : '') + item.slice(-10))
					.join(' ')}
				}
			{/snippet}
			<code>
				selection {@render displayIter(uiState.selection)} <br />
				queued {@render displayIter(uiState.queuedImages)} <br />
				loading {@render displayIter(uiState.loadingImages)} <br />
				errored {@render displayIter(uiState.erroredImages.keys())} <br />
				preview urls {@render displayIter(uiState.previewURLs.keys())} <br />
			</code>
		</div>
	{/if}
</section>

<style>
	.group .items {
		display: flex;
		flex-wrap: wrap;
		align-content: flex-start;
		justify-content: space-between;
		gap: 1.5em 1em;
	}

	.images {
		display: flex;
		flex-direction: column;
		gap: 3em;
	}

	.group header {
		margin-bottom: 1em;
		user-select: none;
	}

	.debug {
		min-width: 20ch;
		width: 100%;
		flex-grow: 1;
		margin-top: 2rem;
	}
</style>

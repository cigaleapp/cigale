<!-- 
@component

A zone where observations can be selected, by dragging or via keyboard shortcuts.

The zone where dragging can be performed is defined by the _parent element_ of the component.

⚠️ Using this component registers keyboard shortcuts for the whole page: 

- `CmdOrCtrl+A` to select all observations
- `CmdOrCtrl+D` to deselect all observations

-->

<script module>
	/**
	 * @template AdditionalData
	 * @typedef {object} MediaItem
	 * @property {string} sessionId useful as a failsafe to ensure no items from other sessions are shown
	 * @property {string} id
	 * @property {string} name
	 * @property {Date} addedAt
	 * @property {boolean} virtual whether this item is virtual (not yet stored in the database)
	 * @property {AdditionalData} data any additional data that might be useful for grouping/sorting
	 */
</script>

<script generics="GroupName extends string, ItemData">
	import * as dates from 'date-fns';
	import { onMount } from 'svelte';

	import IconTrash from '~icons/ri/delete-bin-line';
	import { uiState } from '$lib/state.svelte.js';

	import ButtonInk from './ButtonInk.svelte';
	import { DragSelect } from './dragselect.svelte.js';
	import { plural } from './i18n.js';
	import { openTransaction } from './idb.svelte.js';
	import { deleteImageFile } from './images.js';
	import { defineKeyboardShortcuts } from './keyboard.svelte.js';
	import { mutationobserver, resizeobserver } from './mutations.js';
	import { deleteObservation } from './observations.js';
	import { cancelTask } from './queue.svelte.js';
	import { isDebugMode } from './settings.svelte.js';
	import { compareBy, groupBy } from './utils.js';

	/**
	 * @typedef {MediaItem<ItemData>} Item
	 */

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {Item[]} items
	 * @property {import('svelte').Snippet<[ItemData, Item]>} item
	 * @property {GroupName[]} [groups]
	 * @property {(item: Item) => GroupName | ""} [grouping]
	 * @property {string} [highlight] id of the item to highlight (and scroll to)
	 * @property {(e: MouseEvent|TouchEvent|null) => void} [onemptyclick] callback when the user clicks on the empty area
	 * @property {{direction: 'asc' | 'desc', key: 'filename'|'id'|'date'}} sort sort order
	 * @property {[string, Item[]] | undefined} [unroll] [observation id, inner items] unroll inner cards. Only relevant for items that have multiple cards (i.e. with a stack size > 1)
	 */

	/** @type {Props } */
	let {
		items,
		item,
		groups,
		grouping,
		onemptyclick,
		sort,
		highlight,
		unroll = ['', []]
	} = $props();

	const [unrolledId, unrolledItems] = $derived(unroll);

	/** @type {HTMLElement | undefined} */
	let imagesContainer = $state();
	/** @type {DragSelect |undefined} */
	let dragselect;

	onMount(() => {
		if (!imagesContainer) return;

		dragselect?.destroy();
		dragselect = new DragSelect(imagesContainer, uiState.selection, {
			ondeadclick: onemptyclick
		});
		dragselect.setSelection(uiState.selection);
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
		uiState.selection = [...new Set(dragselect?.selection ?? [])];
	});

	defineKeyboardShortcuts('observations', {
		// Also register Ctrl-A to select all
		'$mod+a': {
			help: 'Tout sélectionner',
			when: ({ target }) => !(target instanceof HTMLInputElement),
			do: () => {
				dragselect?.setSelection(items.map((img) => img.id));
			}
		},
		// And Ctrl-D to deselect all
		'$mod+d': {
			help: 'Tout désélectionner',
			when: ({ target }) => !(target instanceof HTMLInputElement),
			do: () => {
				uiState.selection = [];
				dragselect?.setSelection([]);
			}
		}
	});

	/**
	 * Virtualizes the key for the {#each} block, if needed. See doc for the `virtual` property on `items` prop's type
	 * @param {object} param0
	 * @param {string} param0.id
	 * @param {boolean} [param0.virtual=false]
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
		const itemsWithoutOtherSessions = items.filter(
			(item) => item.sessionId === uiState.currentSessionId
		);

		if (!groups || !grouping) return [['', sortImages(itemsWithoutOtherSessions, sort)]];
		return [...groupBy(itemsWithoutOtherSessions, grouping).entries()]
			.filter(([, items]) => items && items.length > 0)
			.map(([key, items]) => /** @type {const} */ ([key, sortImages(items ?? [], sort)]))
			.toSorted(compareBy(([name]) => groups?.indexOf(name) ?? 0));
	});

	/**
	 *
	 * @param {Item[]} images
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
					return a.name.localeCompare(b.name);
				case 'date':
					return dates.compareAsc(a.addedAt, b.addedAt);
			}
		});
	}

	function roundUnrolledCorners() {
		const items = [
			...(imagesContainer?.querySelectorAll('.item-unroll-container.unrolled') ?? [])
		];

		const itemCoords = [...items].map((el) => el.getBoundingClientRect());

		imagesContainer?.querySelectorAll('.item-unroll-container.unrolled').forEach((el) => {
			if (!(el instanceof HTMLElement)) return;
			const coords = el.getBoundingClientRect();

			const row = itemCoords.filter(({ y }) => y === coords.y);
			const column = itemCoords.filter(({ x }) => x === coords.x);

			el.dataset.roundCornerTop = column.every(({ y }) => y >= coords.y).toString();
			el.dataset.roundCornerBottom = column.every(({ y }) => y <= coords.y).toString();
			el.dataset.roundCornerLeft = row.every(({ x }) => x >= coords.x).toString();
			el.dataset.roundCornerRight = row.every(({ x }) => x <= coords.x).toString();
		});
	}
</script>

<section
	class="images"
	data-testid="observations-area"
	bind:this={imagesContainer}
	use:resizeobserver={{
		onresize() {
			roundUnrolledCorners();
		}
	}}
	use:mutationobserver={{
		childList: true,
		subtree: true,
		onchildList() {
			if (!imagesContainer) return;
			dragselect?.refreshSelectables();
			dragselect?.setSelection(uiState.selection);
			roundUnrolledCorners();
		}
	}}
>
	{#each groupedAndSortedImages as [groupName, sortedImages] (groupName)}
		<section class="group">
			{#if groupName}
				<header>
					<h2>{groupName}</h2>
					<p>
						{plural(sortedImages.length, ['# élément', '# éléments'])}
					</p>
					<div class="actions">
						<ButtonInk
							dangerous
							help="Suppprimer tout les éléments de ce groupe"
							onclick={async () => {
								await openTransaction(
									['Image', 'Observation', 'ImageFile', 'ImagePreviewFile'],
									{},
									async (tx) => {
										for (const { id } of sortedImages) {
											cancelTask(id, 'Cancelled by user');
											await deleteObservation(id, {
												notFoundOk: true,
												recursive: true
											});
											await deleteImageFile(id, tx, true);
										}
									}
								);
							}}
						>
							<IconTrash />
							Supprimer</ButtonInk
						>
					</div>
				</header>
			{/if}
			<div class="items">
				{#each sortedImages as props (virtualizeKey(props))}
					{@const unrolled = unrolledId === props.id}
					<div class="item-unroll-container" class:unrolled>
						{@render item(props.data, props)}
					</div>
					{#if unrolled}
						{#each unrolledItems as innerProps (virtualizeKey(innerProps))}
							<div class="item-unroll-container" class:unrolled>
								{@render item(innerProps.data, innerProps)}
							</div>
						{/each}
					{/if}
				{/each}
			</div>
		</section>
	{/each}

	{#if isDebugMode() && items.length > 0}
		<div class="debug">
			{#snippet displayIter(set)}
				{'{'}
				{[...$state.snapshot(set)]
					.map((item) => (item.length > 10 ? '…' : '') + item.slice(-10))
					.join(' ')}
				}
			{/snippet}
			<code>
				session {uiState.currentSessionId} <br />
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
		padding: 0 2.5em;
	}

	.item-unroll-container {
		padding: 1em;
	}

	.item-unroll-container.unrolled {
		background-color: var(--bg-primary-translucent);
	}

	.item-unroll-container.unrolled {
		&:global([data-round-corner-top='true'][data-round-corner-left='true']) {
			border-top-left-radius: var(--corner-radius);
		}
		&:global([data-round-corner-top='true'][data-round-corner-right='true']) {
			border-top-right-radius: var(--corner-radius);
		}
		&:global([data-round-corner-bottom='true'][data-round-corner-left='true']) {
			border-bottom-left-radius: var(--corner-radius);
		}
		&:global([data-round-corner-bottom='true'][data-round-corner-right='true']) {
			border-bottom-right-radius: var(--corner-radius);
		}
	}

	.images {
		display: flex;
		flex-direction: column;
		gap: 3em;
	}

	.group header {
		user-select: none;
		display: flex;
		align-items: center;
		justify-content: start;
		gap: 1em;
		position: sticky;
		top: 0;
		left: 0;
		right: 0;
		z-index: 100;
		background-color: var(--bg-neutral);
		padding: 0 2.5em 0.75em 2.5em;

		* {
			font-size: 1.1rem;
		}

		.actions {
			margin-left: auto;
		}
	}

	.debug {
		min-width: 20ch;
		width: 100%;
		flex-grow: 1;
		margin-top: 2rem;
		font-size: 0.75rem;
	}
</style>

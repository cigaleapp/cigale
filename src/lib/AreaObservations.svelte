<!-- 
@component

A zone where observations can be selected, by dragging or via keyboard shortcuts.

The zone where dragging can be performed is defined by the _parent element_ of the component.

⚠️ Using this component registers keyboard shortcuts for the whole page: 

- `CmdOrCtrl+A` to select all observations
- `CmdOrCtrl+D` to deselect all observations

-->

<script generics="ItemData">
	import { watch } from 'runed';
	import { onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { fade } from 'svelte/transition';

	import IconCollapse from '~icons/ri/arrow-down-s-line';
	import IconExpand from '~icons/ri/arrow-right-s-line';
	import IconTrash from '~icons/ri/delete-bin-line';
	import { uiState } from '$lib/state.svelte.js';

	import ButtonIcon from './ButtonIcon.svelte';
	import ButtonInk from './ButtonInk.svelte';
	import { DragSelect } from './dragselect.svelte.js';
	import { galleryItemsGrouper, galleryItemsSorter } from './gallery.js';
	import { plural } from './i18n.js';
	import { openTransaction } from './idb.svelte.js';
	import { deleteImageFile } from './images.js';
	import { defineKeyboardShortcuts } from './keyboard.svelte.js';
	import Logo from './Logo.svelte';
	import { mutationobserver, resizeobserver } from './mutations.js';
	import { deleteObservation } from './observations.js';
	import { cancelTask } from './queue.svelte.js';
	import { isDebugMode } from './settings.svelte.js';
	import { toasts } from './toasts.svelte';
	import { compareBy, entries } from './utils.js';

	/**
	 * @import { Session } from '$lib/schemas/sessions';
	 * @import { GalleryItem } from '$lib/gallery';
	 * @typedef {Exclude<keyof typeof Session.infer['sort'], 'global'>} Zone
	 * @typedef {GalleryItem<ItemData>} Item
	 */

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {Item[]} items
	 * @property {import('svelte').Snippet<[ItemData, Item]>} item
	 * @property {string} [highlight] id of the item to highlight (and scroll to)
	 * @property {(e: MouseEvent|TouchEvent|null) => void} [onemptyclick] callback when the user clicks on the empty area
	 * @property {Zone} zone the zone where the area is, used to get grouping & sorting settings
	 * @property {[string, Item[]] | undefined} [unroll] [observation id, inner items] unroll inner cards. Only relevant for items that have multiple cards (i.e. with a stack size > 1)
	 */

	/** @type {Props } */
	let { items, item, onemptyclick, zone, highlight, unroll = ['', []] } = $props();

	const componentId = $props.id();

	const [unrolledId, unrolledItems] = $derived(unroll);

	/**
	 * Set of group `sortKey`s that are collapsed
	 * @type {SvelteSet<string | number>}
	 */
	const collapsedGroups = new SvelteSet();

	watch([() => grouper], () => {
		// Clear collapsed groups when grouping changes
		collapsedGroups.clear();
	});

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
	 * @type {undefined | null | ((item: Item) => [string|number, string])}
	 */
	let grouper = $state();

	const groupingSettings = $derived(
		uiState.currentSession?.group[zone] ?? uiState.currentSession?.group.global
	);

	$effect(() => {
		if (!groupingSettings) return;

		void galleryItemsGrouper(groupingSettings)
			.then((result) => {
				grouper = result;
			})
			.catch((e) => {
				console.error('couldnt set grouper', e);
				toasts.error('Impossible de regrouper avec les paramètres choisis');
				grouper = null;
			});
	});

	/**
	 * @type {undefined | ((a: Item, b: Item) => number)}
	 */
	let sorter = $state();

	const sortingSettings = $derived(
		uiState.currentSession?.sort[zone] ?? uiState.currentSession?.sort.global
	);

	$effect(() => {
		if (!sortingSettings) return;

		void galleryItemsSorter(sortingSettings)
			.then((result) => {
				sorter = result;
			})
			.catch((e) => {
				console.error('couldnt set sorter', e);
				toasts.error('Impossible de trier avec les paramètres choisis');
				sorter = compareBy('id')
			});
	});

	/**
	 * undefined means the items are still being grouped/sorted (e.g. grouper and sorter are not loaded yet)
	 * @type {undefined | Array<{ label: string, sortKey: string|number, items: Item[] }>}
	 */
	const groups = $derived.by(() => {
		if (grouper === undefined) return undefined;
		if (sorter === undefined) return undefined;

		/** @type {Record<string, {items: Item[], sortKey: string|number}>} */
		const grouped = {};

		if (grouper) {
			for (const item of items) {
				const [sortKey, label] = grouper(item);
				grouped[label] ??= { items: [], sortKey };
				grouped[label].items.push(item);
			}
		} else {
			grouped[''] = { items, sortKey: 0 };
		}

		return entries(grouped)
			.map(([label, { items, sortKey }]) => ({ label, sortKey, items: items.sort(sorter) }))
			.sort(compareBy(({ sortKey }) => sortKey));
	});

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
	{#if groups}
		<div class="groups" in:fade={{ duration: 200 }}>
			{#each groups as { label, items, sortKey } (sortKey)}
				<section
					class="group"
					role="region"
					aria-label={label}
					id="{componentId}-group-{sortKey}"
				>
					{#if label}
						<header
							aria-expanded={!collapsedGroups.has(sortKey)}
							aria-controls="{componentId}-group-{sortKey}"
						>
							<ButtonIcon
								help={collapsedGroups.has(sortKey)
									? 'Développer le groupe'
									: 'Réduire le groupe'}
								onclick={async () => {
									if (collapsedGroups.has(sortKey)) {
										collapsedGroups.delete(sortKey);
									} else {
										collapsedGroups.add(sortKey);
									}
								}}
							>
								{#if collapsedGroups.has(sortKey)}
									<IconExpand />
								{:else}
									<IconCollapse />
								{/if}
							</ButtonIcon>
							<h2>{label}</h2>
							<p>
								{plural(items.length, ['# élément', '# éléments'])}
							</p>
							<div class="actions">
								<ButtonInk
									dangerous
									help="Suppprimer tout les éléments de ce groupe"
									onclick={async () => {
										await openTransaction(
											[
												'Image',
												'Observation',
												'ImageFile',
												'ImagePreviewFile'
											],
											{},
											async (tx) => {
												for (const { id } of items) {
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
					{#if !collapsedGroups.has(sortKey)}
						<div class="items" data-starts-selection>
							{#each items as props (virtualizeKey(props))}
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
					{/if}
				</section>
			{/each}
		</div>
	{:else}
		<div class="loading">
			<Logo loading />
			<p>Tri en cours…</p>
		</div>
	{/if}

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

	.images:has(.loading) {
		height: 100%;

		.loading {
			--size: 4em;
			display: flex;
			flex-direction: column;
			gap: 1.2em;
			justify-content: center;
			align-items: center;
			height: 100%;
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
		gap: 0.5em;
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

		h2 {
			margin-right: 0.5em;
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

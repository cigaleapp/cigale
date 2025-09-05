<!-- 
@component

A zone where observations can be selected, by dragging or via keyboard shortcuts.

The zone where dragging can be performed is defined by the _parent element_ of the component.

⚠️ Using this component registers keyboard shortcuts for the whole page: 

- `CmdOrCtrl+A` to select all observations
- `CmdOrCtrl+D` to deselect all observations

-->

<script>
	import { uiState } from '$lib/state.svelte';
	import * as datefns from 'date-fns';
	import { onMount } from 'svelte';
	import CardObservation from './CardObservation.svelte';
	import { DragSelect } from './dragselect.svelte';
	import { defineKeyboardShortcuts } from './keyboard.svelte';
	import { mutationobserver } from './mutations';
	import { m } from './paraglide/messages';
	import { getSettings, isDebugMode } from './settings.svelte';

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {Array<import ('./AreaObservations.utils').CardObservation>} images
	 * @property {Map<string, string>} [errors] maps image ids to error messages
	 * @property {string[]} [selection=[]]
	 * @property {string} [highlight] id of image to highlight and scroll to
	 * @property {string} [loadingText]
	 * @property {(id: string) => void} [ondelete] callback the user wants to delete an image or observation.
	 * @property {(id: string) => void} [oncardclick] callback when the user clicks on the image. Disables drag selection handling if set.
	 * @property {{direction: 'asc' | 'desc', key: 'filename'|'id'|'date'}} sort sort order
	 */

	/** @type {Props } */
	let {
		images = $bindable(),
		ondelete,
		oncardclick,
		errors,
		highlight,
		loadingText,
		sort,
		selection = $bindable([])
	} = $props();

	/** @type {HTMLElement | undefined} */
	let imagesContainer = $state();
	/** @type {DragSelect |undefined} */
	let dragselect;

	onMount(() => {
		if (oncardclick) return;
		if (!imagesContainer) return;
		console.log('setting up dragselect');
		dragselect?.destroy();
		dragselect = new DragSelect(imagesContainer, selection);
		dragselect.setSelection(selection);
		uiState.setSelection = (newSelection) => {
			if (!dragselect) {
				console.error('dragselect not initialized');
				return;
			}
			dragselect.setSelection(newSelection);
		};

		return () => {
			console.log('destroying dragselect');
			dragselect?.destroy();
			uiState.setSelection = undefined;
		};
	});

	$effect(() => {
		if (oncardclick) return;
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

	const sortedImages = $derived(
		images.toSorted((a, b) => {
			if (sort.direction === 'desc') {
				[a, b] = [b, a];
			}

			switch (sort.key) {
				case 'id':
					return a.id.localeCompare(b.id);
				case 'filename':
					return a.title.localeCompare(b.title);
				case 'date':
					return datefns.compareAsc(a.addedAt, b.addedAt);
			}
		})
	);
</script>

<section
	class="images"
	bind:this={imagesContainer}
	use:mutationobserver={{
		childList: true,
		subtree: true,
		onchildList() {
			if (oncardclick) return;
			if (!imagesContainer) return;
			const items = [...imagesContainer.querySelectorAll('[data-selectable]')];
			dragselect?.setItems(items);
			dragselect?.setSelection(selection);
		}
	}}
>
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
			errored={errors?.has(props.id)}
			statusText={errors?.get(props.id) ?? (props.loading === -Infinity ? m.queued() : loadingText)}
			highlighted={props.id === highlight}
			selected={selection.includes(props.id.toString())}
			boundingBoxes={props.boundingBoxes}
			applyBoundingBoxes={props.applyBoundingBoxes}
		/>
	{/each}

	{#if isDebugMode() && sortedImages.length > 0}
		<div class="debug">
			{#snippet displayIter(set)}
				{'{'}
				{[...$state.snapshot(set)]
					.map((item) => (item.length > 10 ? '…' : '') + item.slice(-10))
					.join(' ')}
				}
			{/snippet}
			<code>
				queued {@render displayIter(uiState.queuedImages)} <br />
				loading {@render displayIter(uiState.loadingImages)} <br />
				errored {@render displayIter(uiState.erroredImages.keys())} <br />
				preview urls {@render displayIter(uiState.previewURLs.keys())} <br />
			</code>
		</div>
	{/if}
</section>

<style>
	section {
		gap: 1.5em 1em;
	}

	section.images {
		display: flex;
		flex-wrap: wrap;
		align-content: flex-start;
		justify-content: space-around;
	}

	.debug {
		min-width: 20ch;
		width: 100%;
		flex-grow: 1;
		margin-top: 2rem;
	}
</style>

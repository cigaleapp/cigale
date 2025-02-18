<script>
	import DragSelect from 'dragselect';
	// @ts-ignore
	import { tinykeys } from 'tinykeys';
	import CardObservation from './CardObservation.svelte';

	/**
	 * @typedef Image
	 * @property {string} image
	 * @property {string} title
	 * @property {number} stacksize
	 * @property {number} [loading]
	 */

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {Image[]} images
	 * @property {string[]} [selection=[]]
	 * @property {string} [loadingText]
	 */

	/** @type {Props } */
	let { images = $bindable(), loadingText, selection = $bindable([]) } = $props();

	/** @type {HTMLElement|undefined} */
	let imagesContainer = $state();
	$effect(() => {
		if (!imagesContainer) return;
	});

	const dragselect = $derived.by(() => {
		// recompute when children of imagesContainer change
		images;

		if (!imagesContainer) return;
		return new DragSelect({
			// @ts-ignore
			selectables: [...imagesContainer.querySelectorAll('[data-selectable]')],
			area: imagesContainer.parentElement ?? imagesContainer,
			draggability: false
		});
	});

	$effect(() => {
		dragselect?.subscribe('DS:select', ({ item }) => {
			if (!item.dataset.title) return;
			if (item.dataset.loading) return;
			selection.push(item.dataset.title);
		});
		dragselect?.subscribe('DS:unselect', ({ item }) => {
			if (!item.dataset.title) return;
			selection = selection.filter((title) => title !== item.dataset.title);
		});
	});

	$effect(() => {
		// TODO: notsure about window here, but its most likely the right call
		tinykeys(window, {
			// @ts-ignore
			'$mod+a': (e) => {
				e.preventDefault();
				selection = images.map((img) => img.title);
				dragselect?.setSelection(
					// @ts-ignore
					selection.map((title) =>
						imagesContainer?.querySelector(`[data-selectable][data-title="${title}"]`)
					)
				);
			},
			// @ts-ignore
			'$mod+d': (e) => {
				e.preventDefault();
				selection = [];
				dragselect?.setSelection(
					// @ts-ignore
					selection.map((title) =>
						imagesContainer?.querySelector(`[data-selectable][data-title="${title}"]`)
					)
				);
			}
		});
	});
</script>

<section class="images" bind:this={imagesContainer}>
	{#each images as props}
		<CardObservation
			data-selectable
			data-title={props.title}
			data-loading={props.loading}
			{...props}
			{loadingText}
			selected={selection.includes(props.title)}
			onclick={() => {
				if (props.loading) return;
				if (selection.includes(props.title)) {
					selection = selection.filter((title) => title !== props.title);
				} else {
					selection.push(props.title);
				}
			}}
		/>
	{/each}
</section>

<style>
	section.images {
		display: flex;
		flex-wrap: wrap;
		gap: 2em;
	}
</style>

<!-- 
@component

A zone where observations can be selected, by dragging or via keyboard shortcuts.

The zone where dragging can be performed is defined by the _parent element_ of the component.

⚠️ Using this component registers keyboard shortcuts for the whole page: 

- `CmdOrCtrl+A` to select all observations
- `CmdOrCtrl+D` to deselect all observations

-->

<script>
	import { onMount } from 'svelte';
	import { uiState } from '../routes/inference/state.svelte';
	import CardObservation from './CardObservation.svelte';
	import { DragSelect } from './dragselect.svelte';
	import { mutationobserver } from './mutations';

	/**
	 * @typedef Image
	 * @property {string} image
	 * @property {string} title
	 * @property {string} id
	 * @property {number} index
	 * @property {number} stacksize
	 * @property {number} [loading]
	 */

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {Image[]} images
	 * @property {Map<string, string>} [errors] maps image ids to error messages
	 * @property {string[]} [selection=[]]
	 * @property {string} [loadingText]
	 * @property {(id: string) => void} [ondelete] callback when an image is deleted, with the image/observation id as argument
	 */

	/** @type {Props } */
	let { images = $bindable(), ondelete, errors, loadingText, selection = $bindable([]) } = $props();

	/** @type {HTMLElement | undefined} */
	let imagesContainer = $state();
	/** @type {DragSelect |undefined} */
	let dragselect;

	onMount(() => {
		if (!imagesContainer) return;
		dragselect?.destroy();
		dragselect = new DragSelect(imagesContainer, selection);
		dragselect.setSelection(selection);
	});

	$effect(() => {
		selection = dragselect?.selection ?? [];
	});

	onMount(() => {
		uiState.keybinds = {
			...uiState.keybinds,
			// Also register Ctrl-A to select all
			'$mod+a': {
				help: 'Tout sélectionner',
				do: () => {
					dragselect?.setSelection(images.map((img) => img.id));
				}
			},
			// And Ctrl-D to deselect all
			'$mod+d': {
				help: 'Tout désélectionner',
				do: () => {
					selection = [];
					dragselect?.setSelection([]);
				}
			}
		};
	});
</script>

<section
	class="images"
	bind:this={imagesContainer}
	use:mutationobserver={{
		childList: true,
		subtree: true,
		onchildList() {
			if (!imagesContainer) return;
			const items = [...imagesContainer.querySelectorAll('[data-selectable]')];
			dragselect?.setItems(items);
			dragselect?.setSelection(selection);
		}
	}}
>
	{#each images as props (props.index)}
		<CardObservation
			data-selectable
			data-id={props.id}
			data-loading={props.loading}
			data-index={props.index}
			{...props}
			ondelete={ondelete ? () => ondelete(props.id) : undefined}
			errored={errors?.has(props.id)}
			statusText={errors?.get(props.id) ?? loadingText}
			selected={selection.includes(props.id.toString())}
		/>
	{/each}
</section>

<style>
	section.images {
		display: flex;
		flex-wrap: wrap;
		align-content: flex-start;
		gap: 2em;
	}
</style>

<!-- 
@component

A zone where observations can be selected, by dragging or via keyboard shortcuts.

The zone where dragging can be performed is defined by the _parent element_ of the component.

⚠️ Using this component registers keyboard shortcuts for the whole page: 

- `CmdOrCtrl+A` to select all observations
- `CmdOrCtrl+D` to deselect all observations

-->

<script>
	// @ts-ignore
	import CardObservation from './CardObservation.svelte';
	import { DragSelect } from './dragselect.svelte';
	import KeyboardShortcuts from './KeyboardShortcuts.svelte';
	import { mutationobserver } from './mutations';

	/**
	 * @typedef Image
	 * @property {string} image
	 * @property {string} title
	 * @property {number} index
	 * @property {number} stacksize
	 * @property {number} [loading]
	 */

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {Image[]} images
	 * @property {string[]} [selection=[]]
	 * @property {string} [loadingText]
	 * @property {import('./KeyboardShortcuts.svelte').Keymap} [binds] keybinds to define alongside the ones this component defines
	 */

	/** @type {Props } */
	let { images = $bindable(), loadingText, binds, selection = $bindable([]) } = $props();

	/** @type {HTMLElement | undefined} */
	let imagesContainer = $state();
	/** @type {DragSelect |undefined} */
	let dragselect;

	$effect(() => {
		if (!imagesContainer) return;
		dragselect?.destroy();
		dragselect = new DragSelect(imagesContainer);
	});

	$effect(() => {
		selection = dragselect?.selection ?? [];
	});
</script>

<KeyboardShortcuts
	preventDefault
	binds={{
		// Fill the object with keybindings the user of the component gives us
		// throught the "binds" prop
		...binds,
		// Also register Ctrl-A to select all
		'$mod+a': {
			help: 'Tout sélectionner',
			do: () => {
				selection = images.map((img) => img.title);
				dragselect?.setSelection(selection);
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
	}}
/>

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
			data-title={props.title}
			data-loading={props.loading}
			data-index={props.index}
			{...props}
			{loadingText}
			selected={selection.includes(props.title)}
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

<script>
	import ButtonPrimary from './ButtonPrimary.svelte';
	import ButtonSecondary from './ButtonSecondary.svelte';
	import Modal from './Modal.svelte';

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {string} key a unique string, used to identify the modal in the page's state.
	 * @property {string} title the title used in the header
	 * @property {() => void} onconfirm what to do when the user confirms
	 * @property {() => void} [oncancel] what to do when the user cancels
	 * @property {() => void} [open] a function you can bind to, to open the modal
	 * @property {() => void} [close] a function you can bind to, to close the modal. Note that the modal includes a close button in the header, you don't _have_ to use this.
	 * @property {import('svelte').Snippet} [children] the content of the modal
	 * @property {string} [confirm] the text to display on the confirm button
	 * @property {string} [cancel] the text to display on the cancel button
	 */

	/** @type {Props} */
	let {
		onconfirm,
		oncancel = undefined,
		children = undefined,
		confirm = 'OK',
		cancel = 'Annuler',
		close = $bindable(undefined),
		open = $bindable(undefined),
		...modalProps
	} = $props();
</script>

<Modal {...modalProps} bind:close bind:open>
	{@render children?.()}
	{#snippet footer()}
		<div class="actions">
			<ButtonSecondary
				onclick={() => {
					close?.();
					oncancel?.();
				}}
			>
				{cancel}
			</ButtonSecondary>
			<ButtonPrimary
				onclick={() => {
					close?.();
					onconfirm();
				}}
			>
				{confirm}
			</ButtonPrimary>
		</div>
	{/snippet}
</Modal>

<style>
	.actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: 0.5rem;
	}
</style>

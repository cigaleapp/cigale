<script lang="ts">
	import ButtonPrimary from './ButtonPrimary.svelte';
	import ButtonSecondary from './ButtonSecondary.svelte';
	import Modal from './Modal.svelte';

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {`modal_${string}`} key a unique string, used to identify the modal in the page's state.
	 * @property {string} title the title used in the header
	 * @property {() => void | Promise<void>} onconfirm what to do when the user confirms. If the function returns a promise, the modal will wait for it to resolve before closing.
	 * @property {undefined | (() => void | Promise<void>)} [oncancel] what to do when the user cancels. If the function returns a promise, the modal will wait for it to resolve before closing.
	 * @property {undefined | (() => void)} [open] a function you can bind to, to open the modal
	 * @property {undefined | (() => void)} [close] a function you can bind to, to close the modal. Note that the modal includes a close button in the header, you don't _have_ to use this.
	 * @property {import('svelte').Snippet} [children] the content of the modal
	 * @property {string} [confirm] the text to display on the confirm button
	 * @property {string} [cancel] the text to display on the cancel button
	 * @property {boolean} [disable-confirm] whether to disable the confirm button
	 */

	/** @type {Props & Partial<Omit<import('$lib/Modal.svelte').Props, keyof Props>>} */
	let {
		onconfirm,
		oncancel = undefined,
		children = undefined,
		'disable-confirm': disableConfirm = false,
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
				loading
				onclick={async () => {
					await oncancel?.();
					close?.();
				}}
			>
				{cancel}
			</ButtonSecondary>
			<ButtonPrimary
				loading
				disabled={disableConfirm}
				onclick={async () => {
					await onconfirm();
					close?.();
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

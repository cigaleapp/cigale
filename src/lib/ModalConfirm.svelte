<script>
	import ButtonPrimary from './ButtonPrimary.svelte';
	import ButtonSecondary from './ButtonSecondary.svelte';
	import { errorMessage } from './i18n.js';
	import Modal from './Modal.svelte';

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {`modal_${string}`} key a unique string, used to identify the modal in the page's state.
	 * @property {string} title the title used in the header
	 * @property {() => void | Promise<void>} [onconfirm] what to do when the user confirms. If the function returns a promise, the modal will wait for it to resolve before closing.
	 * @property {undefined | (() => void | Promise<void>)} [oncancel] what to do when the user cancels. If the function returns a promise, the modal will wait for it to resolve before closing.
	 * @property {undefined | (() => void)} [open] a function you can bind to, to open the modal
	 * @property {undefined | (() => void)} [close] a function you can bind to, to close the modal. Note that the modal includes a close button in the header, you don't _have_ to use this.
	 * @property {undefined | (() => Promise<boolean>)} [show] a function you can bind to, that opens the modal, and only returns when it is closed. Returns with true if it was confirmed, and false if it was canceled
	 * @property {import('svelte').Snippet<[{error: string}]>} [children] the content of the modal. You can get the onconfirm handler's error if one occured
	 * @property {string} [confirm] the text to display on the confirm button
	 * @property {string} [cancel] the text to display on the cancel button
	 * @property {boolean} [disable-confirm] whether to disable the confirm button
	 * @property {boolean} [dangerous] convey danger for the confirm button
	 */

	/** @type {Props & Partial<Omit<import('$lib/Modal.svelte').Props, keyof Props>>} */
	let {
		onconfirm,
		oncancel = undefined,
		children = undefined,
		'disable-confirm': disableConfirm = false,
		dangerous = false,
		confirm = 'OK',
		cancel = 'Annuler',
		close = $bindable(undefined),
		open = $bindable(undefined),
		show = $bindable(undefined),
		...modalProps
	} = $props();

	let error = $state('');

	/** @param {boolean} _confirmed */
	let closed = (_confirmed) => {};

	$effect(() => {
		show = async () => {
			open?.();
			return new Promise((resolve) => {
				closed = resolve;
			});
		};
	});
</script>

<Modal {...modalProps} bind:close bind:open>
	{@render children?.({ error })}
	{#snippet footer()}
		{#if error}
			<div class="error">
				{error}
			</div>
		{/if}
		<div class="actions">
			<ButtonSecondary
				loading
				onclick={async () => {
					await oncancel?.();
					close?.();
					closed(false);
				}}
			>
				{cancel}
			</ButtonSecondary>
			<ButtonPrimary
				danger={dangerous}
				loading
				disabled={disableConfirm}
				onclick={async () => {
					try {
						await onconfirm?.();
						close?.();
						closed(true);
						error = '';
					} catch (error) {
						console.error(error);
						error = errorMessage(error);
					}
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

	.error {
		width: 100%;
		padding: 2rem;
		border-radius: var(--corner-radius);
		background-color: var(--bg-error);
		color: var(--fg-error);
	}
</style>

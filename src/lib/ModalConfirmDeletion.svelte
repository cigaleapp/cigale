<script lang="ts">
	import ModalConfirm from '$lib/ModalConfirm.svelte';

	import ButtonSecondary from './ButtonSecondary.svelte';
	import InlineTextInput from './InlineTextInput.svelte';

	/**
	 * @typedef {object} Props
	 * @property {string} [typeToConfirm] text to type (exactly) to be able to confirm deletion
	 * @property {string[]} consequences list of consequences to show in the modal
	 * @property {() => Promise<void>} onconfirm callback when deletion is confirmed
	 * @property {undefined | (() => void)} [open] a function you can bind to, to open the modal
	 * @property {import('svelte').Snippet | null} [button] contents of button that opens the modal. By default, a plain "delete" text is shown. Set to null to not show any button.
	 */

	/**
	 * @type {Props & Pick<import('$lib/Modal.svelte').Props, "key"> &  Partial<Omit<import('$lib/Modal.svelte').Props, keyof Props>>}
	 */
	let {
		onconfirm,
		typeToConfirm,
		consequences,
		button,
		open = $bindable(),
		...modalProps
	} = $props();

	let confirmationText = $state('');

	const canDelete = $derived(!typeToConfirm || confirmationText.trim() === typeToConfirm);
</script>

<ModalConfirm
	title="Êtes-vous sûr·e?"
	bind:open
	cancel="Annuler"
	confirm="Oui, supprimer"
	{onconfirm}
	disable-confirm={!canDelete}
	{...modalProps}
>
	La suppression entraînera:
	<ul>
		{#each consequences as consequence (consequence)}
			<li>{consequence}</li>
		{/each}
	</ul>
	Il est impossible de revenir en arrière.

	{#if typeToConfirm}
		<section class="confirm">
			<p>
				Afin de confirmer la suppression, veuillez taper <strong>{typeToConfirm}</strong> ci-dessous:
			</p>
			<InlineTextInput label="Taper “{typeToConfirm}”" bind:value={confirmationText} />
		</section>
	{/if}
</ModalConfirm>

{#if button !== null}
	<ButtonSecondary loading danger onclick={() => open?.()}>
		{#if button}
			{@render button()}
		{:else}
			Supprimer
		{/if}
	</ButtonSecondary>
{/if}

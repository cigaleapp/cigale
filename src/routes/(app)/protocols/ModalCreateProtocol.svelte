<script lang="ts">
	import ButtonPrimary from '$lib/ButtonPrimary.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import Field from '$lib/Field.svelte';
	import { errorMessage } from '$lib/i18n';
	import { tables } from '$lib/idb.svelte.js';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import Modal from '$lib/Modal.svelte';
	import { goto } from '$lib/paths';
	import { ID } from '$lib/schemas/common';
	import { namespacedMetadataId } from '$lib/schemas/metadata';
	import { toasts } from '$lib/toasts.svelte';

	/**
	 * @typedef {object} Props
	 * @property {(() => void) | undefined} [open]
	 */

	/**  @type {Props} */
	let { open = $bindable() } = $props();

	let newProtocol = $state({
		name: '',
		id: ''
	});
</script>

<Modal key="modal_create_protocol" title="Créer un protocole" toasts="protocolcreator" bind:open>
	<Field label="Nom du protocole">
		<InlineTextInput
			label=""
			value=""
			onblur={(value) => {
				newProtocol.name = value;
			}}
		/>
	</Field>

	<Field>
		{#snippet label()}
			Identifiant du protocole
			<p>
				Doit être unique. Il est conseillé de le baser sur un nom de domaine web que vous
				contrôlez; celui d'un site web permettant de télécharger le protocole, par exemple
			</p>
		{/snippet}
		<InlineTextInput
			label=""
			value=""
			onerror={toasts.error}
			onblur={(id) => {
				newProtocol.id = id;
			}}
		/>
		{#snippet error()}
			{@const existingProtocol = tables.Protocol.getFromState(newProtocol.id)}
			{#if newProtocol.id && !ID.allows(newProtocol.id)}
				L'identifiant ne doit comporter que des lettres, chiffres, <code>.</code> ou
				<code>_</code>
			{:else if existingProtocol}
				<em>{existingProtocol.name}</em> utilise déjà cet identifiant
			{/if}
		{/snippet}
	</Field>

	{#snippet footer({ close })}
		<ButtonSecondary onclick={() => close?.()}>Annuler</ButtonSecondary>
		<ButtonPrimary
			onclick={async () => {
				toasts.clear();

				const namespace = (/** @type {string} */ metadataId) =>
					namespacedMetadataId(newProtocol.id, metadataId);

				try {
					await tables.Metadata.set({
						id: namespace('crop'),
						description: '',
						label: '',
						mergeMethod: 'union',
						type: 'boundingbox',
						required: false
					});
					await tables.Metadata.set({
						id: namespace('crop_confirmation'),
						description: '',
						label: '',
						mergeMethod: 'none',
						type: 'boolean',
						required: false
					});
					await tables.Protocol.set({
						id: newProtocol.id,
						name: newProtocol.name,
						metadata: ['crop', 'crop_confirmation'].map(namespace),
						description: '',
						authors: [],
						crop: {
							metadata: namespace('crop'),
							confirmationMetadata: namespace('crop_confirmation')
						}
					});
					await goto('/(app)/protocols/[id]/infos', { id: newProtocol.id });
				} catch (error) {
					toasts.error(errorMessage(error));
				}
			}}
		>
			Créer
		</ButtonPrimary>
	{/snippet}
</Modal>

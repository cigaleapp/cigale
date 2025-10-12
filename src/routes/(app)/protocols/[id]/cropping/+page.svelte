<script>
	import { page } from '$app/state';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonInk from '$lib/ButtonInk.svelte';
	import Field from '$lib/Field.svelte';
	import { errorMessage } from '$lib/i18n';
	import IconDatatype from '$lib/IconDatatype.svelte';
	import { tables } from '$lib/idb.svelte';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import { goto } from '$lib/paths';
	import {
		ensureNamespacedMetadataId,
		removeNamespaceFromMetadataId
	} from '$lib/schemas/metadata';
	import { Protocol } from '$lib/schemas/protocols';
	import { TraversalError } from 'arktype';
	import { fade } from 'svelte/transition';
	import IconGoto from '~icons/ph/arrow-right';
	import IconOpenDetails from '~icons/ph/caret-down';
	import IconAdd from '~icons/ph/plus';
	import IconTrash from '~icons/ph/trash';
	import IconError from '~icons/ph/warning-circle';
	import { updater } from '../updater.svelte';
	import ModelConfig from './ModelConfig.svelte';
	import { modelUrl } from '$lib/inference';

	const { data } = $props();
	let settings = $derived(data.crop);

	const findMetadata = (idOrShortId) =>
		data.metadataDefinitions.find(
			(m) =>
				ensureNamespacedMetadataId(m.id, data.id) ===
				ensureNamespacedMetadataId(idOrShortId, data.id)
		);
	const cropMetadata = $derived(findMetadata(settings.metadata));
	const cropConfirmationMetadata = $derived(findMetadata(settings.confirmationMetadata));

	let paddingInputError = $state('');

	/**
	 * @param {number|undefined} currentLength
	 * @returns {NonNullable<typeof data.crop.infer>[number]}
	 */
	const dummyModelSettings = (currentLength) => ({
		model: 'https://example.com/model.onnx',
		name: `Modèle de recadrage ${(currentLength ?? 0) + 1}`,
		input: {
			width: 224,
			height: 224,
			normalized: true
		},
		output: {
			normalized: true,
			shape: ['cx', 'cy', 'w', 'h', 'score']
		}
	});
</script>

<div class="content" in:fade={{ duration: 100 }}>
	<h2>Recadrage des images</h2>

	<Field error={paddingInputError}>
		{#snippet label()}
			Marge par défault
			<p>Pour les images recadrées</p>
		{/snippet}

		<InlineTextInput
			label="Marge par défaut"
			value={settings.padding}
			Type={Protocol.get('crop', 'padding')}
			onerror={(msg) => {
				if (msg instanceof TraversalError) {
					paddingInputError = msg.arkErrors.map((err) => err.message).join(', ');
				} else {
					paddingInputError = errorMessage(msg);
				}
			}}
			onblur={updater((p, value) => {
				p.crop.padding = value;
				paddingInputError = '';
			})}
		/>

		{#snippet hint()}
			Entrez un nombre suivi de <code>%</code> pour une marge relative à la taille de chaque
			image, ou suivi de <code>px</code> pour une marge en pixels.
		{/snippet}
	</Field>

	<Field label="Stockage des boîtes">
		<div class="metadata-link">
			{#if cropMetadata}
				<div class="text">
					<p>
						<IconDatatype tooltip={false} type="boundingbox" />
						{cropMetadata.label || removeNamespaceFromMetadataId(cropMetadata.id)}
					</p>
					<small>Boîtes de recadrage stockées dans cette métadonnée</small>
				</div>
				<div class="actions">
					<ButtonInk
						onclick={async () =>
							goto('/(app)/protocols/[id]/metadata/[metadata]/infos', {
								id: page.params.id,
								metadata: removeNamespaceFromMetadataId(cropMetadata.id)
							})}
					>
						<IconGoto />
						Voir
					</ButtonInk>
				</div>
			{:else}
				<div class="text empty">
					<p>
						<IconError />
						Aucune métadonnée
					</p>
					<small>Le protocole ne peut pas stocker les boîtes de recadrage!</small>
				</div>
				<div class="actions">
					<ButtonInk
						onclick={updater(async (p) => {
							const shortId = 'crop';
							const metadataId = ensureNamespacedMetadataId(shortId, p.id);

							if (!data.metadataDefinitions.some((m) => m.id === metadataId)) {
								await tables.Metadata.set({
									id: metadataId,
									label: '',
									type: 'boundingbox',
									description: "Boîtes de recadrage de l'observation",
									required: false,
									mergeMethod: 'union'
								});
								p.metadata.push(shortId);
							}

							p.crop.metadata = shortId;

							await goto('/(app)/protocols/[id]/metadata/[metadata]/infos', {
								id: p.id,
								metadata: shortId
							});
						})}
					>
						Créer
					</ButtonInk>
				</div>
			{/if}
		</div>
	</Field>

	<Field label="Stockage de l'état de confirmation">
		<div class="metadata-link">
			{#if cropConfirmationMetadata}
				<div class="text">
					<p>
						<IconDatatype tooltip={false} type="boolean" />
						{cropConfirmationMetadata.label ||
							removeNamespaceFromMetadataId(cropConfirmationMetadata.id)}
					</p>
					<small>Confirmations des recadrages stockés dans cette métadonnée</small>
				</div>
				<div class="actions">
					<ButtonInk
						onclick={async () =>
							goto('/(app)/protocols/[id]/metadata/[metadata]/infos', {
								id: page.params.id,
								metadata: removeNamespaceFromMetadataId(cropConfirmationMetadata.id)
							})}
					>
						<IconGoto />
						Voir
					</ButtonInk>
				</div>
			{:else}
				<div class="text empty">
					<p>
						<IconError />
						Aucune métadonnée
					</p>
					<small>Le protocole ne peut pas stocker les confirmations de recadrage!</small>
				</div>
				<div class="actions">
					<ButtonInk
						onclick={updater(async (p) => {
							const shortId = 'crop_confirmation';
							const metadataId = ensureNamespacedMetadataId(shortId, p.id);

							if (!data.metadataDefinitions.some((m) => m.id === metadataId)) {
								await tables.Metadata.set({
									id: metadataId,
									label: '',
									type: 'boolean',
									description: 'Si la boîte de recadrage a été confirmée',
									required: false,
									mergeMethod: 'none'
								});
								p.metadata.push(shortId);
							}

							p.crop.confirmationMetadata = shortId;

							await goto('/(app)/protocols/[id]/metadata/[metadata]/infos', {
								id: p.id,
								metadata: shortId
							});
						})}
					>
						Créer
					</ButtonInk>
				</div>
			{/if}
		</div>
	</Field>

	<Field composite>
		{#snippet label()}
			<div class="models-label">
				Modèles d'inférence
				<ButtonInk
					onclick={updater((p, _) => {
						p.crop.infer = [
							...(p.crop.infer ?? []),
							dummyModelSettings(p.crop.infer?.length)
						];
					})}
				>
					<IconAdd />
					Ajouter
				</ButtonInk>
			</div>
		{/snippet}
		{#each settings.infer ?? [] as inference, i (inference.name || modelUrl(inference.model))}
			<details>
				<summary>
					<div class="marker">
						<IconOpenDetails />
					</div>
					<div class="text">
						<p>{inference.name}</p>
						<small>{modelUrl(inference.model)}</small>
					</div>
					<div class="actions">
						<ButtonIcon
							help="Supprimer ce modèle"
							dangerous
							onclick={updater((p, _) => {
								p.crop.infer = p.crop.infer?.filter((_, index) => index !== i);
							})}
						>
							<IconTrash />
						</ButtonIcon>
					</div>
				</summary>
				<ModelConfig {i} {inference} />
			</details>
		{:else}
			<p>Aucun modèle de recadrage défini.</p>
		{/each}
	</Field>
</div>

<style>
	.content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.metadata-link {
		display: flex;
		align-items: center;
		justify-content: space-between;

		.text p {
			display: flex;
			align-items: center;
			gap: 0.25em;
		}

		.text.empty {
			color: var(--fg-error);
		}
	}

	.models-label {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	summary {
		margin-bottom: 1rem;
		list-style: none;
		display: flex;
		align-items: center;
		gap: 1em;

		&::-webkit-details-marker {
			display: none;
		}

		.text {
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.actions {
			margin-left: auto;
		}

		.marker :global(svg) {
			transition: rotate 0.25s ease;
		}
	}

	details {
		cursor: pointer;
		border: 1px solid var(--gray);
		padding: 1.5rem;
		border-radius: var(--corner-radius);

		&[open] :global(> *:not(:last-child)) {
			margin-bottom: 2rem;
		}

		&:not([open]) {
			border-color: transparent;
		}

		&[open] .marker :global(svg) {
			rotate: 180deg;
		}
	}

	/* Compensate double padding */
	details:not([open]) + details:not([open]) {
		margin-top: -1.5rem;
	}

	details[open] + details {
		margin-top: 1rem;
	}
</style>

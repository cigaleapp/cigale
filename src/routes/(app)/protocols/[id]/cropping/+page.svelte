<script>
	import { TraversalError } from 'arktype';
	import { fade } from 'svelte/transition';

	import IconAdd from '~icons/ri/add-line';
	import IconOpenDetails from '~icons/ri/arrow-down-s-line';
	import IconTrash from '~icons/ri/delete-bin-line';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonInk from '$lib/ButtonInk.svelte';
	import Field from '$lib/Field.svelte';
	import { errorMessage } from '$lib/i18n';
	import { tables } from '$lib/idb.svelte';
	import { modelUrl } from '$lib/inference';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import { removeNamespaceFromMetadataId } from '$lib/schemas/metadata';
	import { Protocol } from '$lib/schemas/protocols';

	import MetadataLink from '../MetadataLink.svelte';
	import { updater } from '../updater.svelte';
	import ModelConfig from './ModelConfig.svelte';

	const { data } = $props();
	let settings = $derived(data.crop);

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
		<MetadataLink
			definitions={data.metadataDefinitions}
			key={settings.metadata}
			help="Boîtes de recadrage stockées dans cette métadonnée"
			no-metadata="Le protocole ne peut pas stocker les boîtes de recadrage!"
			onupdate={(p) => {
				p.crop.metadata = removeNamespaceFromMetadataId(settings.metadata);
			}}
			oncreate={async () => {
				await tables.Metadata.set({
					id: removeNamespaceFromMetadataId(settings.metadata),
					label: '',
					type: 'boundingbox',
					description: "Boîtes de recadrage de l'observation",
					required: false,
					mergeMethod: 'union'
				});
			}}
		/>
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

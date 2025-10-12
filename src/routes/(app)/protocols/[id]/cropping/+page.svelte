<script>
	import '$lib/fonts-math/import.css';

	import { page } from '$app/state';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonInk from '$lib/ButtonInk.svelte';
	import Field from '$lib/Field.svelte';
	import FieldUrl from '$lib/FieldURL.svelte';
	import IconDatatype from '$lib/IconDatatype.svelte';
	import { tables } from '$lib/idb.svelte';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import { goto } from '$lib/paths';
	import RadioButtons from '$lib/RadioButtons.svelte';
	import {
		ensureNamespacedMetadataId,
		removeNamespaceFromMetadataId
	} from '$lib/schemas/metadata';
	import { Protocol } from '$lib/schemas/protocols';
	import { toasts } from '$lib/toasts.svelte';
	import { fade } from 'svelte/transition';
	import IconGoto from '~icons/ph/arrow-right';
	import IconOpenDetails from '~icons/ph/caret-down';
	import IconAdd from '~icons/ph/plus';
	import IconTrash from '~icons/ph/trash';
	import IconError from '~icons/ph/warning-circle';
	import { updater } from '../updater.svelte';
	import ModelOutputShapeDiagram from './ModelOutputShapeDiagram.svelte';
	import { TraversalError } from 'arktype';
	import { errorMessage } from '$lib/i18n';

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
	 * @param {number} currentLength
	 * @returns {NonNullable<typeof data.crop.infer>[number]}
	 */
	const dummyModelSettings = (currentLength) => ({
		model: 'https://example.com/model.onnx',
		name: `Modèle de recadrage ${currentLength + 1}`,
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
					onclick={updater((p) => {
						p.crop.infer ??= [];
						p.crop.infer.push(dummyModelSettings(p.infer.length));
					})}
				>
					<IconAdd />
					Ajouter
				</ButtonInk>
			</div>
		{/snippet}
		{#each settings.infer ?? [] as { model, input, output, name }, i (name)}
			<details open>
				<summary>
					<div class="marker">
						<IconOpenDetails />
					</div>
					<div class="text">
						<p>{name}</p>
						<small>{typeof model === 'string' ? model : model.url}</small>
					</div>
					<div class="actions">
						<ButtonIcon
							help="Supprimer ce modèle"
							dangerous
							onclick={updater((p) => {
								p.crop.infer = p.crop.infer?.filter((_, index) => index !== i);
							})}
						>
							<IconTrash />
						</ButtonIcon>
					</div>
				</summary>
				<Field label="Nom du modèle">
					<InlineTextInput
						value={name ?? '(Sans nom)'}
						label="Nom du modèle"
						onblur={updater((p, newName) => {
							if (!p.crop.infer) return;
							p.crop.infer[i].name = newName;
						})}
					/>
				</Field>
				<FieldUrl
					check
					label="URL du modèle .onnx"
					value={typeof model === 'string' ? model : ''}
					onblur={updater((p, newModel) => {
						if (!p.crop.infer) return;
						p.crop.infer[i].model = newModel;
					})}
				/>
				<Field composite label="Taille des images en entrée">
					<div class="composite-input-line">
						<InlineTextInput
							label="Largeur"
							value={input.width.toString()}
							onblur={updater((p, width) => {
								if (!p.crop.infer) return;
								p.crop.infer[i].input.width = parseInt(width, 10);
							})}
						/>
						<span class="separator">×</span>
						<InlineTextInput
							label="Hauteur"
							value={input.height.toString()}
							onblur={updater((p, height) => {
								if (!p.crop.infer) return;
								p.crop.infer[i].input.height = parseInt(height, 10);
							})}
						/>
						<span class="unit">pixels</span>
					</div>
				</Field>

				<Field label="Disposition des pixels">
					<RadioButtons
						horizontal
						cards
						value={input.disposition ?? 'CHW'}
						onchange={updater((p, newValue) => {
							if (!p.crop.infer) return;

							// The if prevent infinite loops since calling the updater
							// triggers a load function re-run, which
							// in turns updates input.disposition
							if (newValue === p.crop.infer[i].input.disposition) return false;

							p.crop.infer[i].input.disposition = newValue;
						})}
						options={[
							{
								key: 'CHW',
								label: '[C, H, W]',
								subtext:
									'Les images en entrée sont des tenseurs de taille [nombre de canaux, hauteur, largeur]'
							},
							{
								key: '1CHW',
								label: '[1, C, H, W]',
								subtext:
									'Les images en entrée sont des tenseurs de taille [1, nombre de canaux, hauteur, largeur]'
							}
						]}
					/>
				</Field>
				<Field>
					{#snippet label()}
						Valeur des pixels
						<p>En entrée du modèle</p>
					{/snippet}
					<RadioButtons
						horizontal
						cards
						value={input.normalized ? 'normalized' : 'raw'}
						onchange={updater((p, newValue) => {
							if (!p.crop.infer) return;

							// The if prevent infinite loops since calling the updater
							// See comment in updater() of RadioButtons above
							const newNormalized = newValue === 'normalized';
							if (newNormalized === p.crop.infer[i].input.normalized) return false;

							p.crop.infer[i].input.normalized = newNormalized;
						})}
						options={[
							{
								key: 'raw',
								label: 'Brutes',
								subtext: /* @wc-include */ 'entre 0 et 255'
							},
							{
								key: 'normalized',
								label: 'Normalisées',
								subtext: /* @wc-include */ 'entre 0 et 1'
							}
						]}
					>
						{#snippet children({ key, label, subtext })}
							{@const colors = [
								[44, 19, 116],
								[148, 0, 0]
							]}
							<div class="color-values-text">
								<span class="text">{label}</span>
								<span class="description">{subtext}</span>
							</div>
							<div class="color-values-examples">
								{#each colors as color (color.join(''))}
									{@const [r, g, b] = color.map((c) =>
										c === 0
											? 0
											: key === 'normalized'
												? (c / 255).toFixed(2)
												: c
									)}
									<div class="color-values-example">
										<div
											class="swatch"
											style:background-color="rgb({color.join(',')})"
										></div>
										<code class="coords">
											<span class="label">R</span>
											{r}
											<br />
											<span class="label">G</span>
											{g}
											<br />
											<span class="label">B</span>
											{b}
										</code>
									</div>
								{/each}
							</div>
						{/snippet}
					</RadioButtons>
				</Field>

				<Field composite label="Forme de la sortie">
					<div class="diagram">
						<ModelOutputShapeDiagram
							{...output}
							onadd={updater((p, atom) => {
								if (!p.crop.infer) return;
								p.crop.infer[i].output.shape.push(atom);
							})}
							onchange={updater((p, j, atom) => {
								if (!p.crop.infer) return;
								p.crop.infer[i].output.shape[j] = atom;
							})}
							ondelete={updater((p, j) => {
								if (!p.crop.infer) return;
								p.crop.infer[i].output.shape = p.crop.infer[i].output.shape.filter(
									(_, index) => index !== j
								);
							})}
						/>
					</div>
				</Field>
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

	.composite-input-line {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 11rem;
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
		padding: 1rem;
		border-radius: var(--corner-radius);

		&:not([open]) {
			border-color: transparent;
		}

		& > :global(*:not(:first-child)) {
			margin-top: 1rem;
		}

		&[open] .marker :global(svg) {
			rotate: 180deg;
		}
	}

	.color-values-text {
		margin-bottom: 0.75em;

		.description,
		p {
			color: var(--gay);
		}
	}

	.color-values-examples {
		display: flex;
		gap: 1.5em;
		margin-bottom: 0.25em;
	}

	.color-values-example {
		display: flex;
		align-items: center;
		gap: 0.75em;

		.swatch {
			width: 2em;
			height: 2em;
			border-radius: 50%;
		}

		.coords {
			font-size: 0.75em;
		}

		.label {
			color: var(--gray);
		}
	}
</style>

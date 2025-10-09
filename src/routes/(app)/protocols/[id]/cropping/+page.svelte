<script>
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonInk from '$lib/ButtonInk.svelte';
	import Field from '$lib/Field.svelte';
	import FieldUrl from '$lib/FieldURL.svelte';
	import { tables } from '$lib/idb.svelte.js';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import IconOpenDetails from '~icons/ph/caret-down';
	import IconTrash from '~icons/ph/trash';
	import IconRemoveFromList from '~icons/ph/x';
	import IconAdd from '~icons/ph/plus';
	import { fade } from 'svelte/transition';
	import Combobox from '$lib/Combobox.svelte';
	import { MODEL_DETECTION_OUTPUT_SHAPES } from '$lib/schemas/protocols.js';
	import { keys } from '$lib/utils.js';

	import 'computer-modern/cmu-serif.css';

	const { data } = $props();
	let settings = $derived(data.crop);

	/**
	 * @template T
	 * @param {(current: NonNullable<typeof settings>, received: T) => void} update
	 * @returns {(received: T) => Promise<void>}
	 */
	function updater(update) {
		return async (received) => {
			const newSettings = $state.snapshot(settings);
			if (!newSettings) return;

			update(newSettings, received);

			await tables.Protocol.update(data.id, 'crop', newSettings);
			settings = newSettings;
		};
	}

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

	<Field label="Stockage des boîtes">TODO</Field>

	<Field label="Stockage de l'état de confirmation">TODO</Field>

	<Field composite>
		{#snippet label()}
			<div class="models-label">
				Modèles d'inférence
				<ButtonInk
					onclick={updater((s) => {
						s.infer ??= [];
						s.infer.push(dummyModelSettings(s.infer.length));
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
							onclick={updater((s) => {
								s.infer = s.infer?.filter((_, index) => index !== i);
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
						onblur={updater((s, newName) => {
							if (!s.infer) return;
							s.infer[i].name = newName;
						})}
					/>
				</Field>
				<FieldUrl
					check
					label="URL du modèle .onnx"
					value={typeof model === 'string' ? model : ''}
					onblur={updater((s, newModel) => {
						if (!s.infer) return;
						s.infer[i].model = newModel;
					})}
				/>
				<Field label="Disposition des pixels">
					<select
						value={input.disposition}
						onchange={updater((s, { currentTarget }) => {
							if (!s.infer) return;
							s.infer[i].input.disposition = currentTarget.value;
						})}
					>
						<option value="CHW">[C, H, W]</option>
						<option value="1CHW">[1, C, H, W]</option>
					</select>
					{#snippet hint()}
						Les images en entrée sont des tenseurs de taille
						{#if input.disposition === 'CHW'}
							[nombre de canaux, hauteur, largeur]
						{:else}
							[1, nombre de canaux, hauteur, largeur]
						{/if}
					{/snippet}
				</Field>
				<Field label="Valeur des pixels">
					<select
						value={input.normalized ? 'normalized' : 'raw'}
						onchange={updater((s, { currentTarget }) => {
							if (!s.infer) return;
							s.infer[i].input.normalized = currentTarget.value === 'normalized';
						})}
					>
						<option value="raw">[0, 255]</option>
						<option value="normalized">[0, 1]</option>
					</select>
					{#snippet hint()}
						Les valeurs des pixels pixels sont
						{#if input.normalized}
							normalisées (entre 0 et 1)
						{:else}
							brutes (entre 0 et 255)
						{/if}
					{/snippet}
				</Field>
				<Field composite label="Taille des images en entrée">
					<div class="composite-input-line">
						<InlineTextInput
							label="Largeur"
							value={input.width.toString()}
							onblur={updater((s, width) => {
								if (!s.infer) return;
								s.infer[i].input.width = parseInt(width, 10);
							})}
						/>
						<span class="separator">×</span>
						<InlineTextInput
							label="Hauteur"
							value={input.height.toString()}
							onblur={updater((s, height) => {
								if (!s.infer) return;
								s.infer[i].input.height = parseInt(height, 10);
							})}
						/>
						<span class="unit">pixels</span>
					</div>
				</Field>
				<Field composite label="Forme de la sortie">
					<div class="output-shape">
						[
						{#each output.shape as dim, j (j)}
							{@const isVariable = (/** @type {string} */ dim) =>
								!['score', '_', 'delete'].includes(dim)}
							{#if j > 0}
								,
							{/if}
							<Combobox
								type="single"
								value={dim}
								wide
								onValueChange={updater((s, newDim) => {
									if (newDim === 'delete') {
										s.infer[i].output.shape = s.infer[i].output.shape.filter(
											(_, index) => index !== j
										);
									} else {
										s.infer[i].output.shape[j] = newDim;
									}
								})}
								options={[...keys(MODEL_DETECTION_OUTPUT_SHAPES), 'delete'].map(
									(key) => ({
										value: key,
										label: key
									})
								)}
							>
								{#snippet input(_, { props })}
									<input class:italic={isVariable(dim)} class="atom" {...props} />
								{/snippet}

								{#snippet items(options, Option)}
									<div class="combobox-items">
										{#each options as option}
											{@render Option(option)}
										{/each}
									</div>
								{/snippet}

								{#snippet item({ value })}
									<div
										class="atom combobox-item"
										class:italic={isVariable(value)}
									>
										{#if value === 'delete'}
											<IconRemoveFromList />
										{:else if value.length === 2}
											<span>
												{value.charAt(0)}<sub>{value.charAt(1)}</sub>
											</span>
										{:else}
											<span>{value}</span>
										{/if}
									</div>
								{/snippet}

								{#snippet details(option)}
									{#if option}
										<p>
											{{
												...MODEL_DETECTION_OUTPUT_SHAPES,
												delete: { help: 'Supprimer cet élément' }
											}[option.value]?.help}
										</p>
									{/if}
								{/snippet}
							</Combobox>
						{/each}
						]
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

	.output-shape,
	.output-shape *,
	.atom,
	.atom * {
		font-family: 'CMU Serif';
	}

	.output-shape .atom {
		width: 6ch;
		text-align: center;
		font-weight: normal;
		font-size: 1.5em;

		&.italic {
			font-style: italic;
		}
	}

	.combobox-item {
		font-family: 'CMU Serif';
		font-size: 1.3em;
		display: flex;
		justify-content: center;
		align-items: center;

		&.italic {
			font-style: italic;
		}
	}

	.combobox-items {
		display: grid;
		height: 100%;
		grid-template-columns: repeat(auto-fill, 7ch);
	}
</style>

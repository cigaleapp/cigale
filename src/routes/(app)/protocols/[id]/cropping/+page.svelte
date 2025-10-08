<script>
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonInk from '$lib/ButtonInk.svelte';
	import Field from '$lib/Field.svelte';
	import FieldUrl from '$lib/FieldURL.svelte';
	import { tables } from '$lib/idb.svelte.js';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import IconOpenDetails from '~icons/ph/caret-down';
	import IconTrash from '~icons/ph/trash';
	import IconAdd from '~icons/ph/plus';
	import { fade } from 'svelte/transition';

	const { data } = $props();
	let settings = $derived(data.crop);

	/**
	 * @param {(current: NonNullable<typeof settings>) => void} update
	 */
	async function updateSettings(update) {
		const newSettings = $state.snapshot(settings);
		if (!newSettings) return;

		update(newSettings);

		await tables.Protocol.update(data.id, 'crop', newSettings);
		settings = newSettings;
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
					onclick={async () => {
						await updateSettings((s) => {
							s.infer ??= [];
							s.infer.push(dummyModelSettings(s.infer.length));
						});
					}}
				>
					<IconAdd />
					Ajouter
				</ButtonInk>
			</div>
		{/snippet}
		{#each settings.infer ?? [] as { model, input, output, name }, i (name)}
			<details>
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
							onclick={async () =>
								await updateSettings((s) => {
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
						onblur={async (newName) => {
							await updateSettings((s) => {
								if (!s.infer) return;
								s.infer[i].name = newName;
							});
						}}
					/>
				</Field>
				<FieldUrl
					check
					label="URL du modèle .onnx"
					value={typeof model === 'string' ? model : ''}
					onblur={async (newModel) => {
						await updateSettings((s) => {
							if (!s.infer) return;
							s.infer[i].model = newModel;
						});
					}}
				/>
				<Field label="Disposition des pixels">
					<select
						value={input.disposition}
						onchange={async ({ currentTarget }) => {
							await updateSettings((s) => {
								if (!s.infer) return;
								s.infer[i].input.disposition = currentTarget.value;
							});
						}}
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
						onchange={async ({ currentTarget }) => {
							await updateSettings((s) => {
								if (!s.infer) return;
								s.infer[i].input.normalized = currentTarget.value === 'normalized';
							});
						}}
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
							onblur={(width) =>
								updateSettings((s) => {
									if (!s.infer) return;
									s.infer[i].input.width = parseInt(width, 10);
								})}
						/>
						<span class="separator">×</span>
						<InlineTextInput
							label="Hauteur"
							value={input.height.toString()}
							onblur={(height) =>
								updateSettings((s) => {
									if (!s.infer) return;
									s.infer[i].input.height = parseInt(height, 10);
								})}
						/>
						<span class="unit">pixels</span>
					</div>
				</Field>
				<Field composite label="Forme de la sortie">
					<code>[</code>
					{#each output.shape as dim, i (i)}
						<label>
							<select class="use-value-for-selected-label" value={dim}>
								<option value="cx"> cx | Coordonnée X du point central</option>
								<option value="cy"> cy | Coordonée Y du point central</option>
								<option value="sy"> sy | Coordonée Y du point supérieur gauche</option>
								<option value="sx"> sx | Coordonée X du point supérieur gauche</option>
								<option value="ex"> ex | Coordonée X du point inférieur droit</option>
								<option value="ey"> ey | Coordonée Y du point inférieur droit</option>
								<option value="w"> w | Largeur de la boîte englobante</option>
								<option value="h"> h | Hauteur de la boîte englobante</option>
								<option value="score">
									score | Score de confiance de cette boîte, entre 0 et 1</option
								>
								<option value="_"> _ | Autre valeur (ignorée par CIGALE)</option>
							</select>
						</label>
					{/each}
					<code>]</code>
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
</style>

<script>
	import { invalidateAll } from '$app/navigation';
	import Checkbox from '$lib/Checkbox.svelte';
	import Field from '$lib/Field.svelte';
	import FieldUrl from '$lib/FieldURL.svelte';
	import { tables } from '$lib/idb.svelte.js';
	import InlineTextInput from '$lib/InlineTextInput.svelte';

	const { data } = $props();
	const settings = $derived(data.crop);

	/**
	 * @param {(current: NonNullable<typeof settings>) => void} update
	 */
	async function updateSettings(update) {
		const newSettings = $state.snapshot(settings);
		if (!newSettings) return;

		update(newSettings);

		await tables.Protocol.update(data.id, 'crop', newSettings);
		await invalidateAll();
	}
</script>

<div class="content">
	{#if !settings}
		<Checkbox
			value={false}
			onchange={async (val) => {
				if (val) {
					await tables.Protocol.update(data.id, 'crop', {
						metadata: 'example',
						infer: {
							model: 'https://example.com/model.onnx',
							input: {
								width: 224,
								height: 224,
								normalized: true
							},
							output: {
								normalized: true,
								shape: ['cx', 'cy', 'w', 'h', 'score']
							}
						}
					});
					await invalidateAll();
				}
			}}>Pas de recadrage automatique</Checkbox
		>
	{:else}
		<Checkbox
			value={true}
			onchange={async (val) => {
				if (!val) {
					const newProtocol = $state.snapshot(data);
					delete newProtocol.crop;
					if (newProtocol.exports) {
						newProtocol.exports.images.cropped = newProtocol.exports.images.cropped.toJSON();
						newProtocol.exports.images.original = newProtocol.exports.images.original.toJSON();
					}
					await tables.Protocol.set(newProtocol);
					await invalidateAll();
				}
			}}
		>
			Recadrage automatique par réseau de neurones
		</Checkbox>

		<FieldUrl
			label="URL du modèle .onnx"
			value={typeof settings.infer.model === 'string' ? settings.infer.model : ''}
			onblur={async (newModel) => {
				await updateSettings((s) => {
					s.infer.model = newModel;
				});
			}}
		/>

		<Field label="Disposition des pixels">
			<select
				value={settings.infer.input.disposition}
				onchange={async ({ currentTarget }) => {
					await updateSettings((s) => {
						s.infer.input.disposition = currentTarget.value;
					});
				}}
			>
				<option value="CHW">[C, H, W]</option>
				<option value="1CHW">[1, C, H, W]</option>
			</select>
			{#snippet hint()}
				Les images en entrée sont des tenseurs de taille
				{#if settings.infer.input.disposition === 'CHW'}
					[nombre de canaux, hauteur, largeur]
				{:else}
					[1, nombre de canaux, hauteur, largeur]
				{/if}
			{/snippet}
		</Field>

		<Field label="Valeur des pixels">
			<select
				value={settings.infer.input.normalized ? 'normalized' : 'raw'}
				onchange={async ({ currentTarget }) => {
					await updateSettings((s) => {
						s.infer.input.normalized = currentTarget.value === 'normalized';
					});
				}}
			>
				<option value="raw">[0, 255]</option>
				<option value="normalized">[0, 1]</option>
			</select>
			{#snippet hint()}
				Les valeurs des pixels pixels sont
				{#if settings.infer.input.normalized}
					normalisées (entre 0 et 1)
				{:else}
					brutes (entre 0 et 255)
				{/if}
			{/snippet}
		</Field>

		<Field label="Taille des images en entrée">
			<div class="composite-input-line">
				<InlineTextInput
					label="Largeur"
					value={settings.infer.input.width.toString()}
					onblur={(width) =>
						updateSettings((s) => {
							s.infer.input.width = parseInt(width, 10);
						})}
				/>
				<span class="separator">×</span>
				<InlineTextInput
					label="Hauteur"
					value={settings.infer.input.height.toString()}
					onblur={(height) =>
						updateSettings((s) => {
							s.infer.input.height = parseInt(height, 10);
						})}
				/>
				<span class="unit">pixels</span>
			</div>
		</Field>
	{/if}
</div>

<style>
	.content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 2rem;
	}

	.composite-input-line {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 11rem;
	}
</style>

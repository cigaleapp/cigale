<script lang="ts">
	import { ArkErrors } from 'arktype';
	import { fade } from 'svelte/transition';

	import { invalidateAll } from '$app/navigation';
	import { EXIF_FIELDS } from '$lib/exiffields';
	import FieldUrl from '$lib/FieldURL.svelte';
	import { tables } from '$lib/idb.svelte';
	import RadioButtons from '$lib/RadioButtons.svelte';
	import { EXIFField } from '$lib/schemas/metadata.js';
	import { toasts } from '$lib/toasts.svelte.js';
	import { keys, omit } from '$lib/utils';

	const { data } = $props();
	const { infer, id } = $derived(data.metadata);

	const inferenceTypes = /** @type {const} */ ([
		{ key: 'none', label: "Pas d'inférence" },
		{ key: 'neural', label: 'Réseau neuronal' },
		{ key: 'exif', label: 'EXIF' }
	]);

	const modelUrl = $derived.by(() => {
		if (!infer) return '';
		if (!('neural' in infer)) return '';
		if (!infer.neural.model) return '';
		if (typeof infer.neural.model === 'string') return infer.neural.model;
		return infer.neural.model.url;
	});

	const placeholderNeuralSettings = {
		model: 'http://example.com/model.onnx',
		input: {
			width: 224,
			height: 224,
			normalized: true
		}
	};

	const currentInferenceType = $derived(
		infer ? ('exif' in infer ? 'exif' : 'neural' in infer ? 'neural' : 'none') : 'none'
	);
</script>

<div class="content" in:fade={{ duration: 100 }}>
	<RadioButtons
		options={inferenceTypes}
		value={currentInferenceType}
		onchange={async (key) => {
			if (key === 'none' && currentInferenceType !== 'none') {
				await tables.Metadata.set(omit(data.metadata, 'infer'));
				await invalidateAll();
			}
		}}
	>
		{#snippet children({ key, label })}
			<h3>{label}</h3>

			{#if key === 'neural'}
				<FieldUrl
					check
					label="URL du modèle"
					value={modelUrl}
					onblur={async (newModel) => {
						if (!newModel) {
							return;
						}

						const currentNeuralSettings = $state.snapshot(
							infer && 'neural' in infer && infer.neural ? infer.neural : {}
						);

						await tables.Metadata.update(id, 'infer', {
							neural: {
								...placeholderNeuralSettings,
								...currentNeuralSettings,
								model: newModel
							}
						});
						await invalidateAll();
					}}
				/>
			{:else if key === 'exif'}
				<div class="field">
					<label>
						<span class="label">Champ EXIF à utiliser</span>
						<input
							type="text"
							value={infer && 'exif' in infer ? infer.exif : ''}
							list="exif-fields"
							onblur={async ({ currentTarget }) => {
								const newExif = EXIFField(currentTarget.value);
								if (newExif instanceof ArkErrors) {
									toasts.error(`Champ EXIF invalide: ${newExif.summary}`);
									return;
								}

								await tables.Metadata.update(id, 'infer', { exif: newExif });
								await invalidateAll();
							}}
						/>
						<datalist id="exif-fields">
							{#each keys(EXIF_FIELDS) as field (field)}
								<option value={field}>{EXIF_FIELDS[field]}</option>
							{/each}
						</datalist></label
					>
				</div>
			{/if}
		{/snippet}
	</RadioButtons>
</div>

<style>
	h3 {
		display: inline-block;
		font-weight: normal;
	}

	.field {
		margin-top: 1rem;
		padding-left: 1rem;
	}

	.field:last-child {
		margin-bottom: 1rem;
	}
</style>

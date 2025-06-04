<script>
	import { invalidateAll } from '$app/navigation';
	import { EXIF_FIELDS } from '$lib/exiffields';
	import { tables } from '$lib/idb.svelte';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import RadioButtons from '$lib/RadioButtons.svelte';
	import SelectWithSearch from '$lib/SelectWithSearch.svelte';
	import { keys, omit } from '$lib/utils';
	import IconCheck from '~icons/ph/check';
	import IconFail from '~icons/ph/x';

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

<div class="content">
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
				<div class="field">
					<label>
						<span class="label">URL vers le modèle .onnx</span>
						<InlineTextInput
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
					</label>
					{#if modelUrl}
						{#await fetch(modelUrl, { method: 'HEAD' }) then { ok, status, text }}
							{#if ok}
								<div class="check ok">
									<IconCheck />
									Modèle accessible
								</div>
							{:else}
								<div class="check fail">
									<IconFail />
									Impossible de charger le modèle: HTTP {status}
									{#await text() then text}{text}{/await}
								</div>
							{/if}
						{:catch error}
							<div class="check fail">
								<IconFail />
								Impossible de charger le modèle: {error}
							</div>
						{/await}
					{/if}
				</div>
			{:else if key === 'exif'}
				<div class="field">
					<label>
						<span class="label">Champ EXIF à utiliser</span>
						<SelectWithSearch
							options={keys(EXIF_FIELDS)}
							searchQuery={infer && 'exif' in infer ? infer.exif : ''}
							selectedValue={infer && 'exif' in infer ? infer.exif : ''}
							onblur={async (newExif) => {
								console.log('updatewithexif', newExif);
								if (!newExif) return;

								await tables.Metadata.update(id, 'infer', { exif: newExif });
								await invalidateAll();
							}}
						/>
					</label>
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

	.content {
		padding: 2rem;
	}

	.field {
		margin-top: 1rem;
		padding-left: 1rem;
	}

	.field:last-child {
		margin-bottom: 1rem;
	}

	.field .label {
		text-transform: uppercase;
		letter-spacing: 1px;
		font-weight: bold;
		font-size: 0.9em;
	}

	.check {
		display: flex;
		align-items: center;
		gap: 0.25em;
		font-size: 0.9em;
	}

	.check.ok {
		color: var(--fg-success);
	}
	.check.fail {
		color: var(--fg-error);
	}
</style>

<script lang="ts">
	import { ArkErrors, type } from 'arktype';
	import { dequal } from 'dequal';
	import { dichotomid } from 'dichotomid';
	import * as onnx from 'onnxruntime-web';
	import { watch } from 'runed';

	import IconArrowDown from '~icons/ri/arrow-down-line';
	import IconIsScalar from '~icons/ri/bar-chart-horizontal-line';
	import IconIsTensor from '~icons/ri/brackets-line';
	import IconFileModel from '~icons/ri/file-settings-line';
	import IconFileText from '~icons/ri/file-text-line';
	import ButtonPrimary from '$lib/ButtonPrimary.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import { Schemas } from '$lib/database.js';
	import Field from '$lib/Field.svelte';
	import FieldURL from '$lib/FieldURL.svelte';
	import { promptForFiles } from '$lib/files.js';
	import { errorMessage, formatBytesSize, uppercaseFirst } from '$lib/i18n.js';
	import { tables } from '$lib/idb.svelte.js';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import LoadingScreen from '$lib/LoadingScreen.svelte';
	import LoadingSpinner from '$lib/LoadingSpinner.svelte';
	import Modal from '$lib/Modal.svelte';
	import { globalModals } from '$lib/modals.svelte.js';
	import ModelOutputShapeDiagram from '$lib/ModelOutputShapeDiagram.svelte';
	import OverflowableText from '$lib/OverflowableText.svelte';
	import SegmentedGroup from '$lib/SegmentedGroup.svelte';
	import { createBytes } from '$lib/storage/utils.js';
	import { toasts } from '$lib/toasts.svelte.js';
	import { tooltip } from '$lib/tooltips.js';
	import { entries, keys, switchValue } from '$lib/utils.js';

	type Network = (typeof Schemas.CustomNeuralNetwork)['inferIn'];
	type RemoteNetwork = Network & { source: 'remote' };
	type ClassifyNetwork = Network & { purpose: 'classify' };
	type DetectNetwork = Network & { purpose: 'detect' };

	const DETECTION_OUTPUT_SHAPE_PRESETS = {
		yolo11: ['cx', 'cy', 'w', 'h', 'score', '_'],
	} as const;

	const DEFAULT_DATA: Omit<(typeof Schemas.CustomNeuralNetwork)['inferIn'], 'id'> = {
		purpose: 'classify',
		filename: '',
		name: '',
		output: {},
		source: 'local',
		url: '',
		input: {
			width: 0,
			height: 0,
			disposition: '1CHW',
			normalized: true,
		},
	};

	let data = $state({ ...DEFAULT_DATA });

	let classmappingSource = $derived<'remote' | 'local' | 'manual'>(data.source);

	const nameAlreadyTaken = $derived(
		tables.CustomNeuralNetwork.state.some((nn) => nn.name === data.name)
	);

	let onnxFile = $state<File>();
	let classmappingFile = $state<File>();
	let classmappingUrl = $state<URL>();
	let modelNameIsPrefilled = $state(false);

	let analyzingModel = $state(false);
	let session = $state<onnx.InferenceSession>();

	watch([() => data.source, () => data.url, () => onnxFile], () => {
		void (async () => {
			if (session) await session.release();
			session = undefined;

			analyzingModel = true;

			switch (data.source) {
				case 'local': {
					if (!onnxFile) return;
					data.filename = onnxFile.name;
					session = await onnx.InferenceSession.create(await onnxFile.arrayBuffer());
					break;
				}
				case 'remote': {
					data.filename = 'none';
					if (!data.url) return;
					if (typeof data.url !== 'string') return;
					session = await onnx.InferenceSession.create(data.url);
					break;
				}
			}
		})().finally(() => {
			analyzingModel = false;
		});
	});

	watch([() => onnxFile, () => data.url], () => {
		const pretty = (filename: string, i: number) =>
			uppercaseFirst(
				filename
					.replace(/\.onnx$/, '')
					.replaceAll(/[-_.]/g, ' ')
					.trim()
			) + (i > 1 ? ` ${i}` : '');

		if (data.name && !modelNameIsPrefilled) return;

		const nameBase = onnxFile
			? onnxFile.name
			: URL.canParse(data.url)
				? new URL(data.url).pathname.split('/').at(-1)
				: '';

		if (!nameBase) return;

		modelNameIsPrefilled = true;

		data.name = pretty(
			nameBase,
			dichotomid(
				(i) =>
					!tables.CustomNeuralNetwork.state.some((nn) => nn.name === pretty(nameBase, i))
			)
		);
	});

	$effect(() => {
		if (!session) {
			data.input = {
				disposition: '1CHW',
				height: 0,
				width: 0,
				normalized: true,
				name: '',
			};

			if (data.output) data.output.name = '';

			return;
		}

		const input = session?.inputMetadata.find((m) => m.isTensor);
		const output = session?.outputMetadata.find((m) => m.isTensor);

		switch (input?.shape.length) {
			case 4: {
				const [batch, chan, width, height] = input.shape;
				if (chan === 3 && (batch === 1 || batch.toString().includes('batch'))) {
					data.input.disposition = '1CHW';
					data.input.normalized = input.type.startsWith('float');
					data.input.name = input.name;
					if (typeof width === 'number') data.input.width = width;
					if (typeof height === 'number') data.input.height = height;
				}
			}
		}

		if (output) {
			data.output ??= {};
			data.output.name = output.name;
		}
	});

	let formElement = $state<HTMLFormElement>();

	const expectedClassmappingSize = $derived.by(() => {
		const outputs = session?.outputMetadata.filter((o) => o.isTensor);
		if (!outputs) return;
		if (outputs.length !== 1) return;
		const [output] = outputs;

		switch (output.shape.length) {
			case 1:
				return output.shape[0];
			case 2:
				return output.shape[1];
		}
	});
</script>

<Modal
	--modal-width="calc(100vw - 4rem)"
	--modal-height="calc(100vh - 4rem)"
	key="modal_create_custom_neural_network"
	bind:open={
		() => undefined,
		(open) => {
			globalModals.modal_create_custom_neural_network.open = (prefill) => {
				data = { ...data, ...prefill };
				open?.();
			};
		}
	}
	title="Ajouter un réseau neuronal"
>
	<form onsubmit={(e) => e.preventDefault()} bind:this={formElement}>
		<section class="source">
			<SegmentedGroup options={['local', 'remote'] as const} bind:current={data.source}>
				{#snippet option_remote()}
					URL
				{/snippet}
				{#snippet option_local()}
					Fichier .onnx
				{/snippet}
			</SegmentedGroup>
			{#if data.source === 'remote'}
				<FieldURL
					check
					label="URL vers un fichier .onnx"
					value={(data as RemoteNetwork).url}
					onblur={(newURL) => {
						(data as RemoteNetwork).url = newURL;
					}}
				/>
			{:else if data.source === 'local'}
				<ButtonSecondary
					loading={analyzingModel}
					onclick={async () => {
						const [file] = await promptForFiles({ accept: '.onnx', multiple: false });
						onnxFile = file;
					}}
				>
					{#if analyzingModel}
						<LoadingSpinner />

						Analyse…
					{:else}
						<IconFileModel />
						{#if onnxFile}
							<OverflowableText text={onnxFile.name} />
							<span class="model-size">
								{formatBytesSize(onnxFile.size)}
							</span>
						{:else}
							Ajouter un fichier .onnx
						{/if}
					{/if}
				</ButtonSecondary>
			{/if}
			<Field
				label="Nom du modèle"
				error={nameAlreadyTaken ? 'Un autre réseau a déjà ce nom' : ''}
			>
				<InlineTextInput
					label="Nom du modèle"
					bind:value={data.name}
					onblur={(value) => {
						if (value === data.name) return;

						modelNameIsPrefilled = false;
					}}
				/>
			</Field>
		</section>

		<section class="preview">
			<LoadingScreen
				empty={!session ? 'Aucun modèle chargé' : ''}
				loading={analyzingModel ? 'Analyse du réseau…' : ''}
			>
				{#if session}
					<div class="model-analysis">
						<!-- <h2>Structure du réseau</h2> -->

						<div class="layers">
							<span class="title">Entrées</span>
							<ul class="inputs">
								{#each session.inputMetadata as input (input.name)}
									{@render layer(input)}
								{/each}
							</ul>
						</div>
						<div class="arrow">
							<IconArrowDown />
						</div>
						<!-- <div class="layers">
							<span class="title">Couches cachées</span>
							<ul class="inputs">
								<li>…</li>
							</ul>
						</div>
						<div class="arrow">
							<IconArrowDown />
						</div> -->
						<div class="layers">
							<span class="title">Sorties</span>
							<ul class="outputs">
								{#each session.outputMetadata as output (output.name)}
									{@render layer(output)}
								{/each}
							</ul>
						</div>
					</div>
				{/if}

				{#snippet layer(layer: onnx.ValueMetadata)}
					<li class="layer">
						<div class="identity">
							{#if layer.isTensor}
								<IconIsTensor />
							{:else}
								<IconIsScalar />
							{/if}
							<span class="name">
								{layer.name}
							</span>
						</div>

						{#if layer.isTensor}
							<div class="data">
								<code class="shape">[{layer.shape.map(String).join(', ')}]</code>
								<code class="mul">×</code>
								<code class="typename" use:tooltip={layer.type}>
									{layer.type
										.replace('float', 'f')
										.replace('int', 'i')
										.replace('uint', 'u')
										.replace('string', 'str')}
								</code>
							</div>
						{/if}
					</li>
				{/snippet}
			</LoadingScreen>
		</section>

		<fieldset class="input">
			<legend> Entrée </legend>
			<Field compact label="Couche">
				<InlineTextInput disabled={analyzingModel} bind:value={data.input.name} />
			</Field>
			<Field composite label="Taille des images">
				<div class="size-input">
					<InlineTextInput
						disabled={analyzingModel}
						placeholder="Largeur"
						inputmode="numeric"
						value={data.input.width}
						Type={type('string.integer.parse')}
						onblur={(value) => {
							data.input.width = value;
						}}
					/> × <InlineTextInput
						disabled={analyzingModel}
						placeholder="Hauteur"
						inputmode="numeric"
						value={data.input.height}
						Type={type('string.integer.parse')}
						onblur={(value) => {
							data.input.height = value;
						}}
					/>
				</div>
			</Field>
			<Field label="Disposition">
				<SegmentedGroup
					disabled={analyzingModel}
					options={['1CHW', 'CHW'] as const}
					bind:current={data.input.disposition}
				>
					{#snippet option_1CHW()}
						Batch, Canal, Hauteur, Largeur
					{/snippet}
					{#snippet option_CHW()}
						Canal, Hauteur, Largeur
					{/snippet}
				</SegmentedGroup>
			</Field>
			<Field label="Pixels">
				<SegmentedGroup
					disabled={analyzingModel}
					options={['normalized', 'raw'] as const}
					bind:current={
						() => (data.input.normalized ? 'normalized' : 'raw'),
						(v) => {
							data.input.normalized = v === 'normalized';
						}
					}
				>
					{#snippet option_normalized()}
						Normalisés (0—1)
					{/snippet}
					{#snippet option_raw()}
						Bruts (0—255)
					{/snippet}
				</SegmentedGroup>
			</Field>
		</fieldset>

		<fieldset class="output">
			<legend>Sortie</legend>

			<Field compact label="Couche">
				<InlineTextInput disabled={analyzingModel} bind:value={data.output.name} />
			</Field>

			<Field label="Type de réseau">
				<SegmentedGroup
					options={['classify', 'detect'] as const}
					bind:current={data.purpose}
				>
					{#snippet option_classify()}
						Classification
					{/snippet}
					{#snippet option_detect()}
						Détection
					{/snippet}
				</SegmentedGroup>
			</Field>

			{#if data.purpose === 'classify'}
				{const d = data as ClassifyNetwork}

				<Field
					composite
					label="Classmapping"
					hint="Une valeur de métadonnée par ligne, dans le même ordre que les neurones"
					warning={expectedClassmappingSize &&
					Array.isArray(d.classmapping) &&
					d.classmapping.length !== expectedClassmappingSize
						? `Le classmapping comporte ${d.classmapping.length} entrées mais le réseau semble avoir ${expectedClassmappingSize} neurones en sortie`
						: ''}
				>
					<section class="source">
						<SegmentedGroup
							options={['local', 'remote', 'manual'] as const}
							bind:current={classmappingSource}
						>
							{#snippet option_local()}
								Fichier .txt
							{/snippet}
							{#snippet option_remote()}
								URL
							{/snippet}
							{#snippet option_manual()}
								Manuel
							{/snippet}
						</SegmentedGroup>

						{#if classmappingSource === 'manual'}
							<textarea
								rows="5"
								value={Array.isArray(d.classmapping)
									? d.classmapping.join('\r\n')
									: d.classmapping?.toString()}
								onblur={({ target }) => {
									if (!(target instanceof HTMLTextAreaElement)) return;
									const lines = target.value?.split(/\r?\n/) ?? [];
									if (lines.length === 1) {
										(data as ClassifyNetwork).classmapping = lines[0];
									} else {
										(data as ClassifyNetwork).classmapping = lines;
									}
								}}></textarea>
						{:else if classmappingSource === 'local'}
							<ButtonSecondary
								onclick={async () => {
									const [file] = await promptForFiles({
										multiple: false,
										accept: ['.txt', 'text/plain'],
									});
									if (!file) return;
									classmappingFile = file;
									const text = await file.text();
									(data as ClassifyNetwork).classmapping = text
										.split(/\r?\n/)
										.map((line) => line.trim())
										.filter(Boolean);
								}}
							>
								{#snippet children({ loading })}
									{#if loading}
										<LoadingSpinner /> Chargement…
									{:else if classmappingFile}
										<IconFileText />
										<OverflowableText text={classmappingFile.name} />
										{#if Array.isArray(d.classmapping)}
											<span class="model-size">
												{d.classmapping.length} classes
											</span>
										{/if}
									{:else}
										<IconFileText />
										Ajouter un fichier .txt
									{/if}
								{/snippet}
							</ButtonSecondary>
						{:else if classmappingSource === 'remote'}
							<FieldURL
								check
								label="URL vers un fichier .txt"
								value={classmappingUrl?.toString() ?? ''}
								onblur={async (url) => {
									classmappingUrl = new URL(url);
									const text = await fetch(url).then((r) => r.text());
									(data as ClassifyNetwork).classmapping = text
										.split(/\r?\n/)
										.map((line) => line.trim())
										.filter(Boolean);
								}}
							/>
						{/if}
					</section>
				</Field>
			{:else}
				{const d = data as DetectNetwork}
				<Field label="Coordonnées des boîtes">
					<SegmentedGroup
						options={['normalized', 'raw'] as const}
						bind:current={
							() =>
								d.output?.normalized === true
									? 'normalized'
									: d.output?.normalized === false
										? 'raw'
										: undefined,
							(v) => {
								d.output ??= { normalized: true, shape: [] };
								d.output.normalized = v === 'normalized';
							}
						}
					>
						{#snippet option_normalized()}
							Normalisées (0—1)
						{/snippet}
						{#snippet option_raw()}
							Brutes (pixels)
						{/snippet}
					</SegmentedGroup>
				</Field>

				<Field composite label="Forme de la sortie">
					<section class="presets">
						<SegmentedGroup
							options={['custom', ...keys(DETECTION_OUTPUT_SHAPE_PRESETS)] as const}
							bind:current={
								() =>
									entries(DETECTION_OUTPUT_SHAPE_PRESETS)
										.map(([preset, shape]) =>
											dequal(shape, d.output.shape) ? preset : null
										)
										.find(Boolean) ?? 'custom',
								(preset) => {
									if (preset === 'custom') return;
									d.output.shape = switchValue(
										preset,
										DETECTION_OUTPUT_SHAPE_PRESETS
									);
								}
							}
						>
							{#snippet option_custom()}
								Personnalisé
							{/snippet}
							{#snippet option_yolo11()}
								YOLOv11
							{/snippet}
						</SegmentedGroup>
					</section>

					<ModelOutputShapeDiagram
						shape={d.output?.shape ?? []}
						onadd={(atom) => {
							d.output ??= { normalized: true, shape: [] };
							d.output.shape ??= [];

							d.output.shape.push(atom);
						}}
						onchange={([i, atom]) => {
							d.output.shape[i] = atom;
						}}
						ondelete={(i) => {
							d.output.shape.splice(i, 1);
						}}
					/>
				</Field>
			{/if}
		</fieldset>
	</form>

	{const validation = $derived(Schemas.CustomNeuralNetwork.omit('id')(data))}

	{#if validation instanceof ArkErrors}
		<ul class="validation-errors">
			{#each validation.summary.split('\n') as line, i (i)}
				<li>{line}</li>
			{/each}
		</ul>
	{/if}

	{#snippet footer({ close })}
		<ButtonSecondary onclick={close}>Annuler</ButtonSecondary>
		<ButtonPrimary
			disabled={nameAlreadyTaken || !Schemas.CustomNeuralNetwork.allows({ ...data, id: '_' })}
			onclick={async () => {
				if (data.source === 'local') {
					if (!onnxFile) return;

					const { filename: actualFilename } = await createBytes('CustomNeuralNetwork', {
						filename: onnxFile.name,
						bytes: await onnxFile.arrayBuffer(),
						type: 'application/octet-stream',
					});

					data.filename = actualFilename;
				}

				try {
					await tables.CustomNeuralNetwork.add($state.snapshot(data));
					close?.();
					formElement?.reset();
					onnxFile = undefined;
					classmappingFile = undefined;
					classmappingUrl = undefined;
					data = { ...DEFAULT_DATA };
				} catch (e) {
					toasts.error(errorMessage(e));
				}
			}}
		>
			{#snippet children({ loading })}
				{#if loading}
					Ajout…
				{:else}
					Ajouter
				{/if}
			{/snippet}
		</ButtonPrimary>
	{/snippet}
</Modal>

<style>
	form,
	fieldset,
	section.source {
		display: flex;
		flex-direction: column;
		gap: 1em;
	}

	.size-input {
		display: flex;
		gap: 1em;
		max-width: 20ch;
	}

	.model-size {
		margin-left: 2ch;
		text-wrap: nowrap;
		color: var(--gay);
	}

	form {
		width: 100%;
		height: 100%;
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		grid-template-rows: 200px 1fr;

		gap: 2em;

		@media (max-width: 1000px) {
			grid-template-columns: 1fr;
			grid-template-rows: unset;
		}
	}

	.model-analysis {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1em;
		padding: 1em 2em;

		@media (max-width: 1000px) {
			padding-inline: 0;
		}
	}

	.layers {
		width: 100%;
		overflow-y: auto;

		.title {
			display: block;
			font-style: italic;
		}

		ul {
			list-style: none;
			padding: 0;
			display: flex;
			flex-direction: column;
			gap: 0.5em;
		}

		.layer,
		.layer > * {
			display: flex;
			gap: 0.5em;
			align-items: center;
		}

		.layer {
			flex-wrap: wrap;
			column-gap: 1em;
			justify-content: space-between;
		}

		.layer code {
			font-size: 0.7em;
		}

		.typename {
			color: var(--fg-primary);
		}

		.shape {
			margin-left: auto;
			color: var(--gay);
		}
	}

	.warning {
		color: var(--fg-warning);

		/* XXX: to vertically center (display:flex doesnt work since paragraph has multiple lines) */
		:global(.icon) {
			margin-bottom: -0.125lh;
		}
	}

	fieldset {
		border-radius: var(--corner-radius);
		border-color: var(--faint);
	}

	fieldset legend {
		display: flex;
		align-items: center;
		gap: 1ch;
	}

	/* .validation-errors {
		margin-top: 2em;
		color: var(--fg-error);
	} */
</style>

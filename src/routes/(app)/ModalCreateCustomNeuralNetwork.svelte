<script lang="ts">
	import * as onnx from 'onnxruntime-web';
	import { watch } from 'runed';

	import IconArrowDown from '~icons/ri/arrow-down-line';
	import IconIsScalar from '~icons/ri/bar-chart-horizontal-line';
	import IconIsTensor from '~icons/ri/brackets-line';
	import IconWarning from '~icons/ri/error-warning-line';
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
	import OverflowableText from '$lib/OverflowableText.svelte';
	import SegmentedGroup from '$lib/SegmentedGroup.svelte';
	import { createBytes } from '$lib/storage/utils.js';
	import { toasts } from '$lib/toasts.svelte.js';
	import { tooltip } from '$lib/tooltips.js';

	type Network = (typeof Schemas.CustomNeuralNetwork)['inferIn'];
	type RemoteNetwork = Network & { source: 'remote' };
	type ClassifyNetwork = Network & { purpose: 'classify' };

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

	let data = $state(DEFAULT_DATA);

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
		const pretty = (filename) =>
			uppercaseFirst(
				filename
					.replace(/\.onnx$/, '')
					.replaceAll(/[-_.]/g, ' ')
					.trim()
			);

		if (data.name && !modelNameIsPrefilled) return;

		modelNameIsPrefilled = true;

		if (onnxFile) data.name = pretty(onnxFile.name);
		if (data.url) {
			const { pathname } = new URL(data.url);
			data.name = pretty(pathname.split('/').at(-1));
		}
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
					data.input = {
						disposition: '1CHW',
						width,
						height,
						normalized: input.type.startsWith('float'),
						name: input.name,
					};
				}
			}
		}

		if (output) {
			data.output ??= {};
			data.output.name = output.name;
		}
	});

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
	bind:open={globalModals.modal_create_custom_neural_network.open}
	title="Ajouter un réseau neuronal"
>
	<form onsubmit={(e) => e.preventDefault()}>
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
							Ajouter un fichier
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
					onblur={({ target }) => {
						if (!(target instanceof HTMLInputElement)) return;

						if (target.value === data.name) return;

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
						bind:value={data.input.width}
					/> × <InlineTextInput
						disabled={analyzingModel}
						placeholder="Hauteur"
						bind:value={data.input.height}
					/>
				</div>
			</Field>
			<Field label="Disposition ">
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
										d.classmapping = lines[0];
									} else {
										d.classmapping = lines;
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
									d.classmapping = text
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
										Ajouter un fichier
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
									d.classmapping = text
										.split(/\r?\n/)
										.map((line) => line.trim())
										.filter(Boolean);
								}}
							/>
						{/if}
					</section>
				</Field>
			{:else}
				<IconWarning /> Pas encore disponible
			{/if}
		</fieldset>
	</form>

	<!-- {const validation = $derived(Schemas.CustomNeuralNetwork(data))}

	{#if validation instanceof ArkErrors}
		<ul class="validation-errors">
			{#each validation.summary.split('\n') as line, i (i)}
				<li>{line}</li>
			{/each}
		</ul>
	{/if} -->

	{#snippet footer({ close })}
		<ButtonSecondary onclick={close}>Annuler</ButtonSecondary>
		<ButtonPrimary
			disabled={nameAlreadyTaken || !Schemas.CustomNeuralNetwork.allows({ ...data, id: '_' })}
			onclick={async () => {
				if (data.source === 'local') {
					if (!onnxFile) return;

					await createBytes('CustomNeuralNetwork', {
						filename: onnxFile.name,
						sessionId: '_',
						bytes: await onnxFile.arrayBuffer(),
						type: 'application/octet-stream',
					});
				}

				try {
					await tables.CustomNeuralNetwork.add($state.snapshot(data));
					data = { ...DEFAULT_DATA };
					close();
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
		grid-template-rows: 175px 1fr;

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

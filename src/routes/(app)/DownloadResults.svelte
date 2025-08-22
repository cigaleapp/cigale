<script>
	import { asset } from '$app/paths';
	import { page } from '$app/state';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import { downloadAsFile } from '$lib/download';
	import { tables } from '$lib/idb.svelte';
	import { parseCropPadding } from '$lib/images';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import LoadingSpinner from '$lib/LoadingSpinner.svelte';
	import Modal from '$lib/Modal.svelte';
	import { ensureNoLoneImages } from '$lib/observations';
	import { m } from '$lib/paraglide/messages.js';
	import ProgressBar from '$lib/ProgressBar.svelte';
	import RadioButtons from '$lib/RadioButtons.svelte';
	import SegmentedGroup from '$lib/SegmentedGroup.svelte';
	import { uiState } from '$lib/state.svelte';
	import { toastIcon, toasts, toastTheme } from '$lib/toasts.svelte';
	import { tick } from 'svelte';
	import Download from '~icons/ph/download-simple';

	// TODO show download size estimates

	/**
	 * @typedef {object} Props
	 * @property {() => void} open
	 * @property {import('swarpc').SwarpcClient<typeof import('$lib/../web-worker-procedures.js').PROCEDURES>} swarpc
	 */

	/** @type {Props} */
	let { open = $bindable(), swarpc } = $props();

	const progress = $derived(uiState.processing.progress);

	let exporting = $state(false);
	/** @type {'metadataonly'|'croppedonly'|'full'} */
	let include = $state('croppedonly');

	let cropPadding = $derived(parseCropPadding(uiState.currentProtocol?.crop.padding ?? '0px'));
	/**
	 * @type {'none'|'small'|'medium'|'customPercent'|'customPixels'|undefined}
	 */
	let cropPaddingPreset = $derived.by(() => {
		if (cropPadding.unitless === 0) return 'none';
		if (cropPadding.unit === 'px') return 'customPixels';
		if (cropPadding.unitless === 5) return 'small';
		if (cropPadding.unitless === 10) return 'medium';
		return 'customPercent';
	});

	$effect(() => {
		switch (cropPaddingPreset) {
			case 'none':
				cropPadding = parseCropPadding('0px');
				break;

			case 'small':
				cropPadding = parseCropPadding('5%');
				break;

			case 'medium':
				cropPadding = parseCropPadding('10%');
				break;

			default:
				break;
		}
	});

	async function generateExport() {
		await toasts.clear('exporter');
		uiState.processing.reset();
		exporting = true;

		const chosenProtocol = tables.Protocol.state.find((p) => p.id === uiState.currentProtocolId);
		if (!chosenProtocol) {
			toasts.error(m.no_protocol_selected());
			exporting = false;
			return;
		}
		try {
			await ensureNoLoneImages();
			uiState.processing.total = 1;
			uiState.processing.done = 0;
			const zipfileBytes = await swarpc.generateResultsZip(
				{
					include,
					protocolId: chosenProtocol.id,
					cropPadding: cropPadding.withUnit,
					jsonSchemaURL: new URL(asset('/results.schema.json'), page.url.origin).toString()
				},
				({ warning, progress }) => {
					if (warning) {
						const [message, args] = warning;

						switch (message) {
							case 'exif-write-error':
								toasts.warn(m.cannot_add_exif_metadata_to_image(args));
								break;
						}
					}

					if (progress) uiState.processing.done = progress;
				}
			);

			downloadAsFile(zipfileBytes, 'results.zip', 'application/zip');
		} catch (error) {
			console.error(error);
			toasts.error(
				m.error_while_exporting_results({ error: error?.toString() ?? m.unexpected_error() })
			);
		} finally {
			exporting = false;
		}
	}
</script>

<Modal
	--footer-direction="column"
	key="modal_export_results"
	bind:open
	title={m.export_results()}
	onopen={() => {
		toasts.setCurrentPool('exporter');
	}}
	onclose={() => {
		toasts.setCurrentPool('default');
		uiState.processing.reset();
	}}
>
	<div class="include">
		<RadioButtons
			bind:value={include}
			options={[
				{ key: 'metadataonly', label: m.metadata_only() },
				{ key: 'croppedonly', label: m.metadata_and_cropped_images() },
				{
					key: 'full',
					label: m.metadata_cropped_and_full_images(),
					subtext: m.allows_reusing_export_later()
				}
			]}
		/>
	</div>

	<section class="crop-padding" class:irrelevant={include === 'metadataonly'}>
		<div class="label">{m.padding_around_cropped_images()}</div>

		<SegmentedGroup
			options={['none', 'small', 'medium', 'customPercent', 'customPixels']}
			labels={{ none: 'Aucune', small: '5%', medium: '10%' }}
			bind:value={cropPaddingPreset}
		>
			{#snippet customOption(option)}
				{@const unit = option === 'customPercent' ? '%' : 'px'}
				<div class="numeric" style:--width={unit === '%' ? '3ch' : '4ch'}>
					<InlineTextInput
						label={option === 'customPercent' ? m.in_percent_of_image_dimensions() : m.in_pixels()}
						value={cropPadding.unitless === 0
							? '0'
							: cropPadding.unit === unit
								? cropPadding.unitless.toString()
								: '?'}
						onblur={async (newValue) => {
							// otherwise, the input value updates to a '?' too quickly when changing value but not unit
							await tick();
							const parsed = Number.parseInt(newValue, 10);
							if (!isNaN(parsed) && parsed > 0) {
								cropPadding = parseCropPadding(parsed + unit);
								cropPaddingPreset = option;
							}
						}}
					/>
					{unit}
				</div>
			{/snippet}
		</SegmentedGroup>
		<p class="fineprint">{m.crop_padding_relative_values_explainer()}</p>
	</section>

	{#snippet footer()}
		<section class="errors">
			<ul>
				{#each toasts.items('exporter') as toast (toast.id)}
					{@const Icon = toastIcon(toast.type)}

					<li style:color="var(--fg-{toastTheme(toast.type)})">
						<Icon />
						{toast.message}
					</li>
				{/each}
			</ul>
		</section>
		<section class="progress">
			<ProgressBar percentage alwaysActive {progress} />
		</section>

		<ButtonSecondary onclick={generateExport}>
			{#if exporting}
				<LoadingSpinner />
			{:else}
				<Download />
			{/if}
			results.zip
		</ButtonSecondary>
	{/snippet}
</Modal>

<style>
	.progress {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 300px;
		--corners: var(--corner-radius);
		margin-bottom: 1rem;
		gap: 0.5em;
	}

	.crop-padding,
	.include {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		accent-color: var(--fg-primary);
	}

	.crop-padding {
		margin-top: 1.5em;
	}

	.crop-padding.irrelevant {
		opacity: 0.5;
		pointer-events: none;
	}

	.crop-padding .label {
		margin-bottom: 0.5em;
	}

	.crop-padding .numeric {
		display: flex;
		align-items: center;
		gap: 0.5em;
		overflow: hidden;
	}

	.crop-padding .numeric :global(input) {
		width: var(--width, 3ch);
	}

	.crop-padding .fineprint {
		font-size: 0.9em;
		color: var(--gy);
		margin-top: 0.75em;
	}

	.errors {
		margin-top: 1em;
		overflow-y: auto;
		height: 5lh;
	}

	.errors ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.errors li {
		display: flex;
		align-items: center;
		gap: 0.5em;
		color: var(--fg-secondary);
		min-width: 30ch;
	}
</style>

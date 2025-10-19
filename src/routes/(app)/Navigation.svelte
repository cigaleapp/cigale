<script>
	import { page } from '$app/state';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import DropdownMenu from '$lib/DropdownMenu.svelte';
	import { percent } from '$lib/i18n';
	import { previewingPrNumber, tables } from '$lib/idb.svelte';
	import { defineKeyboardShortcuts } from '$lib/keyboard.svelte';
	import Logo from '$lib/Logo.svelte';
	import { goto, href } from '$lib/paths.js';
	import ProgressBar from '$lib/ProgressBar.svelte';
	import { uiState } from '$lib/state.svelte';
	import { tooltip } from '$lib/tooltips';
	import { clamp } from '$lib/utils';
	import IconSelect from '~icons/ri/arrow-down-s-line';
	import IconNext from '~icons/ri/arrow-right-s-fill';
	import IconCheck from '~icons/ri/check-line';
	import DeploymentDetails from './DeploymentDetails.svelte';
	import DownloadResults from './DownloadResults.svelte';
	import ProtocolSwitcher from './ProtocolSwitcher.svelte';
	import Settings from './Settings.svelte';

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {number} [progress=0]
	 * @property {import('swarpc').SwarpcClient<typeof import('$worker/procedures.js').PROCEDURES>} swarpc
	 * @property {(() => void) | undefined} [openKeyboardShortcuts]
	 * @property {(() => void) | undefined} [openPrepareForOfflineUse]
	 * @property {boolean} [floating]
	 */

	/** @type {Props} */
	let {
		openKeyboardShortcuts,
		openPrepareForOfflineUse,
		progress = 0,
		swarpc,
		floating = false
	} = $props();

	const path = $derived(page.url.hash.replace(/^#/, ''));

	const hasImages = $derived(tables.Image.state.length > 0);

	/** @type {number|undefined} */
	let height = $state();

	/** @type {number|undefined} */
	let navHeight = $state();

	let openExportModal = $state();

	/** @type {undefined | (() => void)} */
	let openPreviewPRDetails = $state();

	let browserTabFocused = $state(true);
	let showingOKInTabTitle = $state(false);

	/* eslint-disable svelte/prefer-writable-derived */
	// The window object is not reactive
	let isNativeWindow = $state(false);
	$effect(() => {
		isNativeWindow = 'nativeWindow' in window;
	});
	/* eslint-enable svelte/prefer-writable-derived */

	$effect(() => {
		if (!navHeight) return;
		window.nativeWindow?.setControlsHeight(navHeight);
	});

	$effect(() => {
		window.nativeWindow?.setProgress(clamp(progress, 0, 1));

		if (progress >= 1) {
			window.nativeWindow?.startCallingAttention();
		}
	});

	$effect(() => {
		if (isNativeWindow) return;
		const actualTitle = document.title.replace(/^(⏳ \d+% ·|🆗) /, '');

		if (progress >= 1 || showingOKInTabTitle) {
			document.title = `🆗 ${actualTitle}`;
		} else if (progress === 0) {
			document.title = actualTitle;
		} else {
			document.title = `⏳ ${percent(progress)} · ${actualTitle}`;
		}
	});

	$effect(() => {
		document.addEventListener('processing-queue-drained', () => {
			if (!browserTabFocused) {
				showingOKInTabTitle = true;
			}
		});
		window.addEventListener('focus', () => {
			showingOKInTabTitle = false;
			browserTabFocused = true;
		});
		window.addEventListener('blur', () => {
			browserTabFocused = false;
		});
	});

	defineKeyboardShortcuts('navigation', {
		// Choose [P]rotocol
		'g p': {
			do: () => goto('/'),
			help: 'Choisir le protocole'
		},
		// [I]mport images
		'g i': {
			do: () => goto('/import'),
			help: 'Importer des images'
		},
		// Adjust C[r]ops
		'g r': {
			do: () => goto('/crop'),
			help: 'Recadrer les images'
		},
		// A[n]notate images
		'g n': {
			do: () => goto('/classify'),
			help: 'Classifier les images'
		},
		// E[x]port results
		'g x': {
			do: () => openExportModal(),
			help: 'Exporter les résultats'
		},
		// [M]anage protocols
		'g m': {
			do: () => goto('/protocols/'),
			help: 'Gérer les protocoles'
		}
	});
</script>

<DownloadResults {swarpc} bind:open={openExportModal} />

{#if previewingPrNumber}
	<DeploymentDetails bind:open={openPreviewPRDetails} />
{/if}

<header bind:clientHeight={height} class:native-window={isNativeWindow}>
	<div class="progressbar">
		<!-- When generating the ZIP, the bar is shown inside the modal. Showing it here also would be weird & distracting -->
		<ProgressBar progress={uiState.processing.task === 'export' ? 0 : progress} />
	</div>

	<nav
		bind:clientHeight={navHeight}
		data-testid="app-nav"
		data-sveltekit-preload-data="viewport"
		class:floating
	>
		<div class="logo">
			<a href={href('/')}>
				<Logo --stroke-width="75" --size="2rem" --fill="transparent" />
			</a>
			{#if previewingPrNumber}
				<button class="pr-number" onclick={openPreviewPRDetails}>
					Preview #{previewingPrNumber}
				</button>
			{/if}
		</div>

		<div class="steps">
			<a
				href={href('/import')}
				data-testid="goto-import"
				aria-disabled={!uiState.currentProtocol}
			>
				Importer
				{#if path == '/import'}
					<div class="line"></div>
				{/if}
			</a>
			<div class="separator"><IconNext /></div>
			<div class="with-inference-indicator">
				<a
					href={page.route.id !== '/(app)/(sidepanel)/crop/[image]' &&
					uiState.imageOpenedInCropper
						? href('/(app)/(sidepanel)/crop/[image]', {
								image: uiState.imageOpenedInCropper
							})
						: href('/crop')}
					data-testid="goto-crop"
					aria-disabled={!uiState.currentProtocol || !hasImages}
				>
					Recadrer
					{#if path.startsWith('/crop')}
						<div class="line"></div>
					{/if}
				</a>
				{@render inferenceSettings(
					'crop',
					uiState.cropModels,
					uiState.selectedCropModel,
					(i) => uiState.setModelSelections({ crop: i })
				)}
			</div>
			<div class="separator"><IconNext /></div>
			<div
				class="with-inference-indicator"
				use:tooltip={uiState.processing.task === 'detection' &&
				uiState.processing.progress < 1
					? "Veuillez attendre la fin de l'analyse des images avant de les classifier"
					: undefined}
			>
				<a
					href={href('/classify')}
					aria-disabled={!uiState.currentProtocol ||
						!hasImages ||
						(uiState.processing.task === 'detection' &&
							uiState.processing.progress < 1)}
					data-testid="goto-classify"
				>
					Classifier
					{#if path == '/classify'}
						<div class="line"></div>
					{/if}
				</a>
				{@render inferenceSettings(
					'classify',
					uiState.classificationModels,
					uiState.selectedClassificationModel,
					(i) => uiState.setModelSelections({ classification: i })
				)}
			</div>
			<div class="separator"><IconNext /></div>
			<ButtonSecondary testid="export-results-button" tight onclick={openExportModal}>
				Résultats
			</ButtonSecondary>
		</div>

		<aside class:native={isNativeWindow}>
			<ProtocolSwitcher />
			<div class="settings">
				<Settings
					{openPrepareForOfflineUse}
					{openKeyboardShortcuts}
					--navbar-height="{height}px"
				/>
			</div>
		</aside>
	</nav>
</header>

{#snippet inferenceSettings(
	/** @type {'crop'|'classify'} */ tab,
	/** @type {typeof import('$lib/schemas/metadata.js').MetadataInferOptionsNeural.infer['neural']} */ models,
	/** @type {number} */ currentModelIndex,
	/** @type {(i: number) => void }*/ setSelection
)}
	<div class="inference">
		{#if uiState.currentProtocol}
			<DropdownMenu
				testid="{tab}-models"
				help="Modèle d'inférence"
				items={[
					{
						i: -1,
						label: 'Aucune inférence',
						onclick: () => setSelection(-1)
					},
					...models.map((model, i) => ({
						i,
						label: model.name ?? '',
						onclick: () => setSelection(i)
					}))
				]}
			>
				{#snippet trigger(props)}
					<ButtonIcon help="" {...props}>
						<IconSelect />
					</ButtonIcon>
				{/snippet}
				{#snippet item({ label, i })}
					<div class="selected-model-indicator">
						{#if i === currentModelIndex}
							<IconCheck />
						{/if}
					</div>
					{label}
				{/snippet}
			</DropdownMenu>
		{/if}
	</div>
{/snippet}

<style>
	header {
		app-region: drag;
	}

	header :global(:is(a, button)) {
		app-region: no-drag;
	}

	nav {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 1rem 1.5rem;
		resize: vertical;
		position: relative;

		height: 75px;
	}

	header.native-window nav {
		height: 50px;
	}

	nav .with-inference-indicator {
		display: flex;
		align-items: center;
	}

	nav .inference {
		color: var(--fg-warning);
		display: flex;
		align-items: center;
		font-size: 0.9em;
	}

	.selected-model-indicator {
		width: 1.5em;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	nav a {
		background: none;
		border: none;
		text-decoration: none;
		color: var(--fg-neutral);
	}

	.steps {
		display: flex;
		align-items: center;
		width: 100%;
		margin: 0 2rem;
		max-width: 800px;
		margin-right: auto;
		gap: 2rem;
	}

	.steps .separator {
		display: flex;
		justify-content: center;
		align-items: center;
		color: var(--gray);
		display: none;
	}

	header.native-window .steps {
		justify-content: center;
		gap: 1rem;
	}

	nav a[aria-disabled='true'] {
		pointer-events: none;
		color: var(--gray);
	}

	nav a:hover[aria-disabled='true'] {
		background-color: var(--bg-primary);
		border-radius: var(--corner-radius);
		color: var(--fg-primary);
	}

	.logo {
		--size: 40px;
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	header.native-window .logo {
		--size: 25px;
	}

	.logo a:first-child {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	aside {
		display: flex;
		align-items: center;
		gap: 2rem;
	}

	.settings {
		--trigger-hover-bg: var(--bg-neutral);
		--trigger-fg: var(--fg-neutral);
		--trigger-hover-fg: var(--fg-primary);
	}

	header.native-window aside {
		margin-right: 130px;
	}

	.pr-number {
		font-size: 0.8em;
		color: var(--fg-primary);
		padding: 0.5em;
		border-radius: var(--corner-radius);
		border: 1px solid var(--fg-primary);
		margin-left: 1rem;
		background: none;
		cursor: pointer;
	}

	.pr-number:is(:hover, :focus-within) {
		background-color: var(--bg-primary);
	}

	.line {
		height: 3px;
		background-color: var(--bg-primary);
		width: auto;
		border-radius: 1000000px;
	}

	nav a[aria-disabled='true'] .line {
		visibility: hidden;
	}

	nav.floating {
		position: fixed;
		top: 0;
		left: 0;
		z-index: 10;

		aside {
			display: none;
		}
	}

	.progressbar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;

		--height: 0.5rem;
		--fill-color: var(--bg-primary);
	}
</style>

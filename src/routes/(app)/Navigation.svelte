<script>
	import { formatDistanceToNow } from 'date-fns';
	import { fade } from 'svelte/transition';

	import IconNext from '~icons/ri/arrow-right-s-fill';
	import IconDismiss from '~icons/ri/close-line';
	import IconNotificationsOn from '~icons/ri/notification-2-line';
	import { page } from '$app/state';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonInk from '$lib/ButtonInk.svelte';
	import { percent } from '$lib/i18n';
	import { previewingPrNumber, tables } from '$lib/idb.svelte';
	import { defineKeyboardShortcuts } from '$lib/keyboard.svelte';
	import Logo from '$lib/Logo.svelte';
	import { askForNotificationPermission, hasNotificationsEnabled } from '$lib/notifications';
	import { resolve } from '$lib/paths';
	import { goto } from '$lib/paths.js';
	import ProgressBar from '$lib/ProgressBar.svelte';
	import { switchSession } from '$lib/sessions';
	import { getSettings, setSetting } from '$lib/settings.svelte';
	import { uiState } from '$lib/state.svelte';
	import { tooltip } from '$lib/tooltips';
	import { clamp } from '$lib/utils';

	import DeploymentDetails from './DeploymentDetails.svelte';
	import ModalSubmitIssue from './ModalSubmitIssue.svelte';
	import Settings from './Settings.svelte';
	import TabSettings from './TabSettings.svelte';

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {number} [progress=0]
	 * @property {number} [eta=Infinity]
	 * @property {import('swarpc').SwarpcClient<typeof import('$worker/procedures.js').PROCEDURES>} swarpc
	 * @property {(() => void) | undefined} [openKeyboardShortcuts]
	 * @property {(() => void) | undefined} [openPrepareForOfflineUse]
	 * @property {boolean} [progressbarOnly] Only show the progress bar, hide the navbar and logo
	 */

	/** @type {Props} */
	let {
		openKeyboardShortcuts,
		openPrepareForOfflineUse,
		progress = 0,
		eta = Infinity,
		progressbarOnly = false
	} = $props();

	// @ts-expect-error
	const path = $derived(resolve(page.url.pathname));

	const hasImages = $derived(tables.Image.state.length > 0);

	/** @type {number|undefined} */
	let height = $state();

	/** @type {number|undefined} */
	let navHeight = $state();

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

	const showingEta = $derived(eta < Infinity && progress > 0 && progress < 1);

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
			do: () => goto('/results'),
			help: 'Exporter les résultats'
		},
		// [M]anage protocols
		'g m': {
			do: () => goto('/protocols'),
			help: 'Gérer les protocoles'
		}
	});
</script>

{#if previewingPrNumber}
	<DeploymentDetails bind:open={openPreviewPRDetails} />
{/if}

<header bind:clientHeight={height} class:native-window={isNativeWindow}>
	<div class="progressbar">
		<ProgressBar {progress} />
	</div>

	{#if !progressbarOnly}
		<nav bind:clientHeight={navHeight} data-testid="app-nav">
			<div class="logo">
				<button
					data-testid="goto-home"
					use:tooltip={showingEta
						? `Termine ${formatDistanceToNow(Date.now() + eta, { addSuffix: true, includeSeconds: true })}`
						: 'Accueil'}
					onclick={async () => {
						if (uiState.currentSession) {
							await goto('/(app)/sessions');
							await switchSession(null);
						} else {
							await goto('/');
						}
					}}
				>
					{#if showingEta}
						<div class="progress-overlay" transition:fade>
							{percent(progress)}
						</div>
					{/if}
					<Logo --stroke-width="75" --size="2rem" --fill="transparent" />
				</button>

				{#if previewingPrNumber}
					<button class="pr-number" onclick={openPreviewPRDetails}>
						Preview #{previewingPrNumber}
					</button>
				{/if}
			</div>

			{#if uiState.currentSession}
				<div class="steps" in:fade={{ duration: 100 }}>
					<a
						class="session-link"
						href={resolve('/(app)/sessions/[id]', { id: uiState.currentSession.id })}
						data-testid="goto-current-session"
						use:tooltip={'Session'}
					>
						{uiState.currentSession.name}
						{#if path === `/sessions/${uiState.currentSession.id}/`}
							<div class="line"></div>
						{/if}
					</a>
					<div class="with-inference-indicator">
						<a
							href={resolve('/import')}
							data-testid="goto-import"
							aria-disabled={!uiState.currentProtocol}
						>
							Importer
							{#if path == '/import/'}
								<div class="line"></div>
							{/if}
						</a>

						<TabSettings
							label="Réglages d'import"
							tab="import"
							models={[]}
							currentModelIndex={-1}
							setModel={async () => {}}
						/>
					</div>
					<div class="separator"><IconNext /></div>
					<div class="with-inference-indicator">
						<!-- eslint-disable svelte/no-navigation-without-resolve -->
						<a
							href={page.route.id !== '/(app)/(sidepanel)/crop/[image]' &&
							uiState.imageOpenedInCropper
								? resolve('/(app)/(sidepanel)/crop/[image]', {
										image: uiState.imageOpenedInCropper
									})
								: resolve('/crop')}
							data-testid="goto-crop"
							aria-disabled={!uiState.currentProtocol || !hasImages}
						>
							<!-- eslint-enable svelte/no-navigation-without-resolve -->
							Recadrer
							{#if path.startsWith('/crop')}
								<div class="line"></div>
							{/if}
						</a>

						<TabSettings
							label="Réglages de recadrage"
							tab="crop"
							models={uiState.cropModels}
							currentModelIndex={uiState.selectedCropModel}
							setModel={async (i) => uiState.setModelSelections({ crop: i })}
						/>
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
							href={resolve('/classify')}
							aria-disabled={!uiState.currentProtocol ||
								!hasImages ||
								(uiState.processing.task === 'detection' &&
									uiState.processing.progress < 1)}
							data-testid="goto-classify"
						>
							Classifier
							{#if path == '/classify/'}
								<div class="line"></div>
							{/if}
						</a>

						<TabSettings
							tab="classify"
							label="Réglages de classification"
							models={uiState.classificationModels}
							currentModelIndex={uiState.selectedClassificationModel}
							setModel={async (i) =>
								uiState.setModelSelections({ classification: i })}
						/>
					</div>
					<div class="separator"><IconNext /></div>
					<a href={resolve('/results')} data-testid="goto-results">
						Résultats
						{#if path == '/results/'}
							<div class="line"></div>
						{/if}
					</a>
				</div>
			{:else}
				<div class="steps" in:fade={{ duration: 100 }}>
					<a href={resolve('/sessions')} data-testid="goto-sessions">
						Sessions
						{#if path.startsWith('/sessions')}
							<div class="line"></div>
						{/if}
					</a>
					<a href={resolve('/protocols')} data-testid="goto-protocols">
						Protocoles
						{#if path.startsWith('/protocols')}
							<div class="line"></div>
						{/if}
					</a>
				</div>
			{/if}

			<aside class:native={isNativeWindow}>
				{#if getSettings().notifications === null}
					<div class="notifications">
						<ButtonInk
							help="Activer les notifications pour savoir quand un traitement est terminé."
							onclick={async () => {
								await askForNotificationPermission();
								setSetting('notifications', hasNotificationsEnabled());
							}}
						>
							<IconNotificationsOn />
							Activer
						</ButtonInk>
						<ButtonIcon
							onclick={() => setSetting('notifications', false)}
							help="Ne pas activer les notifications"
						>
							<IconDismiss />
						</ButtonIcon>
					</div>
				{/if}

				<ModalSubmitIssue type="bug" />
				<ModalSubmitIssue type="feature" />

				<div class="settings">
					<Settings
						{openPrepareForOfflineUse}
						{openKeyboardShortcuts}
						--navbar-height="{height}px"
					/>
				</div>
			</aside>
		</nav>
	{/if}
</header>

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

	nav a {
		background: none;
		border: none;
		text-decoration: none;
		color: var(--fg-neutral);
		white-space: nowrap;
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

	.notifications {
		display: flex;
		align-items: center;
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

	.session-link {
		color: var(--fg-primary);
		font-weight: bold;
	}

	.logo {
		--size: 40px;
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.logo {
		position: relative;

		.progress-overlay {
			position: absolute;
			inset: 0;
			display: flex;
			justify-content: center;
			align-items: center;
			pointer-events: none;
			z-index: 10;
			color: var(--fg-primary);
			font-weight: bold;
			font-size: 1.2em;
			background: rgb(from var(--bg-neutral) r g b / 0.6);
		}
	}

	header.native-window .logo {
		--size: 25px;
	}

	.logo button:first-child {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	aside {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	aside .notifications {
		margin-right: 1.5rem;
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

	.progressbar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;

		--height: 0.5rem;
		--fill-color: var(--bg-primary);
	}
</style>

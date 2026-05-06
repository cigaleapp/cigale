<script lang="ts" module>
	export const fullscreenState = $state({
		currentImage: undefined as undefined | string,
		progress: {
			treated: 0,
			confirmed: 0,
		},
	});
</script>

<script lang="ts">
	import { UAParser } from 'ua-parser-js';

	import IconConfirmed from '~icons/ri/check-double-line';
	import IconClose from '~icons/ri/close-line';
	import IconUnconfirmed from '~icons/ri/error-warning-line';
	import { invalidate } from '$app/navigation';
	import { page } from '$app/state';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import { dependencyURI, tables } from '$lib/idb.svelte';
	import { imageId } from '$lib/images';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import { defineKeyboardShortcuts } from '$lib/keyboard.svelte.js';
	import { goto } from '$lib/paths.js';
	import ProgressBar from '$lib/ProgressBar.svelte';
	import SegmentedGroup from '$lib/SegmentedGroup.svelte';
	import { uiState } from '$lib/state.svelte.js';
	import { tooltip } from '$lib/tooltips';

	const { children } = $props();

	const observation = $derived(tables.Observation.getFromState(page.params.observation ?? ''));
	const imageFile = $derived(
		tables.Image.getFromState(page.params.image ? imageId(page.params.image, 0) : '')
	);

	const currentImage = $derived(tables.Image.getFromState(fullscreenState.currentImage ?? ''));

	const focusedMetadata = $derived(
		tables.Metadata.getFromState(
			uiState.currentSession?.fullscreenClassifier.focusedMetadata ??
				uiState.classificationMetadataId ??
				''
		)
	);

	async function backToGalleryView() {
		switch (page.route.id) {
			case '/(app)/(sidepanel)/o/[observation]/classify':
			case '/(app)/(sidepanel)/o/[observation]/classify/suggestions':
			case '/(app)/(sidepanel)/o/[observation]/classify/narrow/eliminate':
			case '/(app)/(sidepanel)/o/[observation]/classify/narrow/candidates': {
				await goto('/(app)/(sidepanel)/classify');
				break;
			}
			case '/(app)/(sidepanel)/o/[observation]/crop/[image]': {
				await goto('/(app)/(sidepanel)/crop');
				break;
			}
		}
	}

	defineKeyboardShortcuts('general', {
		Escape: {
			help: 'Retour',
			do: backToGalleryView,
		},
	});

	const platformHasRightSideCloseButtons = $derived.by(() => {
		const platform = new UAParser(navigator.userAgent).getOS().name;
		return platform === 'Windows' || platform === 'Linux';
	});

	$inspect({fullscreenState});
</script>

<!-- Close button can be on the right (Windows, Linux) or on the left (macOS) -->
{#snippet closeButton()}
	<ButtonIcon onclick={backToGalleryView} help="Retour" keyboard="Escape">
		<IconClose />
	</ButtonIcon>
{/snippet}

<div class="with-header">
	<header>
		{#if !platformHasRightSideCloseButtons}
			{@render closeButton()}
		{/if}

		<h1>
			{#if observation}
				<InlineTextInput
					label="Nom de l'observation"
					value={observation.label}
					onblur={async (newLabel) => {
						if (newLabel === observation.label) return;
						await tables.Observation.update(observation.id, 'label', newLabel);
						await invalidate(dependencyURI('Observation', observation.id));
					}}
				/>

				{#if focusedMetadata && observation.metadataOverrides[focusedMetadata.id]?.confirmed}
					<div class="confirmed" use:tooltip={'Classification confirmée'}>
						<IconConfirmed />
					</div>
				{/if}
			{:else if imageFile}
				{imageFile.filename}
			{/if}
		</h1>

		<div class="progress">
			<ProgressBar
				progress={[fullscreenState.progress.treated, fullscreenState.progress.confirmed]}
				phases={page.route.id === '/(app)/(sidepanel)/o/[observation]/crop'
					? ['Images recadrées', 'Recadrages confirmés']
					: ['Observations classifiées', 'Classifications confirmées']}
			/>
		</div>

		<nav>
			<SegmentedGroup
				options={['crop', 'suggestions', 'eliminate']}
				disabled={(key) => {
					if (!observation && key !== 'crop')
						return 'Ouvrir une observation pour la classifier';
					if (!imageFile && !currentImage && key === 'crop')
						return 'Ouvrir une image pour le recadrage';
					return false;
				}}
				bind:current={
					() => {
						switch (page.route.id) {
							case '/(app)/(sidepanel)/o/[observation]/crop/[image]':
								return 'crop';
							case '/(app)/(sidepanel)/o/[observation]/classify/suggestions':
								return 'suggestions';
							case '/(app)/(sidepanel)/o/[observation]/classify/narrow/eliminate':
							case '/(app)/(sidepanel)/o/[observation]/classify/narrow/candidates':
								return 'eliminate';
							default:
								// Unreachable
								return 'crop';
						}
					},
					(value) => {
						const image = imageFile?.id ?? currentImage?.fileId;
						console.log('Switching view to', value, { image, observation });
						switch (value) {
							case 'crop':
								if (!image) return;
								goto('/(app)/(sidepanel)/o/[observation]/crop/[image]', {
									image,
									observation: observation?.id ?? '_',
								});
								break;
							case 'suggestions':
								if (!observation) return;
								goto('/(app)/(sidepanel)/o/[observation]/classify/suggestions', {
									observation: observation.id,
								});
								break;
							case 'eliminate':
								if (!observation) return;
								goto(
									'/(app)/(sidepanel)/o/[observation]/classify/narrow/eliminate',
									{
										observation: observation.id,
									}
								);
								break;
						}
					}
				}
			>
				{#snippet option_crop()}
					Recadrer
				{/snippet}
				{#snippet option_suggestions()}
					Suggestions
				{/snippet}
				{#snippet option_eliminate()}
					Élimination
				{/snippet}
			</SegmentedGroup>
		</nav>

		{#if platformHasRightSideCloseButtons}
			{@render closeButton()}
		{/if}
	</header>

	<div class="content">
		{@render children()}
	</div>
</div>

<style>
	.with-header {
		display: grid;
		height: 100dvh;
		grid-template-rows: max-content auto;

		> * {
			min-height: 0;
		}
	}

	header {
		display: flex;
		align-items: center;
		border-bottom: 1px solid var(--gray);
		padding: 0.5em 0.75em;
		gap: 1em;

		h1 {
			overflow: hidden;
			display: flex;
			align-items: center;
			gap: 0.5em;
			font-size: 1.5em;
		}

		nav {
			margin-left: auto;
		}

		.confirmed {
			display: inline-flex;
			font-size: 0.8em;
			color: var(--fg-success);
		}
	}

	.content {
		container-type: inline-size;
		container-name: below-header;
	}

	.progress {
		width: 200px;
		--height: 0.5em;
		--inactive-bg: rgb( from var(--gray) r g b / 50%);
		overflow: hidden;
		border-radius: var(--corner-radius);
	}
</style>

<script lang="ts" module>
	export const fullscreenState = $state({
		currentImage: undefined as undefined | string,
	});

	export const topbarExtrasPortalId = 'topbar-extras-portal';
</script>

<script lang="ts">
	import { fade } from 'svelte/transition';

	import IconClose from '~icons/ri/close-line';
	import { invalidate } from '$app/navigation';
	import { page } from '$app/state';
	import Badge from '$lib/Badge.svelte';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import { plural } from '$lib/i18n.js';
	import { dependencyURI, tables } from '$lib/idb.svelte';
	import { imageId, imageIdToFileId } from '$lib/images';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import { defineKeyboardShortcuts } from '$lib/keyboard.svelte.js';
	import { goto } from '$lib/paths.js';
	import SegmentedGroup from '$lib/SegmentedGroup.svelte';
	import { uiState } from '$lib/state.svelte.js';
	import ModalSubmitIssue from '$routes/(app)/ModalSubmitIssue.svelte';

	const { children } = $props();

	const observation = $derived(tables.Observation.getFromState(page.params.observation ?? ''));
	const imageFile = $derived(
		tables.Image.getFromState(page.params.image ? imageId(page.params.image, 0) : '')
	);

	const observationsOfImageFile = $derived(
		tables.Observation.state.filter((obs) =>
			obs.images.some((imageId) => imageIdToFileId(imageId) === page.params.image)
		)
	);

	const observationToClassify = $derived(
		observation ??
			(observationsOfImageFile.length === 1 ? observationsOfImageFile[0] : undefined)
	);

	const currentImage = $derived(tables.Image.getFromState(fullscreenState.currentImage ?? ''));

	const imageToCrop = $derived(
		imageFile?.id ??
			currentImage?.fileId ??
			(observation && observation.images.length === 1
				? imageIdToFileId(observation.images[0])
				: undefined)
	);

	async function backToGalleryView() {
		switch (page.route.id) {
			case '/(app)/(sidepanel)/o/[observation]/classify':
			case '/(app)/(sidepanel)/o/[observation]/classify/suggestions':
			case '/(app)/(sidepanel)/o/[observation]/classify/narrow/(options)/describe':
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

	const tab = $derived.by(() => {
		switch (page.route.id) {
			case '/(app)/(sidepanel)/o/[observation]/crop/[image]':
				return 'crop';
			case '/(app)/(sidepanel)/o/[observation]/classify/suggestions':
				return 'suggestions';
			case '/(app)/(sidepanel)/o/[observation]/classify/narrow/(options)/describe':
			case '/(app)/(sidepanel)/o/[observation]/classify/narrow/(options)/choices':
			case '/(app)/(sidepanel)/o/[observation]/classify/narrow/candidates':
			case '/(app)/(sidepanel)/o/[observation]/classify/narrow':
				return 'narrow';
			default:
				// Unreachable
				return 'crop';
		}
	});

	async function goToTab(target: typeof tab) {
		switch (target) {
			case 'crop':
				if (!imageToCrop) return;
				goto('/(app)/(sidepanel)/o/[observation]/crop/[image]', {
					image: imageToCrop,
					observation: observation?.id ?? '_',
				});
				break;
			case 'suggestions':
				if (!observationToClassify) return;
				goto('/(app)/(sidepanel)/o/[observation]/classify/suggestions', {
					observation: observationToClassify.id,
				});
				break;
			case 'narrow':
				if (!observationToClassify) return;
				goto('/(app)/(sidepanel)/o/[observation]/classify/narrow/(options)/describe', {
					observation: observationToClassify.id,
				});
				break;
		}
	}

	defineKeyboardShortcuts('general', {
		Escape: {
			help: 'Retour',
			do: backToGalleryView,
		},
		B: {
			help: "Recadrer l'image",
			async do() {
				await goToTab('crop');
			},
		},
		S: {
			help: 'Voir les suggestions de classification',
			async do() {
				await goToTab('suggestions');
			},
		},
		N: {
			help: 'Classifier par élimination',
			async do() {
				await goToTab('narrow');
			},
		},
	});
</script>

<div class="with-header">
	<header data-testid="fullscreen-header">
		<ButtonIcon onclick={backToGalleryView} help="Retour" keyboard="Escape">
			<IconClose />
		</ButtonIcon>

		<h1>
			{#if observation}
				<InlineTextInput
					help="Modifier le nom de l'observation"
					label="Nom de l'observation"
					value={observation.label}
					onblur={async (newLabel) => {
						if (newLabel === observation.label) return;
						await tables.Observation.update(observation.id, 'label', newLabel);
						await invalidate(dependencyURI('Observation', observation.id));
					}}
				/>
			{:else if imageFile}
				{imageFile.filename}
			{/if}
		</h1>

		<div class="extras" id={topbarExtrasPortalId}></div>

		<div class="reports">
			<ModalSubmitIssue type="feature" />
			<ModalSubmitIssue type="bug" />
		</div>

		<nav>
			<SegmentedGroup
				options={['crop', 'suggestions', 'narrow']}
				disabled={(key) => {
					if (!observationToClassify && key !== 'crop')
						return observationsOfImageFile.length === 0
							? "Cette image n'apparaît dans aucune observation"
							: `Cette image apparaît dans ${plural(observationsOfImageFile.length, ['# observation', '# observations'])}`;
					if (!imageToCrop && key === 'crop') return 'Ouvrir une image pour le recadrage';

					if (key === 'narrow') {
						const narrowableGroups =
							uiState.currentProtocol?.metadataGroups.filter(
								(group) => group.narrowable
							) ?? [];
						if (narrowableGroups.length === 0)
							return 'Non disponible pour ce protocole';
					}

					return false;
				}}
				bind:current={
					() => tab,
					(value) => {
						goToTab(value);
					}
				}
			>
				{#snippet option_crop()}
					Recadrer
				{/snippet}
				{#snippet option_suggestions()}
					Suggestions
				{/snippet}
				{#snippet option_narrow()}
					Élimination
					<Badge>Beta</Badge>
				{/snippet}
			</SegmentedGroup>
		</nav>
	</header>

	{#key tab}
		<div class="content" in:fade={{ duration: 200 }}>
			{@render children()}
		</div>
	{/key}
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
			font-size: 1.2em;
			min-width: 5ch;
		}

		.reports {
			margin-left: auto;
		}
	}

	.content {
		container-type: inline-size;
		container-name: below-header;
	}

	.extras {
		display: flex;
		align-items: center;
		gap: 1em;
	}
</style>

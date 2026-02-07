<script lang="ts">
	import IconPrev from '~icons/ri/arrow-left-s-line';
	import IconNext from '~icons/ri/arrow-right-s-line';
	import IconConfirmedClassification from '~icons/ri/check-double-line';
	import IconClassified from '~icons/ri/check-line';
	import { goto, invalidate, preloadData } from '$app/navigation';
	import { resolve } from '$app/paths';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import ConfirmedOverlay from '$lib/ConfirmedOverlay.svelte';
	import type { Metadata, Observation } from '$lib/database';
	import { percent } from '$lib/i18n';
	import { databaseHandle, dependencyURI } from '$lib/idb.svelte';
	import { defineKeyboardShortcuts } from '$lib/keyboard.svelte.js';
	import { storeMetadataValue } from '$lib/metadata/index.js';
	import ProgressBar from '$lib/ProgressBar.svelte';
	import { uiState } from '$lib/state.svelte';
	import { toasts } from '$lib/toasts.svelte';

	interface Props {
		currentObservation: Observation;
		currentObservationIndex: number;
		totalObservations: number;
		nextObservation: { id: string } | undefined | null;
		prevObservation: { id: string } | undefined | null;
		classifiedObservationsCount: number;
		confirmedClassificationsCount: number;
		nextUnconfirmedObservation?: { id: string } | undefined | null;
		focusedMetadata: Metadata | undefined;
	}

	const {
		currentObservation,
		currentObservationIndex,
		totalObservations,
		nextObservation,
		prevObservation,
		classifiedObservationsCount,
		confirmedClassificationsCount,
		nextUnconfirmedObservation,
		focusedMetadata
	}: Props = $props();

	let showOverlay = $state(async () => {});

	function observationRoute(observation: { id: string }) {
		return resolve('/(app)/(sidepanel)/classify/[observation]', {
			observation: observation.id
		});
	}

	const currently = $derived(currentObservation.metadataOverrides[focusedMetadata?.id ?? '']);

	const allConfirmed = $derived(totalObservations === confirmedClassificationsCount);

	async function setConfirmation(confirmed: boolean) {
		if (!focusedMetadata) return;
		if (!uiState.currentSessionId) return;

		if (!currently) {
			toasts.warn('Aucune classification à confirmer pour cette image.');
		} else {
			await storeMetadataValue({
				db: databaseHandle(),
				metadataId: focusedMetadata.id,
				sessionId: uiState.currentSessionId,
				subjectId: currentObservation.id,
				...currently,
				confirmed
			});

			if (!currently.confirmed && confirmed) await showOverlay();
		}

		await invalidate(dependencyURI('Observation', currentObservation.id));
	}

	async function confirmAndContinue() {
		await setConfirmation(true);
		if (nextUnconfirmedObservation) {
			await goto(observationRoute(nextUnconfirmedObservation));
		} else if (allConfirmed) {
			await goto(resolve('/results'));
		}
	}

	defineKeyboardShortcuts('classification', {
		'$mod+ArrowRight': {
			help: 'Observation suivante',
			do: async () => nextObservation && goto(observationRoute(nextObservation))
		},
		Space: {
			help: 'Marquer la classification comme confirmée et passer à la prochaine observation non confirmée',
			do: async () => confirmAndContinue()
		},
		'$mod+ArrowLeft': {
			help: 'Observation précédente',
			do: async () => prevObservation && goto(observationRoute(prevObservation))
		},
		'Shift+Space': {
			help: 'Observation précédente',
			do: async () => prevObservation && goto(observationRoute(prevObservation))
		}
	});
</script>

<ConfirmedOverlay bind:show={showOverlay} />

<section class="progress">
	{#snippet percentage(value: number)}
		<code>
			{percent(value / totalObservations)}
		</code>
	{/snippet}

	<div class="bar">
		<p>
			<IconClassified />
			Observations classifiées
			{@render percentage(classifiedObservationsCount)}
		</p>
		<ProgressBar alwaysActive progress={classifiedObservationsCount / totalObservations} />
	</div>
	<div class="bar">
		<p>
			<IconConfirmedClassification />
			Classifications confirmées
			{@render percentage(confirmedClassificationsCount)}
		</p>
		<ProgressBar alwaysActive progress={confirmedClassificationsCount / totalObservations} />
	</div>
</section>

<nav>
	<div class="image-switcher">
		<ButtonIcon
			help="Observation précédente"
			keyboard="$mod+ArrowLeft"
			disabled={!prevObservation}
			preload={() => {
				if (!prevObservation) return;
				void preloadData(observationRoute(prevObservation));
			}}
			onclick={async () => {
				if (!prevObservation) return;
				await goto(observationRoute(prevObservation));
			}}
		>
			<IconPrev />
		</ButtonIcon>
		<code class="numbers">
			{currentObservationIndex + 1}
			<div class="separator">⁄</div>
			{totalObservations}
		</code>
		<ButtonIcon
			help="Observation suivante"
			keyboard="$mod+ArrowRight"
			disabled={!nextObservation}
			preload={() => {
				if (!nextObservation) return;
				void preloadData(observationRoute(nextObservation));
			}}
			onclick={async () => {
				if (!nextObservation) return;
				await goto(observationRoute(nextObservation));
			}}
		>
			<IconNext />
		</ButtonIcon>
	</div>
	<div class="continue">
		<ButtonSecondary
			keyboard="Space"
			help="Marquer la classification comme confirmée et passer à la prochaine classification non confirmée"
			disabled={!currently}
			onclick={async () => {
				await confirmAndContinue();
			}}
		>
			Continuer
		</ButtonSecondary>
	</div>
</nav>

<style>
	nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.image-switcher {
		display: flex;
		align-items: center;
		gap: 0.5em;

		.numbers {
			display: flex;
			align-items: center;
			gap: 0.2em;
			font-family: var(--font-mono);
		}
	}

	.progress {
		display: flex;
		flex-direction: column;
		--inactive-bg: var(--gray);
		gap: 1.25em;
		margin-bottom: 2em;
	}

	.progress .bar p {
		margin-bottom: 0.25em;
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.progress .bar p code {
		color: var(--gay);
		font-size: 0.9em;
		margin-left: auto;
	}
</style>

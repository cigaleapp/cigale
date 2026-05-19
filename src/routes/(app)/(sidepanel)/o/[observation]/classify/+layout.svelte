<script lang="ts">
	import type * as DB from '$lib/database.js';

	import { page } from '$app/state';
	import { databaseHandle, tables } from '$lib/idb.svelte.js';
	import { storeMetadataValue } from '$lib/metadata/storage.js';
	import { observationMetadata } from '$lib/observations.js';
	import { goto } from '$lib/paths.js';
	import { uiState } from '$lib/state.svelte.js';
	import { toasts } from '$lib/toasts.svelte.js';
	import { compareBy } from '$lib/utils.js';

	import TopbarExtras from '../TopbarExtras.svelte';

	const { children, data } = $props();

	const focusedMetadata = $derived(
		tables.Metadata.getFromState(
			uiState.currentSession?.fullscreenClassifier.focusedMetadata ?? ''
		)!
	);

	const allObservations = $derived(
		tables.Observation.state.toSorted(compareBy((o) => data.sortedObservationIds.indexOf(o.id)))
	);
	const observation = $derived(tables.Observation.getFromState(page.params.observation!)!);

	function classification(observation: DB.Observation) {
		if (!focusedMetadata) return;
		const values = observationMetadata({
			definitions: [focusedMetadata],
			observation,
			images: tables.Image.state.filter((image) => observation.images.includes(image.id)),
		});

		return values[focusedMetadata.id];
	}

	let flashConfirmedOverlay: undefined | (() => Promise<void>) = $state();
</script>

<TopbarExtras
	bind:flashConfirmedOverlay
	currentIsConfirmed={Boolean(classification(observation)?.confirmed)}
	keyboardShortcutsCategory="classification"
	labels={{
		item: 'Observation',
		treated: 'Observations classifiées',
		confirmed: 'Classifications confirmées',
	}}
	progress={{
		total: allObservations.length,
		treated: allObservations.filter((obs) => classification(obs) !== undefined).length,
		confirmed: allObservations.filter((obs) => classification(obs)?.confirmed).length,
		async mark(status) {
			const value = classification(observation);
			if (!value) return;
			await storeMetadataValue({
				db: databaseHandle(),
				metadataId: focusedMetadata.id,
				subjectId: observation.id,
				sessionId: uiState.currentSessionId,
				type: 'enum',
				value: value.value,
				manuallyModified: true,
				confirmed: status === 'confirmed',
				alternatives: value.alternatives,
				confidence: value.confidence,
			});
		},
	}}
	navigation={{
		current: allObservations.findIndex((obs) => obs.id === observation.id) + 1,
		total: allObservations.length,
		async previous() {
			await goto(page.route.id, { observation: allObservations[this.current - 2]?.id });
		},
		async next() {
			await goto(page.route.id, { observation: allObservations[this.current]?.id });
		},
		async nextUnconfirmed() {
			const observation = allObservations
				.slice(this.current)
				.find((obs) => !classification(obs)?.confirmed);

			if (observation) {
				await goto(page.route.id, {
					observation: observation.id,
				});
			} else {
				await goto('/results/').then(() => {
					toasts.success(
						"Bien joué! Toutes les observations ont été recadrés, classifiées et confirmées… place à l'export des résultats 🥳"
					);
				});
			}
		},
	}}
/>

{@render children()}

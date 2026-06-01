/* eslint-disable svelte/prefer-svelte-reactivity */

import type { Descriptors } from './candidates.js';
import type * as DB from '$lib/database.js';
import type { TypedMetadataValue } from '$lib/metadata/index.js';
import type { NamespacedMetadataID } from '$lib/schemas/common.js';

import { page } from '$app/state';
import { tables } from '$lib/idb.svelte.js';
import { observationMetadata } from '$lib/observations.js';
import { uiState } from '$lib/state.svelte.js';
import { entries, safeJSONParse, transformObject } from '$lib/utils.js';
import { resolveMetadataImport } from '$lib/metadata/imports.js';

import { computeDescriptors, getAllCandidates, matches } from './candidates.js';

export class NarrowingState {
	constructor() {}

	observationId = $derived(page.params.observation ?? '');
	observation = $derived(tables.Observation.getFromState(this.observationId));

	openCandidateDetails = $state<undefined | ((candidate: DB.MetadataEnumVariant) => void)>();

	search = $state({
		describe: { query: '', resultsCount: 0 },
		choices: { query: '', resultsCount: 0 },
		candidates: { query: '', resultsCount: 0 },
	});

	scroll = $state({
		describe: { y: 0 },
		choices: { y: 0 },
		candidates: { y: 0 },
	});

	resetScrollAndSearch() {
		this.scroll = {
			describe: { y: 0 },
			choices: { y: 0 },
			candidates: { y: 0 },
		};
		this.search = {
			describe: { query: '', resultsCount: 0 },
			choices: { query: '', resultsCount: 0 },
			candidates: { query: '', resultsCount: 0 },
		};
	}

	focusedMetadataId = $derived(
		uiState.currentSession?.fullscreenClassifier.focusedMetadata ??
			uiState.classificationMetadataId
	);

	narrowableGroup = $derived(uiState.currentSession?.fullscreenClassifier.narrowableGroup);
	definitions = $derived(
		uiState.currentProtocol
			? uiState.currentProtocol.metadata
					.map((id) => resolveMetadataImport(uiState.currentProtocol!, id))
					.map((id) => tables.Metadata.getFromState(id))
					.filter((m) => m.group === this.narrowableGroup)
			: []
	);

	choicesHistory = $state<NamespacedMetadataID[]>([]);
	descriptors: Descriptors = $state(new Map());

	metadataValues = $derived(
		transformObject(
			this.observation
				? observationMetadata({
						observation: this.observation,
						definitions: this.definitions,
						images: tables.Image.state,
					})
				: {},
			(id, value) => {
				const def = this.definitions.find((d) => d.id === id);
				if (!def) return undefined;
				if (def.type !== 'enum') return undefined;

				return [id, value as TypedMetadataValue<'enum'>];
			}
		)
	);

	choices = $derived(
		new Map(
			entries(this.metadataValues ?? {}).map(([id, { value, alternatives }]) => [
				id,
				new Set<string>([
					value.toString(),
					...Object.entries(alternatives ?? {})
						.filter(([, confidence]) => confidence >= 1)
						.map(([key]) => safeJSONParse(key).toString()),
				]),
			])
		)
	);

	allCandidates = $state<DB.MetadataEnumVariant[]>([]);
	allCandidateIds = $derived(new Set(this.allCandidates.map((c) => c.key)));

	remainingCandidateIds = $derived(
		matches({
			descriptors: this.descriptors,
			within: this.allCandidateIds,
			choices: this.choices,
		})
	);
	remainingCandidates = $derived(
		this.allCandidates.filter((c) => this.remainingCandidateIds.has(c.key))
	);

	candidatesRatio = $derived(
		1 - this.remainingCandidates.length / (this.allCandidates.length - 1 || 1)
	);

	candidateIsEliminated({ key }: { key: string }): boolean {
		return !this.remainingCandidateIds.has(key);
	}

	async loadAllCandidates(
		sig: AbortSignal,
		options: typeof import('./OptionsLoader.svelte').options
	) {
		if (!this.narrowableGroup) return;
		if (!this.focusedMetadataId) return;

		this.allCandidates = await getAllCandidates({
			narrowableGroup: this.narrowableGroup,
			focusedMetadataId: this.focusedMetadataId,
		});

		this.descriptors = computeDescriptors({
			allCandidates: this.allCandidates,
			options,
			signal: sig,
		});
	}

	loaded = $derived(
		this.allCandidates.length > 0 && this.definitions.length > 0 && this.descriptors.size > 0
	);
}

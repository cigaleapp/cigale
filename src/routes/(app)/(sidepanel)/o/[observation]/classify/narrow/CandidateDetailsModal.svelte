<script module lang="ts">
</script>

<script lang="ts">
	import type * as DB from '$lib/database.js';

	import { page } from '$app/state';
	import ButtonPrimary from '$lib/ButtonPrimary.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import Carousel from '$lib/Carousel.svelte';
	import { cascadeLabels } from '$lib/cascades.js';
	import LearnMoreLink from '$lib/LearnMoreLink.svelte';
	import Markdown from '$lib/Markdown.svelte';
	import { storeMetadataValue } from '$lib/metadata/storage.js';
	import MetadataCascadesTable from '$lib/MetadataCascadesTable.svelte';
	import Modal from '$lib/Modal.svelte';
	import { uiState } from '$lib/state.svelte.js';
	import { splitRecord } from '$lib/utils.js';

	import { narrowingState } from './+layout.svelte';

	interface Props {
		/** Bind to this to open the modal */
		// eslint-disable-next-line no-unused-vars
		open: undefined | ((candidate: DB.MetadataEnumVariant) => void);
	}

	let { open = $bindable() }: Props = $props();

	const db = $derived(page.data.db);

	let opener = $state<() => void>();
	let candidate = $state<DB.MetadataEnumVariant>();
	const choices = $derived(narrowingState.choices);

	$effect(() => {
		open = (candidateToOpen) => {
			if (!opener) return;
			if (!candidateToOpen) return;
			candidate = candidateToOpen;
			opener();
		};
	});

	async function pick() {
		if (!candidate) return;
		if (!page.params.observation) return;
		if (!narrowingState.focusedMetadataId) return;

		await storeMetadataValue({
			db,
			subjectId: page.params.observation,
			sessionId: uiState.currentSessionId,
			metadataId: narrowingState.focusedMetadataId,
			type: 'enum',
			value: candidate.key,
		});
	}
</script>

<Modal title={candidate?.label ?? 'Candidat'} key="modal_candidate_details" bind:open={opener}>
	{#if candidate}
		<div class="content">
			<section class="images">
				<Carousel items={candidate.images ?? []} slideName={(_, i) => `Image ${i + 1}`}>
					{#snippet item(src)}
						<img {src} />
					{/snippet}
				</Carousel>
			</section>
			{#await cascadeLabels( { db, protocolId: uiState.currentProtocolId, option: candidate } ) then cascades}
				{@const [chosen, others] = splitRecord(cascades, (metadataId) =>
					choices.has(metadataId)
				)}
				<section
					class={narrowingState.candidateIsEliminated(candidate)
						? 'eliminated-why'
						: 'cascade-chosen'}
				>
					<h2>
						{#if narrowingState.candidateIsEliminated(candidate)}
							Candidat éliminé
						{:else}
							Choix effectués
						{/if}
					</h2>

					<MetadataCascadesTable
						cascades={chosen}
						crossout={(metadataId, key) =>
							choices.get(metadataId) && !choices.get(metadataId)!.has(key)}
					/>
				</section>
				<section class="cascade-others">
					<h2>Autres descripteurs</h2>

					<MetadataCascadesTable cascades={others} />
				</section>
			{/await}
			<section class="description">
				<Markdown source={candidate.description ?? ''} />
				{#if candidate.learnMore}
					<LearnMoreLink href={candidate.learnMore} />
				{/if}
			</section>
		</div>
	{/if}

	{#snippet footer({ close })}
		<ButtonSecondary onclick={close}>Fermer</ButtonSecondary>
		<ButtonPrimary
			loading
			onclick={async () => {
				await pick();
				close?.();
			}}
		>
			Choisir ce candidat
		</ButtonPrimary>
	{/snippet}
</Modal>

<style>
	.content {
		/* display :flex;
		flex-direction: column; */
		display: grid;
		gap: 2em;
		grid-template-columns: 1fr 1fr;
		grid-template-areas:
			'eliminated-why eliminated-why'
			'images description'
			'cascade-chosen cascade-chosen'
			'cascade-others cascade-others';

		.images {
			grid-area: images;
		}

		.description {
			grid-area: description;
		}

		.cascade-chosen {
			grid-area: cascade-chosen;
		}

		.cascade-others {
			grid-area: cascade-others;
		}

		.eliminated-why {
			grid-area: eliminated-why;
		}
	}

	.images {
		height: 300px;
	}

	h2 {
		margin-bottom: 0.5em;
		font-size: 1em;
		font-weight: normal;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--gay);
	}
</style>

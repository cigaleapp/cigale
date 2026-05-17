<script lang="ts">
	import type * as DB from '$lib/database.js';

	import IconChoose from '~icons/ri/check-line';
	import IconNoImage from '~icons/ri/question-line';
	import { page } from '$app/state';
	import Badge from '$lib/Badge.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import { databaseHandle } from '$lib/idb.svelte.js';
	import LearnMoreLink from '$lib/LearnMoreLink.svelte';
	import Lightbox from '$lib/Lightbox.svelte';
	import Markdown from '$lib/Markdown.svelte';
	import { storeMetadataValue } from '$lib/metadata/storage.js';
	import { scrollfader } from '$lib/scrollfader.js';
	import { uiState } from '$lib/state.svelte.js';

	import { narrowingState } from './+layout.svelte';

	interface Props {
		candidate: DB.MetadataEnumVariant;
	}

	let { candidate }: Props = $props();
</script>

<button
	class="candidate"
	onclick={() => {
		narrowingState.openCandidateDetails?.(candidate);
	}}
>
	<div class="image" class:empty={!candidate.images?.[0]}>
		{#if candidate.images?.at(0)}
			<img src={candidate.images?.at(0)} alt="Image de {candidate.label}" class="specimen" />
		{:else}
			<p>
				<IconNoImage />
			</p>
		{/if}
	</div>
	<div class="info">
		<div class="label">
			<span>{candidate.label}</span>
			{#if narrowingState.candidateIsEliminated(candidate)}
				<Badge>Éliminé</Badge>
			{/if}
		</div>
		<div class="description" {@attach scrollfader}>
			<Markdown source={candidate.description ?? ''} />
		</div>
		<div class="actions">
			<div class="learn-more">
				{#if candidate.learnMore}
					<LearnMoreLink href={candidate.learnMore} />
				{/if}
			</div>
		</div>
	</div>
</button>

<style>
	.candidate {
		display: flex;
		gap: 2em;
		padding: 2em;
		border-bottom: 1px solid var(--gray);
		font-size: 1rem;
		width: 100%;
		text-align: left;

		&:hover,
		&:focus-visible {
			background-color: var(--bg-primary-translucent);
		}
	}

	.image {
		width: 10rem;
		height: 10rem;
		flex-shrink: 0;
	}

	.image.empty {
		border-radius: var(--corner-radius);
		border: 2px dashed var(--gray);
		color: var(--gray);
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
		font-size: 2em;
	}

	img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	img.specimen {
		border-radius: var(--corner-radius);
	}

	.label {
		font-weight: bold;
		font-size: 1.3em;
		display: flex;
		align-items: center;
		justify-content: space-between;
		--badge-color: var(--fg-error);
	}

	.description {
		min-height: 3lh;
		max-height: 15lh;
		overflow: hidden;
	}

	.info {
		display: flex;
		flex-direction: column;
		gap: 1em;
		width: 100%;
		max-width: 67ch;
	}

	.actions {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 2em;
		justify-content: space-between;
	}
</style>

<script lang="ts">
	import type * as DB from '$lib/database.js';

	import IconDescription from '~icons/ri/align-left';
	import IconCollapse from '~icons/ri/arrow-down-s-line';
	import IconExpand from '~icons/ri/arrow-up-s-line';
	import IconDebug from '~icons/ri/bug-2-line';
	import IconImage from '~icons/ri/image-line';
	import { cascadeLabels } from '$lib/cascades.js';
	import DebugOnly from '$lib/DebugOnly.svelte';
	import { databaseHandle } from '$lib/idb.svelte.js';
	import LearnMoreLink from '$lib/LearnMoreLink.svelte';
	import Markdown from '$lib/Markdown.svelte';
	import MetadataCascadesTable from '$lib/MetadataCascadesTable.svelte';
	import { scrollfader } from '$lib/scrollfader.js';
	import { isDebugMode } from '$lib/settings.svelte.js';
	import TabbedView from '$lib/TabbedView.svelte';
	import { uiState } from '$lib/uistate.svelte.js';
	import { compareBy, corsfixIfLocalhost } from '$lib/utils.js';

	interface Props {
		option: DB.MetadataEnumVariant;
		expanded?: boolean;
		debugdata?: unknown;
	}

	let { option, expanded = $bindable(false), debugdata }: Props = $props();
	const { images = [], label, description, learnMore, key } = $derived(option);
</script>

<div class="carousel">
	<TabbedView
		swipeable
		aria-label="Description et images de l'option sélectionnée"
		initially={images.length ? 'image_0' : 'details'}
		tabs={[
			{ key: 'debug', name: 'Debug', scrollable: true, hidden: !isDebugMode() || !debugdata },
			{ key: 'details', name: 'Détails', scrollable: true, rerender: key },
			...images.map((_, i) => ({
				key: `image_${i}` as const,
				name: `Image ${i + 1}`,
				rerender: key,
			})),
		]}
	>
		{#snippet tab(attrs, key, { shown })}
			<button
				class="tab-icon"
				{...attrs}
				onclick={() => {
					if (key === 'details' && shown) {
						expanded = !expanded;
						return;
					}

					attrs.onclick?.();
				}}
			>
				{#if key === 'debug'}
					<IconDebug />
				{:else if key === 'details'}
					<IconDescription />

					<div class="subicon">
						{#if expanded}
							<IconCollapse />
						{:else}
							<IconExpand />
						{/if}
					</div>
				{:else}
					<IconImage />
				{/if}
			</button>
		{/snippet}

		{#snippet content(key)}
			{#if key === 'debug' && debugdata}
				<DebugOnly data={debugdata} />
			{:else if key === 'details'}
				<div class="details" {@attach scrollfader}>
					{#if description}
						<Markdown source={description} />
					{:else}
						<p class="empty">
							<em>Aucune description pour {label}.</em>
						</p>
					{/if}
					{#if learnMore}
						<LearnMoreLink href={learnMore} />
					{/if}
					{#await cascadeLabels( { protocolId: uiState.currentProtocolId, db: databaseHandle(), option } ) then cascades}
						<MetadataCascadesTable explain compact {cascades} />
					{/await}
				</div>
			{:else}
				{const i = Number.parseInt(key.replace(/^image_/, ''))}
				{const image = images[i]}
				{#if image}
					<img src={corsfixIfLocalhost(image)} />
				{/if}
			{/if}
		{/snippet}
	</TabbedView>
</div>

<style>
	.carousel {
		flex-grow: 1;
		display: flex;
		overflow: hidden;
		flex-direction: column;
		background: var(--bg-neutral);
		z-index: 10;
		height: 100%;

		transition: max-height 200ms;
	}

	.details {
		padding: 1em;
		display: flex;
		flex-direction: column;
		gap: 1.75em;
	}

	.empty {
		color: var(--gay);
	}

	.image {
		max-height: 25lvh;
	}

	img {
		object-fit: contain;
		width: 100%;
		height: 100%;
		background: black;
	}

	.tab-icon {
		font-size: 1.2em;
		color: currentColor;

		&,
		.subicon {
			display: flex;
			justify-content: center;
			align-items: center;
		}

		.subicon {
			font-size: 1rem;
		}
	}
</style>

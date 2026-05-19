<script lang="ts">
	import type { cascadeLabels } from './cascades.js';

	import Icon from '@iconify/svelte';

	import { tables } from './idb.svelte.js';
	import OverflowableText from './OverflowableText.svelte';
	import { uiState } from './state.svelte.js';
	import { compareBy, readableOn } from './utils.js';

	interface Props {
		cascades: Awaited<ReturnType<typeof cascadeLabels>>;
		/** Cross out the value part of a row */
		// eslint-disable-next-line no-unused-vars
		crossout?: (metadataId: string, optionKey: string) => boolean;
		/** Metadata IDs in the order they should be displayed. By default, the protocol's metadata order is used  */
		ordering?: string[];
		/** Don't show images */
		compact?: boolean;
	}

	const {
		cascades: labels,
		ordering = uiState.currentProtocol?.metadataOrder ?? [],
		compact = false,
		crossout = () => false,
	}: Props = $props();

	const entries = $derived(
		Object.entries(labels).toSorted(
			compareBy(([metadataId]) =>
				ordering.includes(metadataId) ? ordering.indexOf(metadataId) : Infinity
			)
		)
	);

	const showImages = $derived(
		!compact &&
			tables.Metadata.state.some(
				(metadata) => metadata.id in labels && metadata.images && metadata.images.length > 0
			)
	);

	const longestMetadataLabelLength = $derived(
		Math.max(
			...entries.map(([metadataId]) => {
				const metadata = tables.Metadata.getFromState(metadataId);
				return (metadata?.label ?? metadata?.id ?? '').length;
			})
		)
	);
</script>

<table class="cascades">
	<tbody>
		<!-- Cascade's recursion tree is displayed reversed because deeply recursive cascades are mainly meant for taxonomic stuff -- it's the childmost metadata that set their parent, so, in the resulting recursion tree, the parentmost metadata end up childmost (eg. species have cascades that sets genus, genus sets family, etc. so family is deeper in the recursion tree than genus, whereas in a taxonomic tree it's the opposite) -->
		{#each entries as [metadataId, options] (metadataId)}
			{@const metadata = tables.Metadata.getFromState(metadataId)}
			{#each options as { key, icon, color, label }, i (key)}
				<tr>
					{#if showImages && metadata}
						<td class="image">
							{#if i === 0 && metadata.images && metadata.images.length > 0}
								<img src={metadata.images[0]} alt="" />
							{/if}
						</td>
					{/if}
					<td
						class="metadata"
						style:width="{compact ? 10 : Math.min(longestMetadataLabelLength, 40)}ch"
					>
						{#if metadata && i === 0}
							<OverflowableText text={metadata.label} />
						{/if}
					</td>
					<td class:crossout={crossout(metadataId, key)}>
						{#if icon || color}
							<div
								class="icon"
								style:background-color={color}
								style:color={color ? readableOn(color) : undefined}
							>
								{#if icon}
									<Icon {icon} />
								{/if}
							</div>
						{/if}
						{label || key}
					</td>
				</tr>
			{/each}
		{/each}
	</tbody>
</table>

<style>
	.cascades {
		border-collapse: collapse;
		table-layout: fixed;
		width: 100%;
	}

	.cascades td {
		border: 1px solid color-mix(in srgb, var(--fg-neutral) 40%, transparent);
		border-left: none;
		border-right: none;
	}

	td.image {
		--size: 2.5em;
		width: var(--size);
		height: var(--size);
		padding: 0.25em;

		img {
			width: 100%;
			height: 100%;
			object-fit: contain;
			border-radius: var(--corner-radius);
		}
	}

	.cascades td.metadata {
		overflow: hidden;
		padding-right: 1rem;
	}

	.cascades td.crossout {
		text-decoration: line-through;
		opacity: 0.6;
	}

	.cascades .icon {
		/* Sorry 😭 we're in a table cell, 
		display: flex fucks everything up */
		float: left;
		margin-right: 0.25em;
		font-size: 1.4em;
		display: flex;
		align-items: center;
		height: 0.8em;
		width: 0.8em;
		border-radius: 50%;
	}
</style>

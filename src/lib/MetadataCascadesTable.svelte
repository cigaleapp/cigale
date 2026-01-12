<script lang="ts">
	import Icon from '@iconify/svelte';

	import type { cascadeLabels } from './cascades.js';
	import OverflowableText from './OverflowableText.svelte';
	import { readableOn } from './utils.js';

	interface Props {
		cascades: Awaited<ReturnType<typeof cascadeLabels>>;
	}

	const { cascades: labels }: Props = $props();
</script>

<table class="cascades">
	<tbody>
		<!-- Cascade's recursion tree is displayed reversed because deeply recursive cascades are mainly meant for taxonomic stuff -- it's the childmost metadata that set their parent, so, in the resulting recursion tree, the parentmost metadata end up childmost (eg. species have cascades that sets genus, genus sets family, etc. so family is deeper in the recursion tree than genus, whereas in a taxonomic tree it's the opposite) -->
		{#each Object.entries(labels).toReversed() as [metadataId, { value, metadata, color, icon }] (metadataId)}
			<tr>
				<td>
					<OverflowableText text={metadata} />
				</td>
				<td>
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
					{value}
				</td>
			</tr>
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

	.cascades td:first-child {
		overflow: hidden;
		padding-right: 1rem;
		width: 7rem;
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

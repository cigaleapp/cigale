<script lang="ts">
	import { tables } from '$lib/idb.svelte.js';
	import { transformObject, unique } from '$lib/utils.js';

	import Block from './Block.svelte';
	import { cssGridAreas, homogenizeLayout, verticalAutoLayout } from './layout.js';

	interface Props {
		scope: 'user' | 'session';
		protocol: string;
	}

	const { scope, protocol: protocolId }: Props = $props();

	const content = $derived(
		tables.Protocol.getFromState(protocolId)?.charts?.[scope] ?? {
			blocks: {},
			sections: undefined,
			layout: undefined,
		}
	);

	const { layout = [], sections = {}, blocks } = $derived(content);

	function normalizedLayout(cells: string[][]) {
		if (cells.length === 0) {
			return verticalAutoLayout([...Object.keys(sections), ...Object.keys(blocks)]);
		}

		return homogenizeLayout(layout);
	}

	/** Blocks that arent in any section */
	const loneBlocks = $derived(
		transformObject(blocks, (name, block) =>
			Object.values(sections).some((section) => section.layout.flat().includes(name))
				? undefined
				: [name, block]
		)
	);
</script>

<div
	class="blocks"
	style:grid-template-areas={cssGridAreas(normalizedLayout(layout))}
	data-scope={scope}
>
	{#each Object.entries(loneBlocks) as [name, block] (name)}
		<div class="block" style:grid-area={name}>
			<Block {scope} protocol={protocolId} {block} />
		</div>
	{/each}

	{#each Object.entries(sections) as [name, section] (name)}
		<div class="section" style:grid-area={name}>
			<h2>{section.title}</h2>
			<div
				class="blocks"
				style:grid-template-areas={cssGridAreas(homogenizeLayout(section.layout))}
			>
				{#each unique(section.layout.flat().flat()) as name (name)}
					{#if name !== null}
						<div class="block" style:grid-area={name}>
							<Block {scope} protocol={protocolId} block={blocks[name]} />
						</div>
					{/if}
				{/each}
			</div>
		</div>
	{/each}
</div>

<style>
	.blocks {
		display: grid;
		gap: 2em;

		.section > & {
			gap: 1em;
		}

		&[data-scope='session'] {
			font-size: 0.8em;
		}
	}

	.section h2 {
		margin-bottom: 0.5em;
	}

	.block {
		border: 1px solid var(--faint);
		border-radius: var(--corner-radius);
	}
</style>

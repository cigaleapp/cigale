<script lang="ts">
	import type { ChartBlock } from '$lib/schemas/charts';

	import { BarChart, PieChart } from 'layerchart';

	import Carousel from '$lib/Carousel.svelte';
	import { databaseHandle, get, tables } from '$lib/idb.svelte.js';
	import LearnMoreLink from '$lib/LearnMoreLink.svelte';
	import LoadingText, { Loading } from '$lib/LoadingText.svelte';
	import Markdown from '$lib/Markdown.svelte';
	import { metadataOption, metadataOptionsOf } from '$lib/metadata';
	import { resolveMetadataImport } from '$lib/metadata/imports.js';
	import { mergeMetadataFromImagesAndObservations } from '$lib/metadata/merging.js';
	import {
		ensureNamespacedMetadataId,
		metadataOptionId,
		removeNamespaceFromMetadataId,
		splitMetadataId,
	} from '$lib/schemas/metadata.js';
	import { toMetadataRecord } from '$lib/schemas/results.js';
	import { uiState } from '$lib/uistate.svelte';
	import { corsfixIfLocalhost, ensureArray, mapKeys } from '$lib/utils.js';

	type BlockTypes = (typeof ChartBlock)['infer']['type'];
	type BlockData<Type extends BlockTypes = BlockTypes> = (typeof ChartBlock)['infer'] & {
		type: Type;
	};

	interface Props {
		scope: 'user' | 'session';
		protocol?: string;
		block: BlockData;
	}

	const { block, scope, protocol: protocolId }: Props = $props();
	const { title, description } = $derived(block);

	async function compute<B extends BlockData>(
		block: B
	): Promise<Awaited<ReturnType<B['compute']['evaluate']>>> {
		async function metadataRecord(record: Record<string, MetadataRuntimeValue>) {
			const rec = toMetadataRecord(record);

			for (const [key, val] of Object.entries(rec)) {
				const def = tables.Metadata.getFromState(key);
				if (!def) continue;
				if (def.type !== 'enum') continue;

				const id = splitMetadataId(def.id);

				if (!block.needs?.includes(id.id)) continue;

				const options = await metadataOptionsOf(databaseHandle(), id.namespace, id.id);

				const option = await metadataOption(databaseHandle(), def.id, val.value.toString());

				if (!option) continue;

				rec[key] = {
					...val,
					valueLabel: option.label,
					valueColor: option.color,
				};
			}

			return {
				...rec,
				...mapKeys(rec, removeNamespaceFromMetadataId),
			};
		}

		async function gatherSession(
			id: string
		): Promise<(typeof ComputationPayloadSession)['infer']> {
			const session = await tables.Session.get(id);

			const out: (typeof ComputationPayloadSession)['infer'] = {
				...session,
				createdAt: new Date(session.createdAt),
				metadata: await metadataRecord(session.metadata),
				images: [],
				observations: [],
			};

			for (const img of await tables.Image.list('sessionId', id)) {
				out.images.push({
					...img,
					metadata: await metadataRecord(img.metadata),
				});
			}

			for (const obs of await tables.Observation.list('sessionId', id)) {
				const images = out.images.filter((img) => obs.images.includes(img.id));

				const merged = mergeMetadataFromImagesAndObservations({
					images,
					observations: [obs],
					definitions: tables.Metadata.state,
				});

				out.observations.push({
					...obs,
					images,
					metadata: await metadataRecord(merged),
					metadataOverrides: await metadataRecord(obs.metadataOverrides),
				});
			}

			return out;
		}

		switch (scope) {
			case 'user': {
				const sessions: Array<(typeof ComputationPayloadSession)['infer']> = [];

				for (const ses of tables.Session.state) {
					if (ses.protocol !== protocolId) continue;
					sessions.push(await gatherSession(ses.id));
				}

				const result = await block.compute.evaluate({
					scope,
					sessions,
				});

				console.log(`[${block.type}] compute with`, sessions, '=', result);
				return result;
			}

			case 'session': {
				return block.compute.evaluate({
					scope,
					...(await gatherSession(uiState.currentSessionId!)),
				});
			}
		}
	}

	async function getMetadataOption(
		block: BlockData<'spotlight'>,
		result: Awaited<ReturnType<BlockData<'spotlight'>['compute']['evaluate']>>
	) {
		console.log('finding', block.metadata, '@', result);
		if (!result) return;

		const protocol = await tables.Protocol.get(protocolId!);
		if (!protocol) return;

		const id = resolveMetadataImport(
			protocol,
			ensureNamespacedMetadataId(block.metadata, protocolId)
		);

		return await get('MetadataOption', metadataOptionId(id, result.toString()));
	}
</script>

<article class="block">
	<h2>{title}</h2>
	<Markdown source={description} />

	{#if block.type === 'figure'}
		<div class="figure">
			{#if block.prefix}
				<div class="prefix">{block.prefix}</div>
			{/if}

			<div class="big">
				<LoadingText
					mask="123"
					value={async () => await compute(block).catch(console.error)}
				/>
			</div>

			{#if block.suffix}
				<div class="suffix">{block.suffix}</div>
			{/if}
		</div>
	{:else if block.type === 'partition'}
		<div class="partition">
			{#await compute(block).catch(console.error)}
				<LoadingText value={Loading} mask={{ lines: 4 }} />
			{:then data}
				<!-- TODO: dynamic height -->
				<!-- XXX: why do we need json-parse, seems like output is a non-pojo ? -->
				<PieChart
					data={ensureArray(JSON.parse(JSON.stringify(data)))}
					key="label"
					value="value"
					c={data.every((d) => d.color) ? 'color' : undefined}
					height={250}
					padding={{ top: 50, bottom: 50 }}
					labels={{ placement: 'callout', value: 'label' }}
				/>
			{/await}
		</div>
	{:else if block.type === 'histogram'}
		<div class="histogram">
			{#await compute(block).catch(console.error)}
				<LoadingText value={Loading} mask={{ lines: 4 }} />
			{:then data}
				<!-- TODO: dynamic height -->
				<!-- XXX: why do we need json-parse, seems like output is a non-pojo ? -->
				<BarChart
					data={ensureArray(JSON.parse(JSON.stringify(data)))}
					x="x"
					y="y"
					height={250}
					padding={{ top: 50 }}
				/>
			{/await}
		</div>
	{:else if block.type === 'spotlight'}
		<div class="spotlight">
			{#await compute(block).then((key) => getMetadataOption(block, key))}
				<LoadingText value={Loading} />
			{:then option}
				{#if option}
					<div class="text">
						<h3>{option.label}</h3>

						<div class="description">
							<Markdown source={option.description} />
						</div>

						{#if option.learnMore}
							<LearnMoreLink href={option.learnMore} />
						{/if}
					</div>

					{#if option.images}
						<div class="images">
							<Carousel items={option.images} slideName={(_, i) => `Image ${i + 1}`}>
								{#snippet item(src)}
									<img src={corsfixIfLocalhost(src)} />
								{/snippet}
							</Carousel>
						</div>
					{/if}
				{/if}
			{/await}
		</div>
	{:else if block.type === 'list'}
		<ul class="list">
			{#await compute(block)}
				<ul>
					<li>
						<LoadingText value={Loading} />
					</li>
					<li>
						<LoadingText value={Loading} />
					</li>
					<li>
						<LoadingText value={Loading} />
					</li>
				</ul>
			{:then data}
				{#each ensureArray(data) as item, i (i)}
					<li>{item}</li>
				{/each}
			{/await}
		</ul>
	{:else if block.type === 'text' && block.compute}
		<div class="text">
			{#await compute(block)}
				<LoadingText value={Loading} />
			{:then text}
				<Markdown source={text} />
			{/await}
		</div>
	{/if}
</article>

<style>
	.block {
		padding: 1em;
	}

	.figure {
		display: flex;
		gap: 0.5em;
		align-items: end;
	}

	.figure .big,
	.spotlight h3 {
		font-size: 2em;
		color: var(--fg-primary);
		font-weight: normal;
	}

	.list {
		padding: 0;
		list-style: none;

		li {
			padding: 0.5em 1em;
		}

		li:not(:last-child) {
			border-bottom: 1px solid var(--faint);
		}

		.block:has(&) {
			padding: 0;
		}
	}

	.block > .text {
		margin-top: 0.75em;
	}

	.spotlight {
		display: flex;
		align-items: start;
		gap: 2em;

		&:has(.images) {
			margin-top: 1em;
		}

		.images {
			max-width: 400px;

			img {
				width: 100%;
				height: 100%;
				object-fit: contain;
				overflow: hidden;
				border-radius: var(--corner-radius);
			}
		}

		.text {
			display: flex;
			flex-direction: column;
			gap: 0.5em;
		}

		.description {
			max-width: 67ch;
		}
	}

	.block:not(:has(.partition)) :global(.lc-root-container) {
		/* Default marks color when not using explicit color or color scale */
		--color-primary: var(--fg-primary);
	}

	:global(.lc-root-container) {
		/* Progressively darker shades representing surfaces (backgrounds). */
		--color-surface-100: var(--bg-neutral);
		--color-surface-200: var(--faint);
		--color-surface-300: var(--gray);

		/* Content (text) color */
		--color-surface-content: var(--fg-neutral);
	}
</style>

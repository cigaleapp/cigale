<script lang="ts">
	import type { TypedMetadataValue } from '$lib/metadata';
	import type { ChartBlock, ComputationPayloadSession } from '$lib/schemas/charts.js';

	import { BarChart, PieChart } from 'layerchart';
	import { IsInViewport } from 'runed';

	import IconToggleDefinition from '~icons/ri/code-line';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import Carousel from '$lib/Carousel.svelte';
	import DebugOnly from '$lib/DebugOnly.svelte';
	import { databaseHandle, get, tables } from '$lib/idb.svelte.js';
	import LearnMoreLink from '$lib/LearnMoreLink.svelte';
	import LoadingText, { Loading } from '$lib/LoadingText.svelte';
	import Markdown from '$lib/Markdown.svelte';
	import { metadataOption } from '$lib/metadata';
	import { resolveMetadataImport } from '$lib/metadata/imports.js';
	import { mergeMetadataFromImagesAndObservations } from '$lib/metadata/merging.js';
	import {
		ensureNamespacedMetadataId,
		metadataOptionId,
		removeNamespaceFromMetadataId,
		splitMetadataId,
	} from '$lib/schemas/metadata.js';
	import { toMetadataRecord } from '$lib/schemas/results.js';
	import { isDebugMode } from '$lib/settings.svelte.js';
	import { uiState } from '$lib/uistate.svelte';
	import { clamp, corsfixIfLocalhost, ensureArray, mapKeys } from '$lib/utils.js';

	type BlockTypes = (typeof ChartBlock)['infer']['type'];
	type BlockData<Type extends BlockTypes = BlockTypes> = (typeof ChartBlock)['infer'] & {
		type: Type;
	};

	interface Props {
		scope: 'user' | 'session';
		protocol?: string;
		name: string;
		block: BlockData;
	}

	const { block, scope, protocol: protocolId, name: blockName }: Props = $props();
	const { title, description } = $derived(block);

	let showDef = $state(false);

	let dimensions = $state<ClientRect>();

	let inViewport = $state<IsInViewport>();

	async function compute<B extends BlockData>(
		block: B
	): Promise<Awaited<ReturnType<B['compute']['evaluate']>>> {
		await new Promise<void>((resolve) => {
			if (inViewport?.current) resolve();
		});

		async function metadataRecord(record: Record<string, TypedMetadataValue>) {
			const rec = toMetadataRecord(record);

			for (const [key, val] of Object.entries(rec)) {
				const def = tables.Metadata.getFromState(key);
				if (!def) continue;
				if (def.type !== 'enum') continue;

				const id = splitMetadataId(def.id);

				if (!block.needs?.includes(id.id)) continue;

				if (val.value === null) continue;

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
			if (!session) throw new Error('Session not found');

			const out: (typeof ComputationPayloadSession)['infer'] = {
				...session,
				createdAt: new Date(session.createdAt),
				metadata: await metadataRecord(session.metadata),
				images: [],
				observations: [],
			};

			for (const img of await tables.Image.list('sessionId', id)) {
				out.images.push({ ...img, metadata: await metadataRecord(img.metadata) });
			}

			const images = await tables.Image.list('sessionId', id);

			for (const obs of await tables.Observation.list('sessionId', id)) {
				const merged = mergeMetadataFromImagesAndObservations({
					images: images.filter((img) => obs.images.includes(img.id)),
					observations: [obs],
					definitions: tables.Metadata.state,
				});

				out.observations.push({
					...obs,
					images: out.images.filter((img) => obs.images.includes(img.id)),
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
					images: sessions.flatMap((session) => session.images),
					observations: sessions.flatMap((session) => session.observations),
					scope,
					sessions,
					session: null,
				});

				console.debug(
					`[${block.type}] compute ${blockName} with`,
					sessions,
					'=',
					result,
					'expr is',
					block.compute.toJSON()
				);
				return result;
			}

			case 'session': {
				const session = await gatherSession(uiState.currentSessionId!);

				return block.compute.evaluate({
					scope,
					images: session.images,
					observations: session.observations,
					sessions: [session],
					session,
				});
			}
		}
	}

	async function getMetadataOption(
		block: BlockData<'spotlight'>,
		result: Awaited<ReturnType<BlockData<'spotlight'>['compute']['evaluate']>>
	) {
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

<article
	class="block"
	data-block-type={block.type}
	bind:contentRect={dimensions}
	{@attach (node) => {
		inViewport = new IsInViewport(node, { once: true });
	}}
>
	{#if isDebugMode()}
		<div class="block-def-toggle">
			<ButtonIcon
				help="Voir la définition du bloc"
				onclick={() => {
					showDef = !showDef;
				}}
			>
				<IconToggleDefinition />
			</ButtonIcon>
		</div>
	{/if}

	{#if title}
		<h2>
			{title}
		</h2>
	{/if}

	{#if showDef && isDebugMode()}
		<DebugOnly data={block} />
	{:else}
		{#if description}
			<Markdown source={description} />
		{/if}

		{#if block.type === 'figure'}
			<div class="figure">
				{#if block.prefix}
					<div class="prefix">{block.prefix}</div>
				{/if}

				{#await compute(block)}
					<div class="big">
						<LoadingText mask="123" value={Loading} />
					</div>
				{:then value}
					{#if value !== null && value !== undefined}
						<div class="big">
							{value}
						</div>
					{:else}
						{#if block.prefix || block.suffix}
							<div class="big no-data">N/A</div>
						{:else}
							<div class="no-data">Aucune donnée</div>
						{/if}
					{/if}
				{:catch error}
					{@render computeError(error)}
				{/await}

				{#if block.suffix}
					<div class="suffix">{block.suffix}</div>
				{/if}
			</div>
		{:else if block.type === 'partition'}
			{const height = $derived(clamp(0.8 * (dimensions?.width ?? 0), 50, 500))}
			{const pad = 50}
			<div class="partition" style:min-height="{pad + height + pad}px">
				{#await compute(block)}
					<LoadingText value={Loading} mask={{ lines: 4 }} />
				{:then data}
					{const nonzero = $derived(data.filter((entry) => entry.value !== 0))}
					{#if nonzero.length > 0}
						<!-- XXX: why do we need json-parse, seems like output is a non-pojo ? -->
						<PieChart
							data={ensureArray(JSON.parse(JSON.stringify(nonzero)))}
							key="label"
							value="value"
							c={nonzero.every((d) => d.color) ? 'color' : undefined}
							{height}
							padding={{ top: pad, bottom: pad }}
							labels={{ placement: 'callout', value: 'label' }}
						/>
					{:else}
						<div class="no-data">Aucune donnée</div>
					{/if}
				{:catch error}
					{@render computeError(error)}
				{/await}
			</div>
		{:else if block.type === 'histogram'}
			<div class="histogram" style:min-height="{250 + 50}px">
				{#await compute(block).catch(console.error)}
					<LoadingText value={Loading} mask={{ lines: 4 }} />
				{:then data}
					{#if data && data.length > 0}
						<!-- XXX: why do we need json-parse, seems like output is a non-pojo ? -->
						<BarChart
							data={ensureArray(JSON.parse(JSON.stringify(data)))}
							x="x"
							y="y"
							height={250}
							padding={{ top: 50 }}
						/>
					{:else}
						<div class="no-data">Aucune donnée</div>
					{/if}
				{:catch error}
					{@render computeError(error)}
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
								<Carousel
									items={option.images}
									slideName={(_, i) => `Image ${i + 1}`}
								>
									{#snippet item(src)}
										<img src={corsfixIfLocalhost(src)} />
									{/snippet}
								</Carousel>
							</div>
						{/if}
					{:else}
						<div class="no-data">Aucune donnée</div>
					{/if}
				{:catch error}
					{@render computeError(error)}
				{/await}
			</div>
		{:else if block.type === 'list'}
			{#await compute(block)}
				<ul class="list">
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
				{#if ensureArray(data).length > 0}
					<ul class="list">
						{#each ensureArray(data) as item, i (i)}
							<li>{item}</li>
						{/each}
					</ul>
				{:else}
					<div class="list">
						<div class="no-data">Aucune donnée</div>
					</div>
				{/if}
			{:catch error}
				{@render computeError(error)}
			{/await}
		{:else if block.type === 'text' && block.compute}
			<div class="text">
				{#await compute(block)}
					<LoadingText value={Loading} />
				{:then text}
					<Markdown source={text ?? ''} />
				{:catch error}
					{@render computeError(error)}
				{/await}
			</div>
		{/if}
	{/if}
</article>

{#snippet computeError(error)}
	{#if isDebugMode()}
		<div class="error">
			Error in <code>{blockName}</code>'s compute function:
			<br />{error}
			<br />
			<br />Compute expression is:
			<br />{@html block.compute.toJSON().replaceAll('\n', '<br>')}
		</div>
	{:else}
		<div class="no-data">Aucune donnée</div>
	{/if}
{/snippet}

<style>
	.block {
		padding: 1em;
		container-type: inline-size;
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

	.block-def-toggle {
		position: absolute;
		top: 1em;
		right: 1em;

		.block:has(&) {
			position: relative;
		}
	}

	.block > .text {
		margin-top: 0.75em;
	}

	.block .no-data {
		color: var(--gay);
	}

	.block > :is(.histogram, .partition) .no-data {
		height: 100%;
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: 1.5em;
	}

	.block:has(.error) {
		color: var(--fg-error);
		background-color: var(--bg-error);
	}

	.block:not(:has(:focus, :hover)) .block-def-toggle {
		display: none;
	}

	.block:has(.error, .no-data):has(> .histogram, > .partition) {
		&,
		& > div:not(.block-def-toggle) {
			height: 100%;
			width: 100%;
		}
	}

	.spotlight {
		display: flex;
		align-items: start;
		gap: 2em;

		@container (max-width: 67ch) {
			flex-direction: column-reverse;
		}

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

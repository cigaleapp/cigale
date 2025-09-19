<script>
	import { tables } from '$lib/idb.svelte';
	import { modelUrl } from '$lib/inference';
	import { metadataDefinitionComparator } from '$lib/metadata';
	import { m } from '$lib/paraglide/messages.js';
	import { tooltip } from '$lib/tooltips';
	import IconArrow from '~icons/ph/arrow-right';
	import IconSource from '~icons/ph/link-simple';
	import IconClassification from '~icons/ph/list-star';
	import IconDetection from '~icons/ph/magnifying-glass';
	import IconAuthors from '~icons/ph/users';

	const { data } = $props();

	const { id, learnMore, authors, metadata, description, crop, metadataOrder } = $derived(data);

	const metadataOfProtocol = $derived(
		tables.Metadata.state
			.filter(({ id }) => metadata.includes(id))
			.toSorted(metadataDefinitionComparator({ metadataOrder }))
	);
</script>

{#snippet modelDetails(
	/** @type {{ model: import('$lib/database').HTTPRequest, input: import('$lib/database').ModelInput, name?: string }} */ params
)}
	{#if params}
		<p>
			{#if params.name}
				{params.name}:
			{/if}
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
			<a href={modelUrl(params.model)}>
				{modelUrl(params.model).split('/').at(-1)}
			</a>
		</p>
		<p class="id">
			<code use:tooltip={"Taille d'image en entrée du réseau"}>
				{params.input.height} × {params.input.width} px
			</code>
		</p>
	{:else}
		<p class="empty">Pas de modèle</p>
	{/if}
{/snippet}

<header>
	<p class="description">
		{description}
	</p>
	{#if learnMore}
		<p class="source">
			<IconSource />
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
			<a href={learnMore}>{learnMore.replace('https://', '')}</a>
		</p>
	{/if}
	{#if authors.length}
		{#snippet author(/** @type {{name: string; email?: string}} */ a)}
			{a.name}
			{#if a.email}
				<br />
				<a href="mailto:{a.email}">{a.email}</a>
			{/if}
		{/snippet}

		<div class="authors">
			<IconAuthors />
			<ul>
				{#each authors as a (a.email + a.name)}
					<li>{@render author(a)}</li>
				{/each}
			</ul>
		</div>
	{/if}
</header>

<section class="inference">
	<p class="subtitle">{m.inference()}</p>

	<ul>
		{#if crop}
			<li>
				<IconDetection />
				<div class="text">
					<p class="title">
						{m.detection_and_cropping()}
						<IconArrow />
						<code
							use:tooltip={`La métadonnée stockant le résultat de la détection: ${crop.metadata}`}
						>
							{crop.metadata.replace(`${id}__`, '')}
						</code>
					</p>
					{#if crop.confirmationMetadata}
						<p class="title">
							Confirmation du détourage
							<IconArrow />
							<code use:tooltip={`La métadonnée stockant si la détection a été confirmée`}>
								{crop.confirmationMetadata.replace(`${id}__`, '')}
							</code>
						</p>
					{/if}
					{#each crop.infer ?? [] as model (model.name ?? model.model.toString())}
						{@render modelDetails(model)}
					{/each}
				</div>
			</li>
		{/if}
		{#each metadataOfProtocol.filter((m) => m.infer && 'neural' in m.infer) as m (m.id)}
			<li>
				<IconClassification />
				<div class="text">
					<p class="title">
						{m.label}
						<IconArrow />
						<code use:tooltip={`Le métadonnée stockant le résultat de l'inférence: ${m.id}`}>
							{m.id.replace(`${id}__`, '')}
						</code>
					</p>
					{#each m.infer.neural ?? [] as model (model.model.toString())}
						{@render modelDetails(model)}
					{/each}
				</div>
			</li>
		{/each}
	</ul>
</section>

<style>
	header,
	section {
		max-width: 35rem;
	}

	header,
	section:not(:last-child) {
		margin-bottom: 1em;
	}

	header {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
	}

	.id {
		font-size: 0.8em;
		color: var(--gray);
		display: block;
	}

	.source,
	.authors {
		display: flex;
		gap: 0.5em;
		align-items: center;
	}

	.source a {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.subtitle {
		text-transform: uppercase;
		letter-spacing: 1px;
		font-weight: bold;
		font-size: 0.8em;
		color: var(--gay);
		margin-bottom: 1em;
	}

	ul {
		list-style: none;
		padding-left: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
		gap: 0.5em;
	}

	.inference li {
		display: flex;
		gap: 0.5em;
	}

	.inference .title {
		display: flex;
		align-items: center;
		gap: 0.25em;
	}

	.inference ul {
		grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
	}
</style>

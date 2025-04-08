<script>
	import { base } from '$app/paths';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import Card from '$lib/Card.svelte';
	import { tables } from '$lib/idb.svelte';
	import { exportProtocol } from '$lib/protocols';
	import { toasts } from '$lib/toasts.svelte';
	import { tooltip } from '$lib/tooltips';
	import IconExport from '~icons/ph/share';
	import IconTaxonomy from '~icons/ph/graph';
	import IconDelete from '~icons/ph/trash';
	import IconSource from '~icons/ph/link-simple';
	import IconBuiltin from '~icons/ph/diamond';
	import IconAuthors from '~icons/ph/users';
	import IconInferred from '~icons/ph/magic-wand';
	import IconTechnical from '~icons/ph/wrench';
	import IconClassification from '~icons/ph/list-star';
	import IconArrow from '~icons/ph/arrow-right';
	import IconDetection from '~icons/ph/magnifying-glass';
	import IconDatatype from '$lib/IconDatatype.svelte';
	import { metadataDefinitionComparator } from '$lib/metadata';

	/** @type {import('$lib/database').Protocol & { ondelete: () => void }} */
	const { id, name, source, authors, metadata, description, ondelete, inference, metadataOrder } =
		$props();

	const metadataOfProtocol = $derived(
		tables.Metadata.state
			.filter(({ id }) => metadata.includes(id))
			.toSorted(metadataDefinitionComparator({ metadataOrder }))
	);

	/**
	 * @param {import('$lib/database').Request} source
	 */
	function inferenceModelUrl(source) {
		if (typeof source === 'string') return source;
		return source.url;
	}

	function isTaxonomicMetadata(id) {
		return Object.values(inference.classification?.taxonomic?.targets ?? {}).includes(id);
	}
</script>

<Card>
	<header>
		<h2>{name}</h2>
		<code class="id">{id}</code>
		<p class="description">
			{description}
		</p>
		{#if source}
			<p class="source">
				<IconSource />
				<a href={source}>{source.replace('https://', '')}</a>
			</p>
		{/if}
		{#if authors.length}
			{#snippet author(/** @type {{name: string; email: string}} */ a)}
				{a.name}
				<br />
				<a href="mailto:{a.email}">{a.email}</a>
			{/snippet}

			<div class="authors">
				<IconAuthors />
				<ul>
					{#each authors as a (a.email)}
						<li>{@render author(a)}</li>
					{/each}
				</ul>
			</div>
		{/if}
	</header>
	<section class="metadata">
		<p class="subtitle">{metadata.length} métadonnées</p>
		<ul>
			{#each metadataOfProtocol as m (m.id)}
				<li>
					<IconDatatype type={m.type} />
					<div class="text">
						<p class="name">
							{#if m.label}
								{m.label}
							{:else}
								<code>{m.id}</code>
							{/if}
							{#if m.type === 'enum' && m.options}
								<span
									class="enum-options"
									use:tooltip={[
										...m.options.slice(0, 10),
										{ label: m.options.length > 10 ? '…' : '' }
									]

										.map((o) => o.label)
										.filter(Boolean)
										.join(', ')}
								>
									({m.options.length} options)
								</span>
							{/if}
							{#if !m.label}
								<sup
									use:tooltip={"Métadonnée technique, non visible dans l'interface"}
									style:color="var(--fg-error)"
								>
									<IconTechnical />
								</sup>
							{/if}
							{#if isTaxonomicMetadata(m.id)}
								<sup
									use:tooltip={"Métadonnée taxonomique, déduite de la valeur de d'une autre métadonnée représentant la clade inférieure"}
									style:color="var(--fg-warning)"
								>
									<IconTaxonomy />
								</sup>
							{/if}
							{#if [inference?.classification?.metadata, 'crop'].includes(m.id)}
								<sup
									use:tooltip={'Métadonnée auto-détectée par inférence'}
									style:color="var(--fg-primary)"
								>
									<IconInferred />
								</sup>
							{/if}
						</p>
						<code class="id">
							{#if m.id.startsWith(`${id}__`)}
								{m.id.replace(`${id}__`, '')}
							{:else}
								<span use:tooltip={'Métadonnée built-in'}>
									<IconBuiltin />
								</span>
								{m.id}
							{/if}
						</code>
					</div>
				</li>
			{/each}
		</ul>
	</section>
	{#if inference}
		<section class="inference">
			<p class="subtitle">Inférence</p>
			{#snippet modelDetails(
				/** @type {NonNullable<import('$lib/database').Protocol['inference']>['classification'|'detection']} */ params
			)}
				{#if params}
					<p>
						<a href={inferenceModelUrl(params.model)}>
							{inferenceModelUrl(params.model).split('/').at(-1)}
						</a>
					</p>
					<p class="id">
						<code use:tooltip={"Taille d'image en entrée du réseau"}>
							{params.input.height} × {params.input.width} px
						</code>
					</p>
					{#if 'taxonomic' in params && params.taxonomic}
						<p class="taxonomy">
							<IconTaxonomy />
							<a
								href={inferenceModelUrl(params.taxonomic.taxonomy)}
								use:tooltip={'Inférence taxonomique des clades supérieures'}
							>
								{inferenceModelUrl(params.taxonomic.taxonomy).split('/').at(-1)}
							</a>
						</p>
					{/if}
				{:else}
					<p class="empty">Pas de modèle</p>
				{/if}
			{/snippet}
			<ul>
				<li>
					<IconDetection />
					<div class="text">
						<p class="title">
							Détection &amp; détourage
							<IconArrow />
							<code use:tooltip={"Le modèle permet d'inférrer une valeur à cette métadonnée"}>
								crop
							</code>
						</p>
						{@render modelDetails(inference.detection)}
					</div>
				</li>
				<li>
					<IconClassification />
					<div class="text">
						<p class="title">
							Classification
							{#if inference.classification?.metadata}
								<IconArrow />
								<code use:tooltip={"Le modèle permet d'inférrer une valeur à cette métadonnée"}>
									{inference.classification?.metadata.replace(`${id}__`, '')}
								</code>
							{/if}
						</p>
						{@render modelDetails(inference.classification)}
					</div>
				</li>
			</ul>
		</section>
	{/if}
	<section class="actions">
		<ButtonSecondary
			onclick={async () => {
				await exportProtocol(base, id).catch((e) => toasts.error(e));
			}}
		>
			<IconExport />
			Exporter
		</ButtonSecondary>
		<ButtonSecondary
			onclick={() => {
				ondelete();
			}}
		>
			<IconDelete />
			Supprimer
		</ButtonSecondary>
	</section>
</Card>

<style>
	header,
	section {
		max-width: 40rem;
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

	.actions {
		display: flex;
		flex-flow: row wrap;
		gap: 0.5em 1em;
	}

	.source,
	.authors {
		display: flex;
		gap: 0.5em;
		align-items: center;
	}

	.source a {
		max-width: 80%;
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

	.metadata li,
	.inference li {
		display: flex;
		gap: 0.5em;
	}

	.metadata li {
		align-items: center;
	}

	.metadata li code,
	.taxonomy,
	.name,
	.inference .title {
		display: flex;
		align-items: center;
		gap: 0.25em;
	}

	.inference ul {
		grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
	}
</style>

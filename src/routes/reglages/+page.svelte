<script>
	import { tables } from '$lib/idb.svelte.js';
	import Card from '$lib/Card.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import IconDownload from '~icons/ph/download';
	import { tooltip } from '$lib/tooltips';

	/**
	 * @param {typeof tables.Metadata.state} metadata
	 * @param {{metadata: string[]}} protocol
	 */
	function metadataOfProtocol(metadata, protocol) {
		return metadata.filter((m) => protocol.metadata.includes(m.id));
	}

	$inspect(tables.Metadata.state);
	$inspect(tables.Protocol.state);
</script>

<h1>C'est le réglages des protocooooooooooooooles</h1>
<p>On peut changer les paramètres des protocoles ici</p>

<div>
	<ul class="protocoles">
		{#each tables.Protocol.state as p (p.id)}
			<li>
				<Card>
					<header>
						<h2>{p.name}</h2>
						{#if p.source}
							<p><a href={p.source.href}>{p.source.href.replace('https://', '')}</a></p>
						{/if}
						<p>
							Par {p.author.name}
							{#if p.author.email}
								(<a href="mailto:{p.author.email}">{p.author.email}</a>)
							{/if}
						</p>
					</header>
					<section class="metadata">
						<p>Avec {p.metadata.length} métadonnées</p>
						<ul>
							{#each metadataOfProtocol(tables.Metadata.state, p) as m (m.id)}
								<li use:tooltip={`ID: ${m.id}`}>
									{m.label}
									{#if m.type === 'enum' && m.options.length <= 5}
										({m.options
											.map((c) => c.label)
											.slice(0, 5)
											.join(', ')})
									{:else if m.type === 'enum'}
										({m.options.length} options)
									{:else}
										({m.type})
									{/if}
								</li>
							{/each}
						</ul>
					</section>
					<section class="actions">
						<ButtonSecondary
							onclick={async () => {
								alert(
									'todo! attendre que https://git.inpt.fr/cigale/cigale.pages.inpt.fr/-/merge_requests/66 soit merged'
								);
							}}
						>
							<IconDownload />
							Exporter
						</ButtonSecondary>
					</section>
				</Card>
			</li>
		{/each}
	</ul>
</div>

<style>
	h1 {
		padding-top: 40px;
		color: var(--fg-primary);
	}
	.protocoles {
		list-style: none;
		display: flex;
		--card-padding: 1em;
	}

	.protocoles header,
	.protocoles section:not(:last-child) {
		margin-bottom: 1em;
	}

	ul {
		list-style-position: inside;
		padding-left: 0;
	}
</style>

<script>
	import { tables } from '$lib/idb.svelte.js';
	import Card from '$lib/Card.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import IconExport from '~icons/ph/share';
	import IconImport from '~icons/ph/download';
	import IconDelete from '~icons/ph/trash';
	import { tooltip } from '$lib/tooltips';
	import { exportProtocol, importProtocol } from '$lib/protocols';
	import { base } from '$app/paths';
	import ModalConfirm from '$lib/ModalConfirm.svelte';
	import { toasts } from '$lib/toasts.svelte';

	/**
	 * @param {typeof tables.Metadata.state} metadata
	 * @param {{metadata: string[]}} protocol
	 */
	function metadataOfProtocol(metadata, protocol) {
		return metadata.filter((m) => protocol.metadata.includes(m.id));
	}

	/**
	 * Protocol we're confirming deletion for
	 * @type {undefined | import('$lib/database').Protocol}
	 */
	let removingProtocol = $state(undefined);

	/** @type {undefined | (() => void)} */
	let confirmDelete = $state();
</script>

<ModalConfirm
	title="Êtes-vous sûr·e?"
	key="delete-protocol"
	bind:open={confirmDelete}
	cancel="Annuler"
	confirm="Oui, supprimer"
	onconfirm={async () => {
		if (!removingProtocol) return;
		await tables.Protocol.remove(removingProtocol.id);
		await Promise.all(
			removingProtocol.metadata
				.filter((id) => id.startsWith(`${removingProtocol?.id}__`))
				.map((id) => tables.Metadata.remove(id))
		);
		toasts.success('Protocole supprimé');
	}}
>
	Il est impossible de revenir en arrière après avoir supprimé un protocole.
</ModalConfirm>

<header>
	<h1>Protocoles</h1>
	<ButtonSecondary
		onclick={async () => {
			await importProtocol()
				.catch((e) =>
					toasts.error(
						e?.toString().replace(/^AggregateError: /, 'Protocole invalide: ') ??
							"Erreur inattendue pendant l'import du protocole"
					)
				)
				.then((p) => {
					if (p && p instanceof Object) toasts.success(`Protocole “${p.name}” importé`);
				});
		}}
	>
		<IconImport />
		Importer
	</ButtonSecondary>
</header>

<ul class="protocoles">
	{#each tables.Protocol.state as p (p.id)}
		<li>
			<Card>
				<header>
					<h2>{p.name}</h2>
					{#if p.source}
						<p><a href={p.source}>{p.source.replace('https://', '')}</a></p>
					{/if}
					{#if p.authors.length}
						{#snippet author(/** @type {{name: string; email: string}} */ a)}
							{a.name}
							(<a href="mailto:{a.email}">{a.email}</a>)
						{/snippet}

						{#if p.authors.length === 1}
							<p>Par {@render author(p.authors[0])}</p>
						{:else}
							<p>Par</p>
							<ul>
								{#each p.authors as a (a.email)}
									<li>{@render author(a)}</li>
								{/each}
							</ul>
						{/if}
					{/if}
				</header>
				<section class="metadata">
					<p>Avec {p.metadata.length} métadonnées</p>
					<ul>
						{#each metadataOfProtocol(tables.Metadata.state, p) as m (m.id)}
							<li use:tooltip={`ID: ${m.id}`}>
								{m.label}
								{#if m.type === 'enum' && m.options && m.options.length <= 5}
									({m.options
										.map((c) => c.label)
										.slice(0, 5)
										.join(', ')})
								{:else if m.type === 'enum' && m.options}
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
							await exportProtocol(base, p.id).catch((e) =>
								toasts.error(e?.toString() ?? 'Erreur inattendue')
							);
						}}
					>
						<IconExport />
						Exporter
					</ButtonSecondary>
					<ButtonSecondary
						onclick={() => {
							removingProtocol = { ...p };
							confirmDelete?.();
						}}
					>
						<IconDelete />
						Supprimer
					</ButtonSecondary>
				</section>
			</Card>
		</li>
	{/each}
</ul>

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

	.protocoles .actions {
		display: flex;
		flex-flow: row wrap;
		gap: 0.5em 1em;
	}

	ul {
		list-style-position: inside;
		padding-left: 0;
	}

	header {
		margin-bottom: 2rem;
	}
</style>

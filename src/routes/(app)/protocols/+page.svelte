<script>
	import { base } from '$app/paths';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import Card from '$lib/Card.svelte';
	import { openTransaction, tables } from '$lib/idb.svelte.js';
	import { isNamespacedToProtocol } from '$lib/metadata';
	import ModalConfirm from '$lib/ModalConfirm.svelte';
	import { exportProtocol, importProtocol } from '$lib/protocols';
	import { toasts } from '$lib/toasts.svelte';
	import { tooltip } from '$lib/tooltips';
	import IconImport from '~icons/ph/download';
	import IconExport from '~icons/ph/share';
	import IconDelete from '~icons/ph/trash';

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
		await openTransaction(['Protocol', 'Metadata'], 'readwrite', (tx) => {
			if (!removingProtocol) return;

			tx.objectStore('Protocol').delete(removingProtocol.id);

			const toRemove = removingProtocol.metadata.filter((id) =>
				// @ts-ignore that shit is pretty dumb, of course removingProtocol is not undefined
				isNamespacedToProtocol(removingProtocol.id, id)
			);

			for (const metadata of toRemove) {
				tx.objectStore('Metadata').delete(metadata);
			}
		});
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

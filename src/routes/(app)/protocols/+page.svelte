<script>
	import { base } from '$app/paths';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import ButtonPrimary from '$lib/ButtonPrimary.svelte';
	import Card from '$lib/Card.svelte';
	import { openTransaction, tables } from '$lib/idb.svelte.js';
	import { downloadProtocolTemplate, isNamespacedToProtocol } from '$lib/protocols.js';
	import ModalConfirm from '$lib/ModalConfirm.svelte';
	import { exportProtocol, importProtocol } from '$lib/protocols';
	import { toasts } from '$lib/toasts.svelte';
	import { tooltip } from '$lib/tooltips';
	import IconCreate from '~icons/ph/plus-circle';
	import IconDownload from '~icons/ph/download-simple';
	import IconImport from '~icons/ph/download';
	import IconExport from '~icons/ph/share';
	import IconDelete from '~icons/ph/trash';
	import Modal from '$lib/Modal.svelte';

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

	/** @type {undefined | (() => void)} */
	let downloadNewProtocolTemplate = $state();
</script>

<Modal
	key="download-protocol-template"
	title="Créer un protocole"
	bind:open={downloadNewProtocolTemplate}
>
	<p>
		Pour l'instant, C.i.g.a.l.e ne permet pas de créer ou modifier des protocoles dans l'interface
	</p>
	<p>
		Cependant, les protocoles sont représentables par des fichiers de configuration JSON ou YAML
	</p>
	<p>Vous pouvez télécharger un modèle de protocole vide pour vous faciliter la tâche</p>
	<p>
		Sachant qu'un <a href="https://json-schema.org/">JSON Schema</a> est fourni avec ces fichiers, la
		plupart des éditeurs de code modernes vous proposeront de l'autocomplétion et de la documentation
	</p>
	<p>
		Vous pourrez ensuite importer votre protocole ici. Si vous voulez le modifier par la suite, il
		suffit de l'exporter, modifier le fichier, et réimporter
	</p>

	{#snippet footer({ close })}
		<section class="actions">
			<ButtonPrimary
				onclick={async () => {
					await downloadProtocolTemplate(base, 'json');
					close?.();
				}}
			>
				<IconDownload />
				Format JSON
			</ButtonPrimary>
			<ButtonSecondary
				onclick={async () => {
					await downloadProtocolTemplate(base, 'yaml');
					close?.();
				}}
			>
				<IconDownload />
				Format YAML
			</ButtonSecondary>
		</section>
	{/snippet}
</Modal>

<ModalConfirm
	title="Êtes-vous sûr·e?"
	key="delete-protocol"
	bind:open={confirmDelete}
	cancel="Annuler"
	confirm="Oui, supprimer"
	onconfirm={async () => {
		await openTransaction(['Protocol', 'Metadata'], {}, (tx) => {
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
	<section class="actions">
		<ButtonSecondary
			onclick={async () => {
				await importProtocol()
					.catch((e) =>
						// TODO use regular (non-assert) arktype validation instead
						toasts.error(
							e?.toString().replace(/^TraversalError: /, 'Protocole invalide: ') ??
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
		<ButtonSecondary onclick={() => downloadNewProtocolTemplate?.()}>
			<IconCreate />
			Créer
		</ButtonSecondary>
	</section>
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
		gap: 1em;
		flex-wrap: wrap;
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

	section.actions {
		margin-top: 1rem;
		display: flex;
		align-items: center;
		gap: 1em;
	}
</style>

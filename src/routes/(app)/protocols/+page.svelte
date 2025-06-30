<script>
	import { base } from '$app/paths';
	import ButtonPrimary from '$lib/ButtonPrimary.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import { openTransaction, tables } from '$lib/idb.svelte.js';
	import Modal from '$lib/Modal.svelte';
	import ModalConfirm from '$lib/ModalConfirm.svelte';
	import { promptAndImportProtocol } from '$lib/protocols';
	import {
		downloadProtocolTemplate,
		isNamespacedToProtocol,
		jsonSchemaURL
	} from '$lib/protocols.js';
	import { toasts } from '$lib/toasts.svelte';
	import IconImport from '~icons/ph/download';
	import IconDownload from '~icons/ph/download-simple';
	import IconCreate from '~icons/ph/plus-circle';
	import CardProtocol from './CardProtocol.svelte';

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
	key="modal_download_protocol_template"
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
		Sachant qu'un <a href={jsonSchemaURL(base)}>JSON Schema</a> est déclaré dans ces fichiers, la plupart
		des éditeurs de code modernes vous proposeront de l'autocomplétion et de la documentation
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
	key="modal_delete_protocol"
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
			loading
			onclick={async (_, signals) => {
				await promptAndImportProtocol({ allowMultiple: true, onInput: signals.loadingStarted })
					.catch((e) => toasts.error(e))
					.then((ps) => {
						if (!ps || typeof ps === 'string' || ps.length === 0) return;
						if (ps.length === 1) toasts.success(`Protocole “${ps[0].name}” importé`);
						else toasts.success(`${ps.length} protocoles importés`);
					});
			}}
		>
			{#snippet children({ loading })}
				{#if !loading}<IconImport />{/if}
				Importer
			{/snippet}
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
			<CardProtocol
				{...p}
				ondelete={() => {
					removingProtocol = { ...p };
					confirmDelete?.();
				}}
			/>
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

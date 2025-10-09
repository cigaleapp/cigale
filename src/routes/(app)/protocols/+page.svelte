<script>
	import { resolve } from '$app/paths';
	import ButtonPrimary from '$lib/ButtonPrimary.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import { tables } from '$lib/idb.svelte.js';
	import Modal from '$lib/Modal.svelte';

	import { promptAndImportProtocol } from '$lib/protocols';
	import { downloadProtocolTemplate, jsonSchemaURL } from '$lib/protocols.js';
	import { toasts } from '$lib/toasts.svelte';
	import IconImport from '~icons/ph/download';
	import IconDownload from '~icons/ph/download-simple';
	import IconCreate from '~icons/ph/plus-circle';
	import ModalDeleteProtocol from './ModalDeleteProtocol.svelte';
	import RowProtocol from './RowProtocol.svelte';
	import { plural } from '$lib/i18n';
	import { fade } from 'svelte/transition';

	const { data } = $props();

	/**
	 * Protocol we're confirming deletion for
	 * @type {string}
	 */
	let removingProtocol = $state('');

	/** @type {undefined | (() => void)} */
	let confirmDelete = $state();

	/** @type {undefined | (() => void)} */
	let downloadNewProtocolTemplate = $state();
</script>

<ModalDeleteProtocol id={removingProtocol} bind:open={confirmDelete} />

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
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
		Sachant qu'un <a href={jsonSchemaURL(resolve('/'))}>JSON Schema</a> est déclaré dans ces fichiers,
		la plupart des éditeurs de code modernes vous proposeront de l'autocomplétion et de la documentation
	</p>
	<p>
		Vous pourrez ensuite importer votre protocole ici. Si vous voulez le modifier par la suite, il
		suffit de l'exporter, modifier le fichier, et réimporter
	</p>

	{#snippet footer({ close })}
		<section class="actions">
			<ButtonPrimary
				onclick={async () => {
					await downloadProtocolTemplate(resolve('/'), 'json');
					close?.();
				}}
			>
				<IconDownload />
				Format JSON
			</ButtonPrimary>
			<ButtonSecondary
				onclick={async () => {
					await downloadProtocolTemplate(resolve('/'), 'yaml');
					close?.();
				}}
			>
				<IconDownload />
				Format YAML
			</ButtonSecondary>
		</section>
	{/snippet}
</Modal>

<div class="page" in:fade={{ duration: 100 }}>
	<header>
		<h1>Protocoles</h1>
		<section class="actions">
			<ButtonSecondary
				loading
				onclick={async (_, signals) => {
					await promptAndImportProtocol({
						allowMultiple: true,
						onInput: signals.loadingStarted,
						importProtocol: data.swarpc.importProtocol
					})
						.catch((e) => toasts.error(e))
						.then((ps) => {
							if (!ps || typeof ps === 'string' || ps.length === 0) return;
							if (ps.length === 1) toasts.success(`Protocole “${ps[0].name}” importé`);
							else
								toasts.success(plural(ps.length, ['Protocole importé', '# protocoles importés']));
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

	<ul class="protocols">
		{#each tables.Protocol.state as p (p.id)}
			<RowProtocol
				{...p}
				ondelete={() => {
					removingProtocol = p.id;
					confirmDelete?.();
				}}
			/>
		{/each}
	</ul>
</div>

<style>
	h1 {
		padding-top: 40px;
		color: var(--fg-primary);
	}

	.page {
		max-width: 600px;
		width: 100%;
		margin: 3rem auto;
	}

	.protocols {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 1em;
		width: 100%;
		list-style-position: inside;
		padding-left: 0;
		padding: 0;
	}

	header {
		margin-bottom: 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
	}

	header h1 {
		padding: 0;
	}

	section.actions {
		display: flex;
		align-items: center;
		gap: 1em;
	}
</style>

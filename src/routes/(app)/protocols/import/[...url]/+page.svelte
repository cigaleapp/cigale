<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import HighlightHostname from '$lib/HighlightHostname.svelte';
	import { tables } from '$lib/idb.svelte.js';
	import ModalConfirm from '$lib/ModalConfirm.svelte';
	import { goto } from '$lib/paths';
	import { toasts } from '$lib/toasts.svelte.js';

	const { swarpc } = $derived(page.data);

	let importing = $state(false);

	const toImport = $derived.by(() => {
		const url = page.params.url;
		if (!url) return null;

		if (url.startsWith('https:') && URL.canParse(url)) {
			return new URL(url);
		}

		return null;
	});

	let openModal = $state();

	afterNavigate(() => {
		if (openModal && toImport && !importing) {
			openModal();
		}
	});
</script>

<ModalConfirm
	title="Importer le protocole distant ?"
	key="modal_import_remote_protocol"
	confirm="Importer"
	bind:open={openModal}
	oncancel={async () => {
		await goto('/');
	}}
	onconfirm={async () => {
		if (!toImport) return;
		importing = true;
		const raw = await fetch(toImport)
			.then((res) => res.text())
			.catch((e) => {
				toasts.error(`Erreur lors de l'import du protocole distant: ${e}`);
				return null;
			});

		if (!raw) return;

		try {
			await swarpc.importProtocol({ contents: raw });
			await tables.Protocol.refresh(null);
			await tables.Metadata.refresh(null);
			await goto('/protocols');
		} catch (error) {
			toasts.error(`Erreur lors de l'import du protocole distant: ${error}`);
		} finally {
			importing = false;
		}
	}}
>
	Ce lien pointe vers un protocole distant. Voulez-vous l'importer? Il se trouve à l'adresse
	suivante:

	{#if toImport}
		<HighlightHostname linkify url={toImport} />
	{/if}

	<section class="modal-import-loading">
		{#if importing}
			<p>Importation en cours...</p>
		{/if}
	</section>
</ModalConfirm>

<style>
	.modal-import-loading {
		display: flex;
		justify-content: center;
		align-items: center;
		margin-top: 3rem;
	}
</style>

<script>
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
		const protocol = page.url.searchParams.get('protocol');
		if (!protocol) return null;

		if (Boolean(protocol.startsWith('https:') && URL.canParse(protocol))) {
			return new URL(protocol);
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
	oncancel={() => {
		page.url.searchParams.delete('protocol');
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

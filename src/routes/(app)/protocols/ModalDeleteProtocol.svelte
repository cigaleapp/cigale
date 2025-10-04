<script>
	import { openTransaction, tables } from '$lib/idb.svelte.js';
	import ModalConfirm from '$lib/ModalConfirm.svelte';
	import { isNamespacedToProtocol } from '$lib/schemas/metadata';
	import { toasts } from '$lib/toasts.svelte';

	/**
	 * @type {{ id: string, open?: () => void, ondelete?: () => void }}
	 */
	let { id, open = $bindable(), ondelete } = $props();

	/**
	 * Protocol we're confirming deletion for
	 */
	let removingProtocol = $derived(tables.Protocol.getFromState(id));
</script>

<ModalConfirm
	title="Êtes-vous sûr·e?"
	key="modal_delete_protocol"
	bind:open
	cancel="Annuler"
	confirm="Oui, supprimer"
	onconfirm={async () => {
		await openTransaction(['Protocol', 'Metadata', 'MetadataOption'], {}, async (tx) => {
			if (!removingProtocol) return;

			tx.objectStore('Protocol').delete(removingProtocol.id);

			const toRemove = removingProtocol.metadata.filter(
				(id) => removingProtocol && isNamespacedToProtocol(removingProtocol.id, id)
			);

			const options = await tx.objectStore('MetadataOption').getAll();

			for (const metadata of toRemove) {
				tx.objectStore('Metadata').delete(metadata);
				options
					.filter((o) => o.id.startsWith(`${metadata}:`))
					.forEach((o) => tx.objectStore('MetadataOption').delete(o.id));
			}
		});
		toasts.success('Protocole supprimé');
		ondelete?.();
	}}
>
	Il est impossible de revenir en arrière après avoir supprimé un protocole.
</ModalConfirm>
<script>
	import { plural } from '$lib/i18n.js';
	import { openTransaction, tables } from '$lib/idb.svelte.js';
	import ModalConfirmDeletion from '$lib/ModalConfirmDeletion.svelte';
	import { isNamespacedToProtocol } from '$lib/schemas/metadata.js';
	import { getSetting, setSetting } from '$lib/settings.svelte.js';
	import { toasts } from '$lib/toasts.svelte.js';

	/**
	 * @type {{ id: string, open: (() => void) | undefined, ondelete?: () => void }}
	 */
	let { id, open = $bindable(), ondelete } = $props();

	/**
	 * Protocol we're confirming deletion for
	 */
	let removingProtocol = $derived(tables.Protocol.getFromState(id));

	/**
	 * Sessions that use this protocol
	 */
	const sessionsUsingProtocol = $derived(tables.Session.state.filter((s) => s.protocol === id));
</script>

<ModalConfirmDeletion
	button={null}
	bind:open
	key="modal_delete_protocol"
	typeToConfirm={removingProtocol?.name}
	consequences={[
		plural(sessionsUsingProtocol.length, [
			"L'impossibilité d'utiliser 1 session",
			"L'impossibilité d'utiliser # sessions"
		])
	]}
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

		const autoUpdates = await getSetting('autoUpdateProtocols');
		delete autoUpdates[id];
		await setSetting('autoUpdateProtocols', autoUpdates);

		toasts.success('Protocole supprimé');
		ondelete?.();
	}}
/>

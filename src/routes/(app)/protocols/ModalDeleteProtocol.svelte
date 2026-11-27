<script lang="ts">
	import { plural } from '#lib/i18n.js';
	import { databaseHandle, tables } from '#lib/idb.svelte.js';
	import ModalConfirmDeletion from '#lib/ModalConfirmDeletion.svelte';
	import { dependentProtocols } from '#lib/protocols/dependencies.ts';
	import { uninstallProtocol } from '#lib/protocols/uninstall.ts';
	import { toasts } from '#lib/toasts.svelte.js';

	interface Props {
		id: string;
		open: (() => void) | undefined;
		ondelete?: () => void;
	}

	let { id, open = $bindable(), ondelete }: Props = $props();

	/**
	 * Protocol we're confirming deletion for
	 */
	let removingProtocol = $derived(tables.Protocol.getFromState(id));

	/**
	 * Sessions that use this protocol
	 */
	const sessionsUsingProtocol = $derived(
		tables.Session.state.filter((s) => [...protocolsUsingProtocol, id].includes(s.protocol))
	);

	/**
	 * Protocols that use this protocol
	 */
	let protocolsUsingProtocol = $state<string[]>([]);

	$effect(() => {
		if (!open || !removingProtocol) {
			protocolsUsingProtocol = [];
			return;
		}

		void (async () => {
			for (const dependant of await dependentProtocols(
				databaseHandle(),
				removingProtocol.id
			)) {
				protocolsUsingProtocol.push(dependant);
			}
		})();
	});
</script>

<ModalConfirmDeletion
	button={null}
	bind:open
	key="modal_delete_protocol"
	typeToConfirm={removingProtocol?.name}
	consequences={[
		...protocolsUsingProtocol.map(
			(id) => `La suppression du protocole ${tables.Protocol.getFromState(id)?.name ?? id}`
		),
		plural(sessionsUsingProtocol.length, [
			"L'impossibilité d'utiliser 1 session",
			"L'impossibilité d'utiliser # sessions",
		]),
	]}
	onconfirm={async () => {
		if (!removingProtocol) return;
		await uninstallProtocol(databaseHandle(), removingProtocol.id);
		toasts.success('Protocole supprimé');
		ondelete?.();
	}}
/>

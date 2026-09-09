<script lang="ts">
	import IconSendToPlatform from '~icons/ri/cloud-line';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import CompositeAvatar from '$lib/CompositeAvatar.svelte';
	import { tables } from '$lib/idb.svelte.js';
	import { sendNotification } from '$lib/notifications.js';
	import { uiState } from '$lib/uistate.svelte.js';

	import { exporter as uploader } from './platforms.svelte.js';

	interface Props {
		confirmExportIfMetadataErrors: () => Promise<boolean>;
	}

	const { confirmExportIfMetadataErrors }: Props = $props();

	async function upload() {
		if (!(await confirmExportIfMetadataErrors())) return

		if (!uploader.selectedProvider) return;
		if (!uploader.selectedAccount) return;

		const protocol = uiState.currentProtocol;
		const session = $state.snapshot(uiState.currentSession);
		if (!protocol) return;
		if (!session) return;

		uploader.starting();
		uploader.selectedAccount.armAbort(uploader.abortSignal);

		try {
			for await (const msg of uploader.selectedAccount.upload(protocol, session)) {
				switch (msg.message) {
					case 'session-id': {
						await tables.Session.morph(session.id, (session) => {
							session.remoteId = msg.remoteId;
							session.account = uploader.selectedAccountId;
						});
						break;
					}
					case 'progress': {
						uploader.notify?.(msg);
						break;
					}
				}
			}

			uploader.completed();
			void sendNotification(`Session envoyée à ${uploader.provider.displayName}`, {
				awayOnly: true,
			});
		} catch (e) {
			if (uploader.aborted) {
				uploader.canceled();
			} else {
				uploader.errored(e);
				void sendNotification(`Erreur d'envoi à ${uploader.provider.displayName}`, {
					awayOnly: true,
					body: uploader.error,
				});
			}
		}
	}
</script>

<ButtonSecondary disabled={!uploader.selectedAccount} loading onclick={upload}>
	{#snippet children({ loading })}
		{const avatar = $derived(uploader.avatar(uploader.selectedAccountId))}

		{#if loading}
			<!-- nothing -->
		{:else if avatar}
			<div class="avatar">
				<CompositeAvatar {...avatar} />
			</div>
		{:else}
			<IconSendToPlatform />
		{/if}

		{#if uploader.selectedProvider}
			Envoyer sur {uploader.selectedProvider.displayName}
		{:else}
			Envoyer
		{/if}
	{/snippet}
</ButtonSecondary>

<script lang="ts">
	import { fade } from 'svelte/transition';

	import IconViewExternal from '~icons/ri/arrow-right-up-box-line';
	import IconSyncDown from '~icons/ri/download-line';
	import IconUnlink from '~icons/ri/link-unlink-m';
	import { invalidate } from '$app/navigation';
	import Account from '$lib/Account.svelte';
	import { providers } from '$lib/accounts/registry.js';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonPrimary from '$lib/ButtonPrimary.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import Field from '$lib/Field.svelte';
	import { formatBytesSize, plural } from '$lib/i18n.js';
	import { databaseHandle, dependencyURI, tables } from '$lib/idb.svelte.js';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import InputSelectProtocol from '$lib/InputSelectProtocol.svelte';
	import Markdown from '$lib/Markdown.svelte';
	import ModalConfirmDeletion from '$lib/ModalConfirmDeletion.svelte';
	import { goto } from '$lib/paths.js';
	import SessionMetadataForm from '$lib/SessionMetadataForm.svelte';
	import { deleteSession, switchSession } from '$lib/sessions.js';
	import { toasts } from '$lib/toasts.svelte.js';
	import { uiState } from '$lib/uistate.svelte.js';
	import TopbarOpenSession from '$routes/(app)/TopbarOpenSession.svelte';

	const { data } = $props();
	let { protocol: protocolId, name } = $derived(data.session);
</script>

<TopbarOpenSession />

<main in:fade={{ duration: 100 }}>
	<h1>
		<InlineTextInput
			discreet
			label="Nom de la session"
			value={name}
			placeholder=""
			onblur={async (newName) => {
				if (newName === name) return;
				await tables.Session.update(data.session.id, 'name', newName);
				name = newName;
				invalidate(dependencyURI('Session', data.session.id));
			}}
		/>

		<section class="actions">
			<ButtonPrimary
				loading
				onclick={async () => {
					await new Promise(() => {});
					await switchSession(data.session.id);
					await goto(`/import/`);
				}}
			>
				Ouvrir
			</ButtonPrimary>
		</section>
	</h1>
	{#if uiState.currentProtocol && (data.session.account || data.session.remoteId)}
		{const account = tables.Account.getFromState(data.session.account ?? '')}
		{const provider = providers.get(account?.type ?? '')}
		{const acc = account ? provider?.fromDatabase(databaseHandle(), account) : undefined}
		{const externalUrl = acc?.sessionPage(uiState.currentProtocol, data.session)}

		<Field composite label="Session disponible sur {provider?.displayName ?? 'une plateforme'}">
			<section class="remote">
				<Account {account} />
				<div class="actions">
					<!-- 
					Case where externalUrl && !provider is impossible
					Because externalUrl needs acc which needs provider
					-->
					{#if externalUrl && provider}
						<ButtonSecondary
							onclick={() => {
								window.open(externalUrl, '_blank');
							}}
						>
							<IconViewExternal />
							Voir
						</ButtonSecondary>
					{/if}

					{#if account && provider?.capabilities.includes('sync')}
						<ButtonSecondary
							loading
							help="Synchroniser depuis {provider.displayName}"
							errorprefix="Impossible de synchroniser"
							onclicksuccess="Session synchronisée"
							onclick={async (_, { setText }) => {
								if (!acc) return;
								if (!account) return;
								const protocol = uiState.currentProtocol;
								const session = uiState.currentSession;
								if (!protocol) return;
								if (!session) return;
								for await (const msg of acc.sync(protocol, session)) {
									if (msg.message !== 'progress') continue;
									const withUnit =
										'unit' in msg && msg.unit === 'bytes'
											? (x: number) => formatBytesSize(x)
											: (x: number) => x.toString();

									setText(
										msg.total
											? `${msg.action} (${msg.done}/${withUnit(msg.total)})`
											: `${msg.action}…`
									);
								}
								await uiState.refreshSessionTables();
							}}
						>
							{#snippet children({ loading })}
								{#if !loading}
									<IconSyncDown />
								{/if}
								Sync.
							{/snippet}
						</ButtonSecondary>
					{/if}
					<ButtonSecondary
						danger
						loading
						help={provider
							? `Dé-lier de ${provider.displayName}`
							: 'Dé-lier de la plateforme en ligne'}
						onclick={async () => {
							await tables.Session.morph(data.session.id, (session) => {
								delete session.account;
								delete session.remoteId;
							});
							invalidate(dependencyURI('Session', data.session.id));
						}}
					>
						{#snippet children({ loading })}
							{#if !loading}
								<IconUnlink />
							{/if}
							Dé-lier
						{/snippet}
					</ButtonSecondary>
				</div>
			</section>
		</Field>
	{/if}

	<form
		onsubmit={(e) => {
			e.preventDefault();
		}}
	>
		<Field label="Description">
			<textarea
				value={data.session.description}
				onblur={async ({ target }) => {
					if (!(target instanceof HTMLTextAreaElement)) return;
					await tables.Session.update(data.session.id, 'description', target.value);
					invalidate(dependencyURI('Session', data.session.id));
				}}></textarea>
		</Field>

		<Field composite label="Protocole">
			<InputSelectProtocol
				testid="protocol"
				value={protocolId}
				onchange={async (newProtocolId) => {
					await tables.Session.update(data.session.id, 'protocol', newProtocolId);
					invalidate(dependencyURI('Session', data.session.id));
				}}
			/>
		</Field>
	</form>

	{#if !data.protocol}
		<section class="error">
			Protocole <code>{data.session.protocol}</code> introuvable.
		</section>
	{:else}
		<section class="protocol-description">
			<Markdown source={data.protocol.description} />
		</section>

		<h2>Métadonnées</h2>

		<SessionMetadataForm
			session={data.session}
			onmetadatachange={() => {
				invalidate(dependencyURI('Session', data.session.id));
			}}
		/>
	{/if}

	<div class="actions">
		<ButtonPrimary
			loading
			onclick={async () => {
				await switchSession(data.session.id);
				await goto(`/import/`);
			}}
		>
			Ouvrir la session
		</ButtonPrimary>
		<ModalConfirmDeletion
			key="modal_delete_session"
			typeToConfirm={name}
			consequences={[
				plural(data.counts.images, [
					'La suppression de 1 image',
					'La suppression de # images',
				]),
				plural(data.counts.observations, [
					'La suppression de 1 observation',
					'La suppression de # observations',
				]),
			]}
			onconfirm={async () => {
				await deleteSession(data.session.id);
				await goto('/sessions/').then(() => {
					toasts.success('Session supprimée.');
				});
			}}
		/>
	</div>

	<Field label="ID de la session">
		<code>{data.session.id}</code>
	</Field>
</main>

<style>
	main {
		margin: 0 auto;
		width: 100%;
		max-width: 800px;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	h1 {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.actions {
		font-weight: normal;
		font-size: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.remote {
		display: flex;
		gap: 1rem;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;

		.actions {
			flex-direction: row;
			flex-wrap: wrap;
		}
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	form.metadata {
		--metadata-list-gap: 3rem;
	}

	section.error {
		background-color: var(--bg-error);
		color: var(--fg-error);
		padding: 1rem;
		border-radius: 0.5rem;
		text-align: center;

		code {
			font-size: 0.8em;
		}
	}
</style>

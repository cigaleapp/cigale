<script lang="ts">
	import { dequal } from 'dequal';
	import { fade } from 'svelte/transition';

	import { invalidate } from '$app/navigation';
	import ButtonPrimary from '$lib/ButtonPrimary.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import Field from '$lib/Field.svelte';
	import { plural } from '$lib/i18n.js';
	import { databaseHandle, dependencyURI, tables } from '$lib/idb.svelte.js';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import InputSelectProtocol from '$lib/InputSelectProtocol.svelte';
	import { deleteMetadataValue, storeMetadataValue } from '$lib/metadata.js';
	import Metadata from '$lib/Metadata.svelte';
	import MetadataList from '$lib/MetadataList.svelte';
	import ModalConfirmDeletion from '$lib/ModalConfirmDeletion.svelte';
	import { goto } from '$lib/paths.js';
	import { deleteSession, switchSession } from '$lib/sessions.js';
	import { toasts } from '$lib/toasts.svelte.js';

	const { data } = $props();
	let sessionMetadata = $derived(data.sessionMetadata);
	let { protocol: protocolId, name } = $derived(data.session);
</script>

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
			<ModalConfirmDeletion
				key="modal_delete_session"
				typeToConfirm={name}
				consequences={[
					plural(data.counts.images, [
						'La suppression de 1 image',
						'La suppression de # images'
					]),
					plural(data.counts.observations, [
						'La suppression de 1 observation',
						'La suppression de # observations'
					])
				]}
				onconfirm={async () => {
					await deleteSession(data.session.id);
					toasts.success('Session supprimée.');
					await goto('/sessions');
				}}
			/>
			<ButtonSecondary
				onclick={async () => {
					await switchSession(data.session.id);
					await goto('/import');
				}}
			>
				Ouvrir
			</ButtonSecondary>
		</section>
	</h1>

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
				}}
			></textarea>
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
	{:else if sessionMetadata.length > 0}
		<h2>Métadonnées</h2>

		<form class="metadata" data-testid="session-metadata">
			<MetadataList>
				{#each sessionMetadata as { def, value } (def.id)}
					<Metadata
						options={data.sessionMetadataOptions[def.id]}
						definition={def}
						{value}
						onchange={async (v) => {
							console.log(v, value);
							if (dequal(v, value?.value)) return;

							if (v !== undefined) {
								await storeMetadataValue({
									db: databaseHandle(),
									manuallyModified: true,
									subjectId: data.session.id,
									metadataId: def.id,
									value: v
								});
							} else {
								await deleteMetadataValue({
									db: databaseHandle(),
									subjectId: data.session.id,
									metadataId: def.id
								});
							}
						}}
					/>
				{/each}
			</MetadataList>
		</form>
	{/if}

	<ButtonPrimary
		loading
		onclick={async () => {
			await switchSession(data.session.id);
			await goto(`/import`);
		}}
	>
		Ouvrir la session
	</ButtonPrimary>

	<Field label="ID de la session">
		<code>{data.session.id}</code>
	</Field>
</main>

<style>
	main {
		margin: 0 auto;
		width: 100%;
		max-width: 600px;
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

	h1 .actions {
		font-weight: normal;
		font-size: 1rem;
		display: flex;
		align-items: center;
		gap: 1rem;
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

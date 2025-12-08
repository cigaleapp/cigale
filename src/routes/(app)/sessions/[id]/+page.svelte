<script>
	import { fade } from 'svelte/transition';

	import IconExpand from '~icons/ri/expand-up-down-line';
	import { invalidate } from '$app/navigation';
	import ButtonPrimary from '$lib/ButtonPrimary.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import DropdownMenu from '$lib/DropdownMenu.svelte';
	import Field from '$lib/Field.svelte';
	import { databaseHandle, dependencyURI, tables } from '$lib/idb.svelte.js';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import { storeMetadataValue } from '$lib/metadata.js';
	import Metadata from '$lib/Metadata.svelte';
	import MetadataList from '$lib/MetadataList.svelte';
	import { goto } from '$lib/paths.js';
	import { deleteSession } from '$lib/sessions.js';
	import { uiState } from '$lib/state.svelte.js';
	import { toasts } from '$lib/toasts.svelte.js';

	const { data } = $props();
	let sessionMetadata = $derived(data.sessionMetadata);
	let { protocol: protocolId, name } = $derived(data.session);

	const protocol = $derived(protocolId ? tables.Protocol.getFromState(protocolId) : undefined);

	$effect(() => {
		invalidate(dependencyURI('Protocol', protocolId));
	});
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
			<!-- TODO confirm modal -->
			<ButtonSecondary
				danger
				loading
				onclick={async () => {
					await deleteSession(data.session.id);
					toasts.success('Session supprimée.');
					await goto('/sessions');
				}}
			>
				Supprimer
			</ButtonSecondary>
			<ButtonSecondary
				onclick={async () => {
					await uiState.setCurrentSessionId(data.session.id);
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
		<DropdownMenu
			items={[
				{
					protocol: null,
					key: '#manage',
					label: 'Gérer les protocoles',
					/** @returns {Promise<void>} */
					async onclick() {
						await goto('/protocols');
					}
				}
			]}
			selectableItems={tables.Protocol.state.map((p) => ({
				protocol: p,
				key: p.id,
				selected: protocolId === p.id,
				label: p.name,
				onclick() {
					protocolId = p.id;
				}
			}))}
		>
			{#snippet trigger(props)}
				<Field label="Protocole">
					<button class="trigger" {...props}>
						{#if protocol}
							{protocol.name}
						{:else}
							Sélectionner un protocole
						{/if}
						<IconExpand />
					</button>
				</Field>
			{/snippet}

			{#snippet item({ label })}
				<div>{label}</div>
			{/snippet}
		</DropdownMenu>
	</form>

	<h2>Métadonnées</h2>

	<form class="metadata">
		<MetadataList>
			{#each sessionMetadata as { def, value } (def.id)}
				<Metadata
					options={data.sessionMetadataOptions[def.id]}
					definition={def}
					{value}
					onchange={async () => {
						storeMetadataValue({
							db: databaseHandle(),
							subjectId: data.session.id,
							metadataId: def.id,
							value: value.value
						});
					}}
				/>
			{/each}
		</MetadataList>
	</form>

	<ButtonPrimary
		onclick={async () => {
			await uiState.setCurrentSessionId(data.session.id);
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
		gap: 4rem;
	}
</style>

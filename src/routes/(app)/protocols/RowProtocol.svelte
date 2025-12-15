<script lang="ts">
	import IconUpgrade from '~icons/ri/arrow-up-circle-line';
	import IconDelete from '~icons/ri/delete-bin-line';
	import IconEdit from '~icons/ri/pencil-line';
	import IconExport from '~icons/ri/share-forward-line';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonUpdateProtocol from '$lib/ButtonUpdateProtocol.svelte';
	import { databaseHandle } from '$lib/idb.svelte';
	import { goto, resolve } from '$lib/paths';
	import { exportProtocol } from '$lib/protocols';
	import { uiState } from '$lib/state.svelte';
	import { toasts } from '$lib/toasts.svelte';

	/** @type {import('$lib/database').Protocol & { ondelete: () => void }} */
	const { id, name, source, version, ondelete } = $props();
</script>

<li>
	<section class="text">
		<h3>
			<!-- {#if dirty}
				<UnsavedChangesIndicator
					help="Protocole modifié par rapport à la version publiée"
				/>
			{/if} -->
			{name}
		</h3>
		<small><code>{id}</code></small>
	</section>
	<section class="actions">
		<ButtonIcon
			dangerous
			help="Supprimer"
			disabled={id === uiState.currentProtocolId && uiState.processing.total > 0}
			onclick={() => {
				ondelete();
			}}
		>
			<IconDelete />
		</ButtonIcon>

		<ButtonIcon
			help="Modifier (beta)"
			onclick={() => goto('/(app)/protocols/[id]/infos', { id })}
		>
			<IconEdit />
		</ButtonIcon>

		<ButtonIcon
			help="Exporter"
			onclick={async () => {
				await exportProtocol(databaseHandle(), resolve('/'), id).catch((e) =>
					toasts.error(e)
				);
			}}
		>
			<IconExport />
		</ButtonIcon>

		{#if version && source}
			<ButtonUpdateProtocol compact {version} {source} {id} />
		{:else}
			<ButtonIcon
				crossout
				onclick={() => {}}
				help="Ce protocole ne supporte pas la vérification des mises à jour"
			>
				<IconUpgrade />
			</ButtonIcon>
		{/if}
	</section>
</li>

<style>
	li {
		display: flex;
		justify-content: space-between;
		width: 100%;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}
</style>

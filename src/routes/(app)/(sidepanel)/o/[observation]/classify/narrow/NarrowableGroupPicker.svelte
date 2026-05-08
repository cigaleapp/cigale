<script lang="ts">
	import DropdownMenu from '$lib/DropdownMenu.svelte';
	import {uiState} from '$lib/state.svelte.js';
	import {isNamespacedToProtocol} from '$lib/schemas/metadata.js';
	import {plural} from '$lib/i18n.js';
	import { tables } from '$lib/idb.svelte.js';
	import {compareBy} from '$lib/utils.js';
	import IconChoose from '~icons/ri/arrow-down-s-line';

	import IconSelected from '~icons/ri/check-line';
	const narrowableGroups = $derived(
		(uiState.currentProtocol?.metadataGroups.filter(group=>group.narrowable)??[]).map(
			group => ({
				...group,
				metadataCount: tables.Metadata.state.filter(metadata => isNamespacedToProtocol(uiState.currentProtocol?.id??"", metadata.id) && metadata.group === group.id).length
			})
		).toSorted(compareBy(group => group.metadataCount)).toReversed()
	)

	const narrowableGroup = $derived(
		uiState.currentProtocol?.metadataGroups.find(group=>group.id === uiState.currentSession?.fullscreenClassifier?.narrowableGroup)
	)
</script>

<DropdownMenu items={[{
	label: "Groupe de métadonnées",
	empty: "Ce protocole ne supporte pas la classification par élimination",
	items: narrowableGroups.map(group=>({
		type: "selectable",
		selected: group.id === narrowableGroup?.id,

		key: group.id,
	label: group.name,
	data: group,
	async onclick() {
		if (!uiState.currentSession) return;
		await tables.Session.update(uiState.currentSession.id, "fullscreenClassifier", {
			...uiState.currentSession.fullscreenClassifier,
			narrowableGroup: group.id,
		})
	}

	}))
}]} >
	{#snippet trigger(props)}
	<button {...props}>
		<div class="text">
			<span class="label">Éliminer avec</span>
			<span class="currently" class:empty={!narrowableGroup}>{narrowableGroup?.name ?? "Aucun"}</span>
		</div>
		<IconChoose />
	</button>
	{/snippet}
	{#snippet item( {metadataCount}, {label, key, selected})}
		<div class="item">
			<div class="name-and-selected">
				<div class="selected">
					{#if selected}
						<IconSelected />
					{/if}
				</div>
				<span>{label}</span>
			</div>
			<span class="count">
				{plural(metadataCount, ['# métadonnée', '# métadonnées'])}
			</span>
		</div>
	{/snippet}
</DropdownMenu>

<style>
	button {
		font-size: 1rem;
		display: flex;
		align-items: center;
		gap: 0.5em;


		.text {
			display: flex;
			flex-direction: column;
			align-items: flex-start;
		}

		.label
		 {
			font-size: 0.75em;
		 }

		.currently {
			font-size: 1.2em;
		}
	}

	.item {
		justify-content: space-between;
		gap: 2em;
		width: 100%;

	&, .name-and-selected {
		display: flex;
		align-items: center;
	}

	.name-and-selected {

		gap: 0.5em;
	}
		.selected {
			width: 1.5em;
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.count {
			color: var(--gay);
		}
	}
</style>

<script lang="ts">
	import IconSelect from '~icons/ri/arrow-down-s-line';
	import IconCheck from '~icons/ri/check-line';
	import IconSortAsc from '~icons/ri/sort-asc';
	import IconSortDesc from '~icons/ri/sort-desc';
	import { page } from '$app/state';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import DropdownMenu from '$lib/DropdownMenu.svelte';
	import { set, tables } from '$lib/idb.svelte';
	import {
		removeNamespaceFromMetadataId,
		type MetadataInferOptionsNeural
	} from '$lib/schemas/metadata';
	import {
		GROUP_FIELDS,
		GroupSettings,
		SORT_FIELDS,
		sortOrGroupFieldNeedsMetadata,
		SortSettings
	} from '$lib/schemas/sessions';
	import { uiState } from '$lib/state.svelte';
	import { entries, orEmpty } from '$lib/utils';

	interface Props {
		tab: 'crop' | 'classify' | 'import';
		models: (typeof MetadataInferOptionsNeural.infer)['neural'];
		currentModelIndex: number;
		setModel: (i: number) => Promise<void>;
	}

	const { tab, models, currentModelIndex, setModel }: Props = $props();

	const isOnTabItself = $derived.by(() => {
		switch (page.route.id) {
			case '/(app)/(sidepanel)/crop':
				return tab === 'crop';
			case '/(app)/(sidepanel)/classify':
				return tab === 'classify';
			case '/(app)/(sidepanel)/import':
				return tab === 'import';
			default:
				return false;
		}
	});

	function selectableModel(i: number, label: string) {
		return {
			data: { direction: null },
			key: i,
			label,
			selected: currentModelIndex === i,
			async onclick() {
				await setModel(i);
				if (isOnTabItself && currentModelIndex !== i) {
					window.location.reload();
				}
			}
		};
	}

	const sortableMetadata = $derived(tables.Metadata.state.filter((m) => m.sortable));
	const groupableMetadata = $derived(tables.Metadata.state.filter((m) => m.groupable));

	const currentSettings = $derived(
		uiState.currentSession
			? {
					sort: uiState.currentSession.sort[tab] ?? uiState.currentSession.sort.global,
					group: uiState.currentSession.group[tab] ?? uiState.currentSession.group.global
				}
			: undefined
	);

	const currentSettingsNeedsMetadata = $derived({
		group: currentSettings?.group && sortOrGroupFieldNeedsMetadata(currentSettings.group.field),
		sort: currentSettings?.sort && sortOrGroupFieldNeedsMetadata(currentSettings.sort.field)
	});

	async function setSettings<Task extends 'sort' | 'group'>(
		task: Task,
		settings: Partial<
			Task extends 'sort' ? typeof SortSettings.infer : typeof GroupSettings.infer
		>
	) {
		if (!uiState.currentSession) return;
		if (!currentSettings) return;

		const updated = {
			...currentSettings[task],
			...settings
		};

		if (sortOrGroupFieldNeedsMetadata(updated.field) && !updated.metadata) {
			console.warn('Not updating in DB yet, user needs to select metadata too');
			return;
		}

		if (task === 'sort') {
			const value = $state.snapshot({
				...uiState.currentSession.sort,
				[tab]: { direction: 'asc', ...updated }
			});

			await tables.Session.update(uiState.currentSession.id, 'sort', value);
		} else {
			const value = $state.snapshot({
				...uiState.currentSession.group,
				[tab]: { ...updated }
			});

			await tables.Session.update(uiState.currentSession.id, 'group', value);
		}
	}
</script>

<div class="inference">
	<DropdownMenu
		testid="{tab}-models"
		items={[
			{
				label: 'Trier par…',
				selectables: entries(SORT_FIELDS).map(([key, { label }]) => {
					const direction = currentSettings?.sort.direction ?? null;
					const field = currentSettings?.sort.field;
					const selected = field === key;

					return {
						data: { direction },
						key,
						label,
						selected,
						closeOnSelect: false,
						async onclick() {
							if (selected) {
								// Toggle direction
								await setSettings('sort', {
									direction: direction === 'asc' ? 'desc' : 'asc'
								});
							} else {
								await setSettings('sort', { field: key });
							}
						}
					};
				})
			},
			...orEmpty(currentSettingsNeedsMetadata.sort, {
				label: 'Métadonnée de tri',
				selectables: sortableMetadata.map((m) => ({
					data: { direction: null },
					key: m.id,
					label: m.label || removeNamespaceFromMetadataId(m.id),
					selected: currentSettings?.sort.metadata === m.id,
					closeOnSelect: false,
					async onclick() {
						await setSettings('sort', { metadata: m.id });
					}
				}))
			}),
			{
				label: 'Regrouper par…',
				selectables: entries(GROUP_FIELDS).map(([key, { label }]) => {
					const field = currentSettings?.group.field;
					const selected = field === key;

					return {
						data: { direction: null },
						key,
						label,
						selected,
						closeOnSelect: false,
						async onclick() {
							await setSettings('group', { field: key });
						}
					};
				})
			},
			...orEmpty(currentSettingsNeedsMetadata.group, {
				label: 'Métadonnée de regroupement',
				selectables: groupableMetadata.map((m) => ({
					data: { direction: null },
					key: m.id,
					label: m.label || removeNamespaceFromMetadataId(m.id),
					selected: currentSettings?.group.metadata === m.id,
					closeOnSelect: false,
					async onclick() {
						await setSettings('group', { metadata: m.id });
					}
				}))
			}),
			...orEmpty(uiState.currentProtocol && models.length > 0, {
				label: "Modèle d'inférence",
				selectables: [
					selectableModel(-1, 'Aucune inférence'),
					...models.map((model, i) => selectableModel(i, model.name ?? `Modèle ${i + 1}`))
				]
			})
		]}
	>
		{#snippet trigger(props)}
			<ButtonIcon help="" {...props}>
				<IconSelect />
			</ButtonIcon>
		{/snippet}
		{#snippet item({ direction }, { label, selected })}
			<div class="selected-model-indicator">
				{#if selected && direction === 'asc'}
					<IconSortDesc />
				{:else if selected && direction === 'desc'}
					<IconSortAsc />
				{:else if selected}
					<IconCheck />
				{/if}
			</div>
			{label}
		{/snippet}
	</DropdownMenu>
</div>

<style>
	.inference {
		color: var(--fg-warning);
		display: flex;
		align-items: center;
		font-size: 0.9em;
	}

	.selected-model-indicator {
		width: 1.5em;
		display: flex;
		justify-content: center;
		align-items: center;
	}
</style>

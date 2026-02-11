<script lang="ts">
	import IconSelect from '~icons/ri/arrow-down-s-line';
	import IconSubmenu from '~icons/ri/arrow-right-s-line';
	import IconCheck from '~icons/ri/check-line';
	import IconSortAsc from '~icons/ri/sort-asc';
	import IconSortDesc from '~icons/ri/sort-desc';
	import { page } from '$app/state';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import DropdownMenu from '$lib/DropdownMenu.svelte';
	import { tables } from '$lib/idb.svelte';
	import { metadataDefinitionComparator } from '$lib/protocols';
	import { namespaceOfMetadataId, removeNamespaceFromMetadataId } from '$lib/schemas/metadata';
	import type { NeuralInference } from '$lib/schemas/neural';
	import {
		GROUP_FIELDS,
		GROUPING_TOLERANCES,
		GroupSettings,
		SORT_FIELDS,
		sortOrGroupFieldNeedsMetadata,
		SortSettings
	} from '$lib/schemas/sessions';
	import { uiState } from '$lib/state.svelte';
	import { entries, orEmpty } from '$lib/utils';

	interface Props {
		tab: 'crop' | 'classify' | 'import';
		label: string;
		models: NeuralInference[];
		currentModelIndex: number;
		setModel: (_i: number) => Promise<void>;
	}

	const { tab, models, currentModelIndex, setModel, label }: Props = $props();

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
			type: 'selectable' as const,
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

	const compareMetadataDefs = $derived(
		metadataDefinitionComparator(uiState.currentProtocol ?? { metadataOrder: undefined })
	);

	const metadataOfProtocol = $derived(
		tables.Metadata.state
			.filter((m) => namespaceOfMetadataId(m.id) === uiState.currentProtocolId)
			.sort(compareMetadataDefs)
	);

	const sortableMetadata = $derived(metadataOfProtocol.filter((m) => m.sortable));
	const groupableMetadata = $derived(metadataOfProtocol.filter((m) => m.groupable));

	const currentSettings = $derived(
		uiState.currentSession
			? {
					sort: uiState.currentSession.sort[tab] ?? uiState.currentSession.sort.global,
					group: uiState.currentSession.group[tab] ?? uiState.currentSession.group.global
				}
			: undefined
	);

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

		if (sortOrGroupFieldNeedsMetadata(task, updated.field) && !updated.metadata) {
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
		testid="{tab}-settings"
		items={[
			{
				testid: `${tab}-settings-sort`,
				label: 'Trier par…',
				items: entries(SORT_FIELDS).map(([key, { label }]) => {
					const direction = currentSettings?.sort.direction ?? null;
					const field = currentSettings?.sort.field;
					const metadata = currentSettings?.sort.metadata;
					const selected = field === key;
					const needsMetadata = sortOrGroupFieldNeedsMetadata('sort', key);

					if (needsMetadata) {
						return {
							type: 'submenu',
							data: { direction: null },
							label,
							selected,
							submenu: {
								label: 'Métadonnée',
								testid: `${tab}-settings-sort-by-${key}-metadata`,
								empty: 'Le protocole ne définit aucune métadonnée triable.',
								items: sortableMetadata.map((m) => ({
									type: 'selectable',
									data: { direction },
									key: m.id,
									label: m.label || removeNamespaceFromMetadataId(m.id),
									selected: selected && metadata === m.id,
									closeOnSelect: false,
									async onclick() {
										if (selected && metadata === m.id) {
											await setSettings('sort', {
												direction: direction === 'asc' ? 'desc' : 'asc'
											});
										} else {
											await setSettings('sort', {
												metadata: m.id,
												field: key
											});
										}
									}
								}))
							}
						};
					}

					return {
						key,
						label,
						selected,
						data: { direction },
						type: 'selectable',
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
			{
				label: 'Regrouper par…',
				items: entries(GROUP_FIELDS).map(([key, { label }]) => {
					const field = currentSettings?.group.field;
					const metadata = currentSettings?.group.metadata;
					const selected = field === key;
					const needsMetadata = sortOrGroupFieldNeedsMetadata('group', key);

					if (needsMetadata) {
						return {
							type: 'submenu',
							data: { direction: null },
							label,
							selected,
							submenu: {
								label: 'Métadonnée',
								testid: `${tab}-settings-group-by-${key}-metadata`,
								empty: 'Le protocole ne définit aucune métadonnée groupable.',
								items: groupableMetadata.map((m) => ({
									type: 'selectable',
									data: { direction: null },
									key: m.id,
									label: m.label || removeNamespaceFromMetadataId(m.id),
									selected: selected && metadata === m.id,
									closeOnSelect: false,
									async onclick() {
										if (selected && metadata === m.id) {
											await setSettings('group', {
												field: 'none'
											});
										} else {
											await setSettings('group', {
												metadata: m.id,
												field: key
											});
										}
									}
								}))
							}
						};
					}

					return {
						type: 'selectable',
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
			...orEmpty(GROUP_FIELDS[currentSettings?.group.field ?? 'none'].needsTolerance, {
				label: 'Précision des groupes',
				testid: `${tab}-settings-group-tolerances`,
				items: entries(GROUPING_TOLERANCES)
					.filter(([, { affectedTypes }]) => {
						if (!currentSettings?.group.metadata) return false;
						const groupingByMetadata = tables.Metadata.getFromState(
							currentSettings.group.metadata
						);
						if (!groupingByMetadata) return false;
						return affectedTypes.includes(groupingByMetadata.type);
					})
					.map(([field, { options, label, help }]) => ({
						type: 'submenu' as const,
						data: { direction: null },
						label,
						submenu: {
							label: help,
							items: entries(options).map(([key, { scientific, casual }]) => ({
								type: 'selectable' as const,
								label: casual,
								data: { direction: null, icon: scientific },
								closeOnSelect: false,
								key: scientific,
								selected: currentSettings?.group.tolerances[field] === key,
								async onclick() {
									if (!currentSettings) return;
									await setSettings('group', {
										tolerances: {
											...currentSettings.group.tolerances,
											[field]: key
										}
									});
								}
							}))
						}
					}))
			}),
			...orEmpty(uiState.currentProtocol && models.length > 0, {
				label: "Modèle d'inférence",
				testid: `${tab}-settings-inference-model`,
				items: [
					selectableModel(-1, 'Aucune inférence'),
					...models.map((model, i) => selectableModel(i, model.name ?? `Modèle ${i + 1}`))
				]
			})
		]}
	>
		{#snippet trigger(props)}
			<ButtonIcon help={label} {...props}>
				<IconSelect />
			</ButtonIcon>
		{/snippet}
		{#snippet item({ direction, icon }, { label, selected, type })}
			<div class="icon">
				{#if selected && direction === 'asc'}
					<IconSortDesc />
				{:else if selected && direction === 'desc'}
					<IconSortAsc />
				{:else if selected}
					<IconCheck />
				{/if}
			</div>
			<div class="label">
				{#if icon}
					<code>{icon}</code>
				{/if}
				{label}
			</div>
			<div class="icon">
				{#if type === 'submenu'}
					<IconSubmenu />
				{/if}
			</div>
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

	.icon {
		width: 1.5em;
		display: flex;
		justify-content: center;
		align-items: center;
		color: var(--fg-primary);
	}

	.label code {
		display: inline-flex;
		font-size: 0.8em;
		width: 5ch;
	}

	.label {
		flex-grow: 1;
	}
</style>

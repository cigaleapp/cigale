<script lang="ts">
	import type { NeuralInference } from '$lib/schemas/neural';
	import type { Snippet } from 'svelte';

	import { scale } from 'svelte/transition';

	import IconSelect from '~icons/ri/arrow-down-s-line';
	import IconSubmenu from '~icons/ri/arrow-right-s-line';
	import IconCheck from '~icons/ri/check-line';
	import IconInferenceDisabled from '~icons/ri/forbid-2-line';
	import IconSortAsc from '~icons/ri/sort-asc';
	import IconSortDesc from '~icons/ri/sort-desc';
	import IconInferenceEnabled from '~icons/ri/sparkling-line';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import DropdownMenu from '$lib/DropdownMenu.svelte';
	import { tables } from '$lib/idb.svelte';
	import { metadataDefinitionComparator } from '$lib/protocols';
	import { namespaceOfMetadataId, removeNamespaceFromMetadataId } from '$lib/schemas/metadata';
	import {
		GROUP_FIELDS,
		GROUPING_TOLERANCES,
		GroupSettings,
		SORT_FIELDS,
		sortOrGroupFieldNeedsMetadata,
		SortSettings,
	} from '$lib/schemas/sessions';
	import { uiState } from '$lib/state.svelte';
	import { entries, orEmpty } from '$lib/utils';

	interface Props {
		tab: 'crop' | 'classify' | 'import';
		label: string;
		models: NeuralInference[];
		currentModelIndex: number;
		setModel: (_i: number) => Promise<void>;
		trigger?: Snippet<[{ help: string; onclick: () => void } & Record<string, unknown>]>;
	}

	const {
		tab,
		models,
		currentModelIndex,
		setModel,
		label,
		trigger: customTrigger,
	}: Props = $props();

	function selectableModel(i: number, label: string) {
		return {
			type: 'selectable' as const,
			data: { direction: null },
			key: i,
			label,
			selected: currentModelIndex === i,
			async onclick() {
				await setModel(i);
			},
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
					group: uiState.currentSession.group[tab] ?? uiState.currentSession.group.global,
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
			...settings,
		};

		if (sortOrGroupFieldNeedsMetadata(task, updated.field) && !updated.metadata) {
			console.warn('Not updating in DB yet, user needs to select metadata too');
			return;
		}

		if (task === 'sort') {
			const value = $state.snapshot({
				...uiState.currentSession.sort,
				[tab]: { direction: 'asc', ...updated },
			});

			await tables.Session.update(uiState.currentSession.id, 'sort', value);
		} else {
			const value = $state.snapshot({
				...uiState.currentSession.group,
				[tab]: { ...updated },
			});

			await tables.Session.update(uiState.currentSession.id, 'group', value);
		}
	}
</script>

<div class="inference">
	<DropdownMenu
		title={label}
		testid="{tab}-settings"
		items={[
			{
				testid: `${tab}-settings-sort`,
				label: 'Trier par…',
				items: entries(SORT_FIELDS).map(([key, { label }]) => {
					type Extras = {
						direction: 'asc' | 'desc' | null;
						neural?: boolean;
						icon?: string;
					};
					const direction = currentSettings?.sort.direction ?? null;
					const field = currentSettings?.sort.field;
					const metadata = currentSettings?.sort.metadata;
					const selected = field === key;
					const needsMetadata = sortOrGroupFieldNeedsMetadata('sort', key);

					if (needsMetadata) {
						return {
							type: 'submenu',
							data: { direction: null } as Extras,
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
												direction: direction === 'asc' ? 'desc' : 'asc',
											});
										} else {
											await setSettings('sort', {
												metadata: m.id,
												field: key,
											});
										}
									},
								})),
							},
						};
					}

					return {
						key,
						label,
						selected,
						data: { direction } as Extras,
						type: 'selectable',
						closeOnSelect: false,
						async onclick() {
							if (selected) {
								// Toggle direction
								await setSettings('sort', {
									direction: direction === 'asc' ? 'desc' : 'asc',
								});
							} else {
								await setSettings('sort', { field: key });
							}
						},
					};
				}),
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
												field: 'none',
											});
										} else {
											await setSettings('group', {
												metadata: m.id,
												field: key,
											});
										}
									},
								})),
							},
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
						},
					};
				}),
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
											[field]: key,
										},
									});
								},
							})),
						},
					})),
			}),
			...orEmpty(tab !== 'classify' && uiState.currentProtocol && models.length > 0, {
				label: "Modèle d'inférence",
				testid: `${tab}-settings-inference-model`,
				items: [
					selectableModel(-1, 'Aucune inférence'),
					...models.map((model, i) =>
						selectableModel(i, model.name ?? `Modèle ${i + 1}`)
					),
				],
			}),
			...orEmpty(
				tab === 'classify' &&
					uiState.currentProtocol &&
					uiState.allClassificationMetadata.length > 0,
				{
					label: "Modèle d'inférence",
					testid: `${tab}-settings-inference-model`,
					items: uiState.allClassificationMetadata.map((metadata) => {
						const metadataLabel =
							metadata.label || removeNamespaceFromMetadataId(metadata.id);
						const selectedModelIndex =
							uiState.selectedClassificationModels[metadata.id] ?? -1;
						const modelsForMetadata =
							uiState.allClassificationModels[metadata.id] ?? [];

						return {
							type: 'submenu' as const,
							data: { direction: null, neural: true },
							label: metadataLabel,
							selected: selectedModelIndex !== -1,
							submenu: {
								label: metadataLabel,
								testid: `${tab}-settings-inference-model-${metadata.id}`,
								empty: 'Le protocole ne définit aucun modèle pour cette métadonnée.',
								items: [
									{
										type: 'selectable' as const,
										data: { direction: null },
										key: `${metadata.id}:none`,
										label: 'Aucune inférence',
										selected: selectedModelIndex === -1,
										closeOnSelect: false,
										async onclick() {
											await uiState.setClassificationModelSelection(
												metadata.id,
												-1
											);
										},
									},
									...modelsForMetadata.map((model, i) => ({
										type: 'selectable' as const,
										data: { direction: null },
										key: `${metadata.id}:${i}`,
										label: model.name ?? `Modèle ${i + 1}`,
										selected: selectedModelIndex === i,
										closeOnSelect: false,
										async onclick() {
											await uiState.setClassificationModelSelection(
												metadata.id,
												i
											);
										},
									})),
								],
							},
						};
					}),
				}
			),
		]}
	>
		{#snippet trigger(props)}
			{#if customTrigger}
				{@render customTrigger({ label, ...props })}
			{:else}
				<ButtonIcon help={label} {...props}>
					<IconSelect />
				</ButtonIcon>
			{/if}
		{/snippet}
		{#snippet item({ direction, icon, neural }, { label, selected, type })}
			{#snippet stateIcon(Icon: null | import('svelte').Component, extraClasses = '')}
				<div in:scale={{ start: 0.75, duration: 200 }} class="icon {extraClasses}">
					{#if Icon}<Icon />{/if}
				</div>
			{/snippet}

			{#if selected && direction === 'asc'}
				{@render stateIcon(IconSortAsc)}
			{:else if selected && direction === 'desc'}
				{@render stateIcon(IconSortDesc)}
			{:else if selected && neural}
				{@render stateIcon(IconInferenceEnabled, 'neural-on')}
			{:else if !selected && neural}
				{@render stateIcon(IconInferenceDisabled, 'neural-off')}
			{:else if selected}
				{@render stateIcon(IconCheck)}
			{:else}
				{@render stateIcon(null)}
			{/if}
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

		&.neural-on {
			color: var(--fg-primary);
		}

		&.neural-off {
			color: var(--gay);
		}
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

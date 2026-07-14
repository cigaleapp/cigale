<script lang="ts">
	import type { PropsForSubcomponent } from './MetadataCombobox.svelte';

	import Icon from '@iconify/svelte';
	import { Debounced } from 'runed';
	import { SvelteMap } from 'svelte/reactivity';
	import { fade } from 'svelte/transition';

	import IconDescription from '~icons/ri/align-left';
	import IconCollapse from '~icons/ri/arrow-down-s-line';
	import IconClose from '~icons/ri/arrow-left-s-line';
	import IconExpand from '~icons/ri/arrow-up-s-line';
	import IconDebug from '~icons/ri/bug-2-line';
	import IconSelected from '~icons/ri/check-line';
	import IconClear from '~icons/ri/close-line';
	import IconImage from '~icons/ri/image-line';
	import IconSearch from '~icons/ri/search-line';
	import * as DB from '$lib/database.js';
	import DebugOnly from '$lib/DebugOnly.svelte';

	import ButtonIcon from './ButtonIcon.svelte';
	import ButtonPrimary from './ButtonPrimary.svelte';
	import { cascadeLabels } from './cascades.js';
	import ConfidencePercentage from './ConfidencePercentage.svelte';
	import { errorMessage } from './i18n.js';
	import { databaseHandle } from './idb.svelte.js';
	import LearnMoreLink from './LearnMoreLink.svelte';
	import LoadingScreen from './LoadingScreen.svelte';
	import Markdown from './Markdown.svelte';
	import { resolveMetadataImport } from './metadata/namespacing.js';
	import { serializeMetadataValue } from './metadata/serializing.js';
	import { metadataIdOfOption, metadataOption } from './metadata/storage.js';
	import MetadataCascadesTable from './MetadataCascadesTable.svelte';
	import OverflowableText from './OverflowableText.svelte';
	import { scrollfader } from './scrollfader.js';
	import { makeSearcher } from './search.js';
	import { isDebugMode } from './settings.svelte.js';
	import { uiState } from './state.svelte.js';
	import TabbedView from './TabbedView.svelte';
	import {
		compareBy,
		corsfixIfLocalhost,
		nonnull,
		readableOn,
		safeJSONParse,
		switchConditions,
	} from './utils.js';

	let {
		focuser = $bindable(),
		value,
		onValueChange,
		alternatives,
		multiple,
		confidences,
		metadata: definition,
		optionIsDisabled,
		sorter,
		options: preloadedOptions,
		enumOptionsExtraContent,
	}: PropsForSubcomponent = $props();

	// Perf hit if too much
	const usePreloadedOptions = $derived((preloadedOptions ?? []).length <= 100);

	const initially = $derived(
		(multiple ? [value, ...(alternatives ?? [])] : [value]).filter(nonnull)
	);

	let selected = $derived(initially);

	$effect(() => {
		if (!open) {
			selected = initially;
		}
	});

	let query = $state('');
	const debouncedQuery = new Debounced(() => query, 500);

	let open = $state(false);

	/** The selected option part takes the whole screen */
	let expanded = $state(false);

	const optionsByKey = new SvelteMap<string, DB.MetadataEnumVariant>();

	function openModal() {
		dialogElement?.showModal();
		open = true;
	}

	let dialogElement = $state<HTMLDialogElement>();

	const confidenceOf = $derived((key: string) => confidences?.[serializeMetadataValue(key)]);

	$effect(() => {
		focuser = () => {
			openModal();
		};
	});

	// eslint-disable-next-line no-unused-vars
	let searcher = $state<(query: string) => AsyncIterable<DB.MetadataEnumVariant>>();
	let searcherError = $state('');
	$effect(() => {
		if (!open) return;
		if (searcher) return;

		void makeSearcher({
			db: databaseHandle(),
			tables: DB.Tables,
			table: 'MetadataOption',
			max: 30,
			filter: (id) =>
				metadataIdOfOption(uiState.currentProtocol!, id) ===
				resolveMetadataImport(uiState.currentProtocol!, definition.id),
		})
			.then((result) => {
				searcher = result;
			})
			.catch((error) => {
				searcherError = errorMessage(error, 'Impossible de préparer la recherche');
			});
	});

	let selectedOptions = $state<DB.MetadataEnumVariant[]>();
	let selectedOptionsError = $state('');
	$effect(() => {
		(async () => {
			// eslint-disable-next-line svelte/prefer-svelte-reactivity
			const seen = new Set<string>();
			let resolved: DB.MetadataEnumVariant[] = [];

			if (usePreloadedOptions) {
				for (const opt of preloadedOptions ?? []) {
					if (seen.has(opt.key)) continue;
					resolved.push(opt);
					seen.add(opt.key);
					optionsByKey.set(opt.key, opt);
				}
			}

			if (value && !seen.has(value)) {
				const valueOption = await metadataOption(databaseHandle(), definition.id, value);

				if (valueOption) {
					optionsByKey.set(value, valueOption);
					seen.add(value);
					resolved.push(valueOption);
				}
			}

			const bestSuggestions = Object.entries(confidences ?? {})
				.sort(compareBy(([, score]) => -score))
				.slice(0, 100)
				.map(([key]) => safeJSONParse(key)?.toString() ?? key.toString());

			for (const key of bestSuggestions) {
				if (seen.has(key)) continue;
				const opt = await metadataOption(databaseHandle(), definition.id, key);

				if (opt) {
					const object = DB.Tables.MetadataOption.assert(opt);
					resolved.push(object);
					optionsByKey.set(object.key, object);
					seen.add(key);
				}
			}

			return resolved;
		})()
			.then((result) => {
				selectedOptions = result;
			})
			.catch((error) => {
				selectedOptionsError = errorMessage(
					error,
					'Impossible de récupérer les options sélectionnées'
				);
			});
	});

	let highlight = $state('');

	const shown = $derived(optionsByKey.get(highlight || selected.at(0) || ''));
	let resetSuggestionsScroll = $state<() => void>();
	let focusSearchBar = $state<() => void>();
</script>

<!-- XXX: the .underscored class disables the dashes bottom border that MetadataInput adds -->
<div class="searchbox underscored">
	<button
		class:empty={!value}
		onclick={() => {
			openModal();
		}}
	>
		{#if value}
			{optionsByKey.get(value)?.label ?? value?.toString() ?? '<?>'}
		{:else}
			Aucun·e
		{/if}
	</button>
</div>

<dialog
	bind:this={dialogElement}
	pw-testid="metadata-combobox-viewport"
	closedby="none"
	class:expand-selected={expanded}
	onclose={() => {
		open = false;
		query = '';
	}}
>
	<header>
		<ButtonIcon
			tight
			help="Annuler"
			onclick={() => {
				dialogElement?.close();
			}}
		>
			<IconClose />
		</ButtonIcon>
		<search>
			<IconSearch />
			<input
				type="text"
				bind:value={query}
				placeholder="Chercher…"
				{@attach (node) => {
					focusSearchBar = () => {
						node.focus();
					};
				}}
				oninput={() => {
					resetSuggestionsScroll();
				}}
			/>
		</search>
		<div class="actions">
			{#if query}
				<ButtonIcon
					help="Effacer la recherche"
					onclick={() => {
						query = '';
					}}
				>
					<IconClear />
				</ButtonIcon>
			{/if}
			<ButtonPrimary
				tight
				loading
				onclick={async () => {
					await onValueChange(selected[0], selected);
					dialogElement?.close();
				}}
			>
				{#snippet children({ loading })}
					{#if loading}
						Sauvegarde…
					{:else}
						OK
					{/if}
				{/snippet}
			</ButtonPrimary>
		</div>
	</header>
	<LoadingScreen
		loading={!searcher || !selectedOptions}
		failure={searcherError || selectedOptionsError}
		empty={switchConditions({
			'Aucune option sélectionnée': !debouncedQuery.current && !selectedOptions?.length,
		})}
	>
		<section
			class="suggestions"
			{@attach (node) => {
				resetSuggestionsScroll = () => {
					node.scrollTo({
						top: 0,
					});
				};
			}}
		>
			{#snippet suggestion(option: DB.MetadataEnumVariant)}
				{const { images, label, key, icon, color } = $derived(option)}
				{const disabled = $derived(optionIsDisabled(option))}
				{const image = $derived(images?.at(0))}
				{const confidence = $derived(confidenceOf(key))}

				<button
					class="suggestion"
					aria-selected={selected.includes(key)}
					{disabled}
					onclick={async () => {
						optionsByKey.set(key, option);
						if (selected.includes(key)) {
							selected = selected.filter((s) => s !== key);
						} else if (multiple) {
							selected = [key, ...selected];
						} else {
							selected = [key];
						}
					}}
				>
					<div
						class="image"
						style:background-color={color}
						style:color={color ? readableOn(color) : undefined}
					>
						<div class="selected-overlay">
							<div class="icon">
								<IconSelected />
							</div>
						</div>
						{#if image}
							<img src={corsfixIfLocalhost(image)} />
						{:else if icon}
							<Icon {icon} />
						{/if}
					</div>
					<div class="label">
						<OverflowableText text={label} />
						{#if disabled}
							<div class="disabled-why">
								<DebugOnly inline data={key} />
								{typeof disabled === 'string' ? disabled : 'Désactivé'}
							</div>
						{:else}
							<DebugOnly data={key} />
						{/if}
					</div>

					<div class="confidence">
						{#if confidence !== undefined}
							<ConfidencePercentage no-fallback value={confidence} />
						{/if}
					</div>

					{#if enumOptionsExtraContent}
						<div class="extra-content">
							{@render enumOptionsExtraContent({
								option,
								disabled: optionIsDisabled?.(option) ?? false,
								selected: selected.includes(key),
								confidence,
							})}
						</div>
					{/if}
				</button>
			{/snippet}

			{#if debouncedQuery.current && searcher}
				{#await Array.fromAsync(searcher(debouncedQuery.current)) then results}
					{#each results as result (result.key)}
						{@render suggestion(result)}
					{:else}
						<LoadingScreen empty="Aucun résultat" />
					{/each}
				{:catch error}
					<LoadingScreen failure={errorMessage(error)} />
				{/await}
			{:else}
				{#each (selectedOptions ?? []).toSorted(sorter) as option (option.key)}
					{@render suggestion(option)}
				{/each}
				<!-- If we're using pre-loaded options, we're guaranteed to have the complete list displayed -->
				{#if !usePreloadedOptions}
					<button
						class="suggestion"
						onclick={() => {
							focusSearchBar?.();
						}}
					>
						<div class="image empty">🫥</div>
						<div class="label">
							Pas trouvé?<br />
							<small>Essayes la barre de recherche</small>
						</div>
					</button>
				{/if}
			{/if}
		</section>
		<section class="selected" in:fade={{ duration: 200 }}>
			{#if shown}
				{const { images = [], label, description, learnMore, key } = $derived(shown)}

				<TabbedView
					swipeable
					aria-label="Description et images de l'option sélectionnée"
					initially={images.length ? 'image_0' : 'details'}
					tabs={[
						{ key: 'debug', name: 'Debug', scrollable: true, hidden: !isDebugMode() },
						{ key: 'details', name: 'Détails', scrollable: true, rerender: key },
						...images.map((_, i) => ({
							key: `image_${i}` as const,
							name: `Image ${i + 1}`,
							rerender: key,
						})),
					]}
				>
					{#snippet tab(attrs, key, { shown })}
						<button
							class="tab-icon"
							{...attrs}
							onclick={() => {
								if (key === 'details' && shown) {
									expanded = !expanded;
									return;
								}

								attrs.onclick?.();
							}}
						>
							{#if key === 'debug'}
								<IconDebug />
							{:else if key === 'details'}
								<IconDescription />

								<div class="subicon">
									{#if expanded}
										<IconCollapse />
									{:else}
										<IconExpand />
									{/if}
								</div>
							{:else}
								<IconImage />
							{/if}
						</button>
					{/snippet}

					{#snippet content(key)}
						{#if key === 'debug'}
							<DebugOnly
								data={{
									selected,
									multiple,
									value,
									alternatives,
									loaded: Array.from(optionsByKey.keys()),
									confidences: Object.entries(confidences ?? {})
										.sort(compareBy(([, confidence]) => -confidence))
										.map(([key, val]) => `${key} @ ${val}`),
								}}
							/>
						{:else if key === 'details'}
							<div class="details" {@attach scrollfader}>
								{#if description}
									<Markdown source={description} />
								{:else}
									<p class="empty">
										<em>Aucune description pour {label}.</em>
									</p>
								{/if}
								{#if learnMore}
									<LearnMoreLink href={learnMore} />
								{/if}
								{#await cascadeLabels( { protocolId: uiState.currentProtocolId, db: databaseHandle(), option: shown } ) then cascades}
									<MetadataCascadesTable explain compact {cascades} />
								{/await}
							</div>
						{:else}
							{const i = Number.parseInt(key.replace(/^image_/, ''))}
							{const image = images[i]}
							{#if image}
								<img src={corsfixIfLocalhost(image)} />
							{/if}
						{/if}
					{/snippet}
				</TabbedView>
			{:else}
				<LoadingScreen empty="Aucune option sélectionée" />
			{/if}
		</section>
	</LoadingScreen>
</dialog>

<style>
	.searchbox button {
		min-width: 12ch;
		max-width: 40dvw;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 1em;
		text-align: left;
		background: var(--bg2-neutral);
		border-radius: var(--corner-radius);
		padding: 0.5em 0.75em;

		&.empty {
			color: var(--gay);
		}

		&:hover,
		&:focus-visible {
			background: var(--gray);
		}
	}

	dialog {
		display: flex;
		flex-direction: column;
		background: var(--bg-neutral);
		/* Default browser stylesheets limit the height & width */
		max-width: unset;
		max-height: unset;
		pointer-events: none;
		padding: 0;
		width: 100lvw;
		height: 100lvh;
		border: none;
		transition:
			opacity,
			transform 0.2s;

		grid-template-rows: max-content 1fr 1fr;

		&.expand-selected {
			grid-template-rows: 0px 0px 1fr;
		}
	}

	.expand-selected :is(dialog > *:not(.selected)) {
		max-height: 0;
		overflow: hidden;
		padding-block: 0;
		border: none;
	}

	header,
	section.suggestions {
		transition: max-height 200ms;
	}

	dialog[open] {
		opacity: 1;
		pointer-events: auto;
		transform: scale(1);
	}

	dialog:not([open]) {
		opacity: 0;
		pointer-events: none;
		transform: scale(0.95);
	}

	header {
		padding: 0.75em;
		border-bottom: 1px solid var(--gray);
		display: grid;
		gap: 0.5em;
		grid-template-columns: max-content auto max-content;
	}

	search {
		min-width: 0;
	}

	search,
	header .actions {
		display: flex;
		align-items: center;
		gap: 1em;
	}

	.suggestions {
		overflow: auto;
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		border-bottom: 1px solid var(--gray);
		max-height: 50lvh;
		padding: 1em;
	}

	.suggestion {
		display: grid;
		--h: 3rem;
		height: var(--h);
		gap: 1rem;
		align-items: center;
		text-align: left;
		font-size: 0.95rem;

		grid-template-columns: max-content auto max-content;
		&:has(.extra-content) {
			grid-template-columns: max-content auto max-content max-content;
		}

		&[disabled] {
			opacity: 0.5;
		}

		.label {
			font-size: 1.1em;
		}

		.image {
			display: flex;
			justify-content: center;
			align-items: center;
			font-size: 1.2rem;
			height: calc(0.9 * var(--h));
			width: calc(0.9 * var(--h));
			border-radius: var(--corner-radius);
			overflow: hidden;
			border: 1px solid transparent;
			transition: border-color 100ms;
		}

		.image.empty {
			border-color: var(--gray);
		}

		&[aria-selected='true'] .image {
			border-color: var(--bg-primary);
		}

		&[aria-selected='false'] .image:not(:has(img)):not(.emoji) {
			border-color: var(--gay);
		}

		.image {
			position: relative;

			.selected-overlay {
				position: absolute;
				inset: 0;
				background: color-mix(var(--bg-primary-translucent) 75%, transparent);
				color: var(--fg-neutral);
				font-size: 1.2em;

				&,
				.icon {
					display: flex;
					justify-content: center;
					align-items: center;
				}

				& {
					opacity: 0;
					transition: opacity 100ms;
				}

				.icon {
					scale: 0.5;
					opacity: 0;
					transition:
						opacity 100ms,
						scale 250ms;
				}
			}
		}

		&[aria-selected='true'] .selected-overlay {
			opacity: 1;

			.icon {
				opacity: 1;
				scale: 1;
			}
		}

		img {
			height: 100%;
			width: 100%;
			object-fit: cover;
		}
	}

	.expand-selected section.selected {
		max-height: 100lvh;
	}

	section.selected {
		max-height: 50lvh;
		width: 100lvw;
		flex-grow: 1;
		display: flex;
		overflow: hidden;
		flex-direction: column;
		background: var(--bg-neutral);
		z-index: 10;

		transition: max-height 200ms;

		.details {
			padding: 1em;
			display: flex;
			flex-direction: column;
			gap: 1.75em;
		}

		.empty {
			color: var(--gay);
		}

		.image {
			max-height: 25lvh;
		}

		img {
			object-fit: contain;
			width: 100%;
			height: 100%;
			background: black;
		}

		.tab-icon {
			font-size: 1.2rem;
			color: currentColor;

			&,
			.subicon {
				display: flex;
				justify-content: center;
				align-items: center;
			}

			.subicon {
				font-size: 1rem;
			}
		}
	}
</style>

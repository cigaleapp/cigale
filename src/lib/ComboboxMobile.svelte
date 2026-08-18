<script lang="ts" generics="I extends Item, V extends Item['key']">
	import type { Item, SubcomponentProps } from './Combobox.svelte';

	import Icon from '@iconify/svelte';
	import { uniqBy } from 'es-toolkit';
	import { Debounced } from 'runed';
	import { fade } from 'svelte/transition';

	import IconClose from '~icons/ri/arrow-left-s-line';
	import IconSelected from '~icons/ri/check-line';
	import IconClear from '~icons/ri/close-line';
	import IconSearch from '~icons/ri/search-line';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonPrimary from '$lib/ButtonPrimary.svelte';
	import ConfidencePercentage from '$lib/ConfidencePercentage.svelte';
	import DebugOnly from '$lib/DebugOnly.svelte';
	import { errorMessage } from '$lib/i18n';
	import LoadingScreen from '$lib/LoadingScreen.svelte';
	import { corsfixIfLocalhost, readableOn, switchConditions } from '$lib/utils';

	let {
		initially,
		suggestions,
		multiple,
		onValueChange,
		searcher,
		searcherError,
		loadingItems,
		usingPreloadedItems,
		itemsByKey,
		loadItemsError: selectedItemsError,
		sorter,
		itemExtraContent,
		open = $bindable(false),
		id,
		focuser = $bindable(),
		details,
	}: SubcomponentProps<I, V> = $props();

	const initialKeys = $derived(initially.map((i) => i.key));

	let selected = $derived(initialKeys);

	$effect(() => {
		if (!open) {
			selected = initialKeys;
		}
	});

	let query = $state('');
	const debouncedQuery = new Debounced(() => query, 500);

	/** The selected option part takes the whole screen */
	let expanded = $state(false);

	function openModal() {
		dialogElement?.showModal();
		open = true;
	}

	let dialogElement = $state<HTMLDialogElement>();

	$effect(() => {
		focuser = () => {
			openModal();
		};
	});

	const shown = $derived(itemsByKey.get(selected.at(0) || ''));
	let resetSuggestionsScroll = $state<() => void>();
	let focusSearchBar = $state<() => void>();

	const empty = $derived(initially.length === 0);

	let temporaryNewItem = $state<I>();

	const firstValue = $derived(initially.at(0));

	const items = $derived(
		uniqBy(
			[...(temporaryNewItem ? [temporaryNewItem] : []), ...(initially ?? []), ...suggestions],
			(i) => i.key
		)
	);

	function handleClick(key: V) {
		if (selected.includes(key)) {
			selected = selected.filter((s) => s !== key);
		} else if (multiple) {
			selected = [key, ...selected];
		} else {
			selected = [key];
		}
	}
</script>

<!-- XXX: the .underscored class disables the dashes bottom border that MetadataInput adds -->
<div class="searchbox underscored">
	<button
		{id}
		class:empty
		onclick={() => {
			openModal();
		}}
	>
		{#if firstValue}
			{firstValue?.label ?? '<?>'}
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
			onclick={(e) => {
				// Useful the entire dialog is inside a <button> with its onclick
				// set to open the combobox, as in that case it'd close then
				// open again immediately lol
				e.stopPropagation();
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
					resetSuggestionsScroll?.();
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
					temporaryNewItem = undefined;
					await onValueChange?.(selected[0], selected);
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
		loading={switchConditions({
			'Préparation de la recherche…': !searcher,
			'Chargement des options…': loadingItems,
		})}
		failure={searcherError || selectedItemsError}
		empty={switchConditions({
			'Aucune option sélectionnée':
				!debouncedQuery.current && !initially?.length && !suggestions?.length,
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
			{#snippet suggestion(item: I)}
				{const { label, key, icon, color, disabled, thumbnail, confidence } =
					$derived(item)}

				<button
					class="suggestion"
					aria-selected={selected.includes(key)}
					disabled={Boolean(disabled)}
					onclick={async () => handleClick(key)}
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
						{#if thumbnail}
							<img src={corsfixIfLocalhost(thumbnail)} />
						{:else if icon}
							<Icon {icon} />
						{/if}
					</div>
					<div class="label">
						<!-- <OverflowableText text={label} /> -->
						<p>{label}</p>
						{#if disabled}
							<div class="disabled-why">
								<DebugOnly inline data={key} />
								{typeof disabled === 'string' ? disabled : 'Désactivé'}
							</div>
						{:else}
							<DebugOnly inline data={key} />
						{/if}
					</div>

					<div class="confidence">
						{#if confidence !== undefined}
							<ConfidencePercentage no-fallback value={confidence} />
						{/if}
					</div>

					{#if itemExtraContent}
						<div class="extra-content">
							{@render itemExtraContent(item, {
								selected: selected.includes(key),
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
				{#each items.toSorted(sorter) as option (option.key)}
					{@render suggestion(option)}
				{/each}
				<!-- If we're using pre-loaded options, we're guaranteed to have the complete list displayed -->
				{#if usingPreloadedItems.length > 0}
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
				{@render details(shown, {
					allItems: [...itemsByKey.values()],
					expanded,
					expand(newExpanded) {
						expanded = newExpanded;
					},
					select(item) {
						itemsByKey.set(item.key, item);
						temporaryNewItem = item;
						handleClick(item.key);
					},
					deselect(key) {
						handleClick(key)
					}
				})}
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
		background: var(--metadata-combobox-trigger-bg, var(--bg2-neutral));
		border-radius: var(--corner-radius);
		padding: var(--metadata-combobox-trigger-padding, 0.5em 0.75em);

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

	@media (prefers-reduced-motion: no-preference) {
		dialog > *:not(.selected) {
			transition:
				max-height,
				min-height 100ms,
				opacity 200ms;
		}

		.expand-selected section.selected {
			max-height: 100lvh;
		}
	}

	.expand-selected :is(dialog > *:not(.selected)) {
		max-height: 0;
		min-height: 0;
		overflow: hidden;
		padding-block: 0;
		border: none;
		opacity: 0;
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

		/* for animation when details are expanded */
		max-height: 5rem;
		min-height: 3.5rem;
	}

	search {
		min-width: 0;
		overflow: hidden;
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
		min-height: 50lvh;
		padding: 1em;
	}

	.suggestion {
		display: grid;
		--h: var(--combobox-option-height, 3rem);
		height: var(--h);
		gap: 1rem;
		align-items: center;
		text-align: left;
		font-size: 0.95rem;
		max-width: 100dvw;

		grid-template-columns: max-content 1fr max-content;
		&:has(.extra-content) {
			grid-template-columns: max-content 4fr max-content 1fr;
		}

		&[disabled] {
			opacity: 0.5;
		}

		.label {
			/*display: flex;
			flex-direction: column;
			flex-shrink: 1;*/
			font-size: 1.1em;
		}

		.image {
			display: flex;
			justify-content: center;
			align-items: center;
			font-size: 1.2rem;
			--size: var(--combobox-option-image-size, calc(min(33dvw, 10dvh, 0.9 * var(--h))));
			height: var(--size);
			width: var(--size);
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

	section.selected {
		max-height: 50lvh;
		width: 100lvw;
		height: 100%;
	}
</style>

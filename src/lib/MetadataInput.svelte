<script lang="ts">
	import Icon from '@iconify/svelte';
	import { ArkErrors, type } from 'arktype';
	import { convert } from 'convert';
	import * as dates from 'date-fns';
	import { fade } from 'svelte/transition';

	import IconIncrement from '~icons/ri/add-line';
	import IconCheck from '~icons/ri/check-line';
	import IconError from '~icons/ri/error-warning-fill';
	import IconDecrement from '~icons/ri/subtract-line';
	import * as idb from '$lib/idb.svelte.js';

	import ButtonIcon from './ButtonIcon.svelte';
	import ButtonInk from './ButtonInk.svelte';
	import { generateId, type Metadata, type MetadataEnumVariant } from './database.js';
	import DropdownMenu from './DropdownMenu.svelte';
	import FilePreview from './FilePreview.svelte';
	import { promptForFiles } from './files.js';
	import { formatBytesSize } from './i18n.js';
	import InputRange from './InputRange.svelte';
	import LoadingText, { Loading } from './LoadingText.svelte';
	import MetadataTypeswitch from './metadata/MetadataTypeswitch.svelte';
	import MetadataCombobox from './MetadataCombobox.svelte';
	import { sendNotification } from './notifications.js';
	import OverflowableText from './OverflowableText.svelte';
	import RadioButtons from './RadioButtons.svelte';
	import type { MetadataFile, RuntimeValue } from './schemas/metadata.js';
	import { availableUnitsFor, findUnit, NumericUnit } from './schemas/units.js';
	import { uiState } from './state.svelte.js';
	import Switch from './Switch.svelte';
	import { toasts } from './toasts.svelte.js';
	import { tooltip } from './tooltips.js';
	import {
		compareBy,
		gradientedColor,
		mapValues,
		pick,
		readableOn,
		round,
		safeJSONParse
	} from './utils.js';
	import WorldLocationCombobox from './WorldLocationCombobox.svelte';

	interface Props {
		definition: Metadata;
		value: undefined | RuntimeValue;
		unit: typeof NumericUnit.infer | undefined;
		onblur: (
			// eslint-disable-next-line no-unused-vars
			value: undefined | RuntimeValue,
			// eslint-disable-next-line no-unused-vars
			unit?: typeof NumericUnit.infer | undefined
		) => void;
		validationErrors: ArkErrors | undefined;
		id: string;
		disabled?: boolean;
		options?: MetadataEnumVariant[];
		confidences?: Record<string, number>;
		isCompactEnum?: boolean;
	}

	let {
		value,
		unit: valueUnit = $bindable(),
		confidences = {},
		validationErrors,
		id,
		disabled,
		definition,
		options = [],
		isCompactEnum = false,
		onblur
	}: Props = $props();

	let savingFile = $state(false);

	/**
	 * Used to allow temporarily changing the value shown on the input
	 * without triggering a database save
	 * Used (for now) only for syncing the value of the range input with the text input, without saving on every change of the range input
	 */
	let temporaryValue: undefined | RuntimeValue = $derived(value);

	let windowIsFocused = $state(true);
	$effect(() => {
		window.onfocus = () => {
			windowIsFocused = true;
		};
		window.onblur = () => {
			windowIsFocused = false;
		};
	});

	const selectedUnit = $derived.by(() => {
		if (!('unit' in definition)) return;
		if (!definition.unit) return;

		const u = findUnit(valueUnit ?? definition.unit);
		if (!u) return;

		return {
			names: u.names,
			symbols: 'symbols' in u ? u.symbols : []
		};
	});
</script>

<div
	class="metadata-input"
	data-type={definition.type}
	data-metadata-id={definition.id}
	class:compact-enum={isCompactEnum}
	class:has-validation-errors={Boolean(validationErrors)}
>
	<!-- XXX: Is not reactive without an explicit {#key}, idk why -->
	{#key value}
		<MetadataTypeswitch {definition} {value}>
			{#snippet enum_(value)}
				{#if isCompactEnum}
					<RadioButtons
						value={value?.toString()}
						onchange={(v) => onblur(v)}
						cards={options.every((opt) => opt.icon || opt.color)}
						options={options
							.toSorted(compareBy(({ index }) => index))
							.map((opt) =>
								pick(opt, 'key', 'label', 'icon', 'color', 'description')
							)}
					>
						{#snippet children({ label, icon, color, description })}
							<div class="label">
								<div class="first-line">
									{#if icon || color}
										<div
											class="icon"
											style:background-color={color}
											style:color={color ? readableOn(color) : undefined}
										>
											{#if icon}
												<Icon {icon} />
											{/if}
										</div>
									{/if}
									{label}
								</div>
								{#if description}
									<p class="subtext">{description}</p>
								{/if}
							</div>
						{/snippet}
					</RadioButtons>
				{:else}
					<MetadataCombobox
						{id}
						{options}
						{confidences}
						metadata={definition}
						type="single"
						disabled={disabled ?? false}
						value={safeJSONParse(value?.toString())?.toString() ?? value}
						onValueChange={onblur}
					/>
				{/if}
			{/snippet}
			{#snippet boolean(value)}
				<div class="boolean-switch">
					<Switch value={value ?? false} onchange={onblur} />
					{#if value}
						Oui
					{:else if value === false}
						Non
					{/if}
				</div>
			{/snippet}
			{#snippet string(value)}
				<input
					type="text"
					{value}
					{id}
					{disabled}
					onblur={(e) => onblur(e.currentTarget.value)}
				/>
			{/snippet}
			{#snippet numeric(val, { range: intervalInBaseUnit, unit: baseUnit })}
				{@const interval = intervalInBaseUnit
					? mapValues(pick(intervalInBaseUnit, 'min', 'max'), (v) =>
							valueUnit && v !== undefined
								? Number(convert(v, baseUnit).to(valueUnit))
								: v
						)
					: undefined}
				<div class="underscored">
					<input
						{id}
						{disabled}
						type="text"
						inputmode="numeric"
						{...interval}
						onblur={({ currentTarget }) => {
							if (!(currentTarget instanceof HTMLInputElement)) return;
							const newValue = currentTarget.value;
							if (!newValue) {
								onblur(undefined);
								return;
							}

							let parsedValue: number | undefined =
								definition.type === 'integer'
									? Number.parseInt(newValue, 10)
									: Number.parseFloat(newValue);

							if (Number.isNaN(parsedValue)) {
								parsedValue = undefined;
							}

							onblur(parsedValue, selectedUnit?.names[0]);
						}}
						value={temporaryValue ?? val?.toString() ?? ''}
					/>
				</div>

				{#if baseUnit}
					<DropdownMenu
						items={[
							{
								label: 'Unité',
								items: availableUnitsFor(baseUnit).map((u) => {
									const unitNames = (uu: typeof u) =>
										new Set([...uu.names, ...uu.symbols]);

									const unitName = u.names[0] || u.symbols[0];

									return {
										data: u,
										key: u.symbols[0] || u.names[0],
										type: 'selectable',
										label: unitName,
										selected: Boolean(
											selectedUnit &&
											!unitNames(u).isDisjointFrom(unitNames(selectedUnit))
										),
										onclick() {
											if (val === undefined) return;
											const converted = convert(
												val,
												valueUnit ?? baseUnit
											).to(unitName);
											onblur(converted, unitName);
											valueUnit = unitName;
										}
									};
								})
							}
						]}
					>
						{#snippet trigger(props)}
							<ButtonIcon help="Utiliser une autre unité" {...props}>
								{selectedUnit?.symbols[0] ?? selectedUnit?.names[0] ?? ''}
							</ButtonIcon>
						{/snippet}

						{#snippet item({ names, symbols }, { selected })}
							<div class="unit">
								<span class="symbol">{symbols.at(0) ?? ''}</span>
								<span class="name">{names[0]}</span>
								<div class="icon">
									{#if selected}
										<IconCheck />
									{/if}
								</div>
							</div>
						{/snippet}
					</DropdownMenu>
				{/if}

				{#if interval?.min !== undefined && interval?.max !== undefined}
					<div class="range-input">
						<InputRange
							min={interval.min}
							max={interval.max}
							granularity={definition.type === 'integer' ? 1 : 1e-6}
							ticks={1}
							value={val}
							onvalue={(v) => {
								temporaryValue = v;
							}}
							onblur={() => {
								onblur(temporaryValue, valueUnit);
							}}
						/>
					</div>
				{/if}

				<div class="increment-decrement-buttons">
					<button
						class="decrement"
						aria-label="Décrémenter"
						onclick={() => {
							if (value !== undefined && typeof value !== 'number') return;
							onblur(round((value ?? 0) - 1, 5), valueUnit);
						}}
					>
						<IconDecrement />
					</button>
					<button
						class="increment"
						aria-label="Incrémenter"
						onclick={() => {
							if (value !== undefined && typeof value !== 'number') return;
							onblur(round((value ?? 0) + 1, 5), valueUnit);
						}}
					>
						<IconIncrement />
					</button>
				</div>
			{/snippet}
			{#snippet date(value)}
				<!-- TODO use bits-ui datepicker -->
				<input
					type="date"
					{id}
					{disabled}
					value={value === undefined ? undefined : dates.format(value, 'yyyy-MM-dd')}
					onblur={({ currentTarget }) => {
						const newValue = currentTarget.value;

						if (newValue === undefined) {
							onblur(undefined);
							return undefined;
						}

						const parsed = dates.parse(newValue, 'yyyy-MM-dd', new Date());
						onblur(parsed);
						return newValue;
					}}
				/>
			{/snippet}
			{#snippet location(value)}
				<WorldLocationCombobox value={value as RuntimeValue<'location'>} {onblur} />
			{/snippet}
			{#snippet file(currentFileId)}
				{@const { accept, size } = definition as typeof MetadataFile.infer}
				<div class="file-input">
					{#await idb.get('MetadataValueFile', currentFileId ?? '')}
						<div class="current">
							<code class="size">
								<LoadingText value={Loading} mask={formatBytesSize(100e3)} />
							</code>
							<div class="name">
								<LoadingText value={Loading} />
							</div>
							<div class="actions"></div>
						</div>
						<div class="preview">
							<FilePreview file={undefined} />
						</div>
					{:then fileObject}
						<div class="current">
							{#if fileObject}
								<code
									class="size"
									use:tooltip={size.maximum
										? `La taille maximale est de ${formatBytesSize(size.maximum)}`
										: undefined}
									style:color={size.maximum !== undefined
										? fileObject.size > size.maximum
											? 'var(--fg-error)'
											: gradientedColor(
													fileObject.size / size.maximum,
													'fg-success',
													'fg-warning'
												)
										: undefined}
								>
									{formatBytesSize(fileObject.size)}
								</code>
								<span class="name">
									<OverflowableText text={fileObject.filename} />
								</span>
							{:else}
								<code
									class="size"
									class:infinite={size.maximum === undefined}
									use:tooltip={size.maximum
										? `La taille maximale est de ${formatBytesSize(size.maximum)}`
										: 'Aucune limite de taille'}
								>
									{#if size.maximum}
										&lt;{formatBytesSize(size.maximum, 'narrow')}
									{:else}
										<span>∞</span>
									{/if}
								</code>
								<div class="name empty">Aucun fichier</div>
							{/if}

							<div class="actions">
								<ButtonInk
									onclick={async () => {
										const [file] = await promptForFiles({ accept });

										const savingStart = performance.now();
										savingFile = true;

										if (fileObject) {
											await idb.drop('MetadataValueFile', fileObject.id);
										}

										if (!file) {
											savingFile = false;
											onblur(undefined);
											return;
										}

										if (!uiState.currentSessionId) {
											toasts.error(
												"Aucune session active. Impossible d'enregistrer le fichier."
											);
											savingFile = false;
											return;
										}

										const id = await idb.set('MetadataValueFile', {
											id: generateId('MetadataValueFile'),
											sessionId: uiState.currentSessionId,
											size: file.size,
											contentType: file.type,
											filename: file.name,
											bytes: await file.arrayBuffer(),
											lastModifiedAt: new Date(
												file.lastModified || Date.now()
											).toISOString()
										});

										const timeElapsed = performance.now() - savingStart;

										if (
											(!windowIsFocused && timeElapsed > 2_000) ||
											timeElapsed > 5_000
										) {
											sendNotification(`${file.name} enregistré`, {
												body: 'Le fichier a été enregistré avec succès'
											});
										}

										savingFile = false;
										onblur(id);
									}}
								>
									{#if savingFile}
										Chargement…
									{:else if fileObject}
										Modifier
									{:else}
										Ajouter
									{/if}
								</ButtonInk>
							</div>
						</div>
						{#if fileObject}
							{@const file = new File([fileObject.bytes], fileObject.filename, {
								type: fileObject.contentType,
								lastModified: new Date(fileObject.lastModifiedAt).getTime()
							})}
							<div class="preview" in:fade>
								<FilePreview {file} />
							</div>
						{/if}
					{/await}
				</div>
			{/snippet}
			{#snippet boundingbox()}
				<div class="unrepresentable" use:tooltip={JSON.stringify(value, null, 2)}>
					<IconError />
					<p>Irreprésentable</p>
				</div>
			{/snippet}
			{#snippet error()}
				<div
					class="unrepresentable"
					use:tooltip={`${JSON.stringify(value, null, 2)} n'est pas une valeur valide de type ${type}`}
				>
					<IconError />
					<p>Mismatch</p>
				</div>
			{/snippet}
		</MetadataTypeswitch>
	{/key}
</div>

<style>
	input {
		font-size: 1.1em;
		font-weight: bold;
		border: none;
	}

	.metadata-input.compact-enum {
		width: 100%;
	}

	.metadata-input.compact-enum .label {
		gap: 0.75em;
		margin-left: 0.25em;

		&:not(:has(.subtext)) {
			display: inline-flex;
			align-items: center;
		}

		.first-line {
			display: flex;
			align-items: center;
			gap: 0.5em;
			flex-wrap: nowrap;
		}

		.icon {
			border-radius: 50%;
			font-size: 1.2em;
			display: flex;
			align-items: center;
			height: 0.9em;
			width: 0.9em;
		}

		.subtext {
			margin: 0;
			margin-top: 0.25em;
			font-size: 0.9em;
			color: var(--gay);
		}
	}

	.metadata-input:not(
		:is([data-type='boolean'], [data-type='file'], [data-type='boundingbox'], .compact-enum)
	) {
		display: flex;
		align-items: center;

		&:not(:has(.underscored)) {
			border-bottom: 2px dashed var(--fg-neutral);

			&:focus-within {
				border-bottom-style: solid;
			}

			&.has-validation-errors {
				border-color: var(--fg-error);
			}
		}
	}

	.metadata-input:has(.range-input) {
		.range-input {
			width: 12ch;
			margin-left: 1em;
			display: flex;
			align-items: center;
		}

		.underscored input {
			width: 8ch;
		}

		/* .increment, .decrement {
			display: none;
		} */
	}

	.unit {
		display: grid;
		grid-template-columns: 5ch 1fr 2em;

		.icon {
			display: flex;
			align-items: center;
			justify-content: end;
		}
	}

	.increment-decrement-buttons {
		display: flex;
		gap: 0.25em;
		margin-left: 0.5em;
		align-items: center;
	}

	.metadata-input:has(.underscored) {
		.underscored {
			display: flex;
			align-items: center;
			border-bottom: 2px dashed var(--fg-neutral);
		}

		&:focus-within .underscored {
			border-bottom-style: solid;
		}

		&.has-validation-errors .underscored {
			border-color: var(--fg-error);
		}

		&.has-validation-errors .range-input {
			--track-fill: var(--fg-error);
		}
	}

	.unrepresentable {
		display: flex;
		align-items: center;
		gap: 0.5em;
		color: var(--fg-error);
	}

	.boolean-switch {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.metadata-input[data-type='file'] {
		flex-grow: 1;
		width: 100%;
	}

	.file-input {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 0.5em;

		.current {
			display: flex;
			gap: 1em;
			align-items: center;
		}

		.size {
			font-size: 0.8em;
			/* "000" + " " + "kB" */
			width: calc(3ch + 1ch + 2ch);
		}

		.size.infinite {
			text-align: center;

			span {
				font-weight: 100;
				font-size: 2em;
			}
		}

		.name.empty {
			color: var(--gay);
		}

		.name {
			display: flex;
			align-items: center;
			line-height: 1.2;
			vertical-align: middle;
		}

		.actions {
			margin-left: auto;
		}

		.preview {
			height: 25vh;
		}
	}
</style>

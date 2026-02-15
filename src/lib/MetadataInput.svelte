<script lang="ts">
	import Icon from '@iconify/svelte';
	import * as dates from 'date-fns';
	import { fade } from 'svelte/transition';

	import IconIncrement from '~icons/ri/add-line';
	import IconError from '~icons/ri/error-warning-fill';
	import IconDecrement from '~icons/ri/subtract-line';
	import * as idb from '$lib/idb.svelte.js';

	import ButtonInk from './ButtonInk.svelte';
	import { generateId, type Metadata, type MetadataEnumVariant } from './database.js';
	import FilePreview from './FilePreview.svelte';
	import { promptForFiles } from './files.js';
	import { formatBytesSize } from './i18n.js';
	import LoadingText, { Loading } from './LoadingText.svelte';
	import MetadataTypeswitch from './metadata/MetadataTypeswitch.svelte';
	import MetadataCombobox from './MetadataCombobox.svelte';
	import { sendNotification } from './notifications.js';
	import OverflowableText from './OverflowableText.svelte';
	import RadioButtons from './RadioButtons.svelte';
	import type { MetadataFile, RuntimeValue } from './schemas/metadata.js';
	import { uiState } from './state.svelte.js';
	import Switch from './Switch.svelte';
	import { toasts } from './toasts.svelte.js';
	import { tooltip } from './tooltips.js';
	import { compareBy, gradientedColor, pick, readableOn, round, safeJSONParse } from './utils.js';
	import WorldLocationCombobox from './WorldLocationCombobox.svelte';

	interface Props {
		definition: Metadata;
		value: undefined | RuntimeValue;
		// eslint-disable-next-line no-unused-vars
		onblur: (value: undefined | RuntimeValue) => void;
		id: string;
		disabled?: boolean;
		options?: MetadataEnumVariant[];
		confidences?: Record<string, number>;
		isCompactEnum?: boolean;
	}

	const {
		value,
		confidences = {},
		id,
		disabled,
		definition,
		options = [],
		isCompactEnum = false,
		onblur
	}: Props = $props();

	let savingFile = $state(false);

	const { type } = $derived(definition);

	let windowIsFocused = $state(true);
	$effect(() => {
		window.onfocus = () => {
			windowIsFocused = true;
		};
		window.onblur = () => {
			windowIsFocused = false;
		};
	});
</script>

<div
	class="metadata-input"
	data-type={type}
	data-metadata-id={definition.id}
	class:compact-enum={isCompactEnum}
>
	<!-- XXX: Is not reactive without an explicit {#key}, idk why -->
	{#key value}
		<MetadataTypeswitch {type} {value}>
			{#snippet enum_(value)}
				{#if isCompactEnum}
					<RadioButtons
						value={value?.toString()}
						onchange={onblur}
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
						type="single"
						disabled={disabled ?? false}
						value={safeJSONParse(value?.toString())?.toString() ?? value}
						onValueChange={(val: string) => onblur(val)}
					/>
				{/if}
			{/snippet}
			{#snippet boolean(value)}
				<div class="boolean-switch">
					<Switch
						value={value ?? false}
						onchange={(newValue) => {
							onblur(newValue);
						}}
					/>
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
			{#snippet numeric(val)}
				<input
					{id}
					{disabled}
					type="text"
					inputmode="numeric"
					onblur={({ currentTarget }) => {
						if (!(currentTarget instanceof HTMLInputElement)) return;
						const newValue = currentTarget.value;
						if (!newValue) {
							onblur(undefined);
							return;
						}

						/** @type {number|undefined} */
						let parsedValue =
							type === 'integer'
								? Number.parseInt(newValue, 10)
								: Number.parseFloat(newValue);

						if (Number.isNaN(parsedValue)) {
							parsedValue = undefined;
						}

						onblur(parsedValue);
					}}
					value={val?.toString() ?? ''}
				/>
				<button
					class="decrement"
					aria-label="Décrémenter"
					onclick={() => {
						if (typeof value !== 'number') return;
						onblur(round((value ?? 0) - 1, 5));
					}}
				>
					<IconDecrement />
				</button>
				<button
					class="increment"
					aria-label="Incrémenter"
					onclick={() => {
						if (typeof value !== 'number') return;
						onblur(round((value ?? 0) + 1, 5));
					}}
				>
					<IconIncrement />
				</button>
			{/snippet}
			{#snippet date(value)}
				<!-- TODO use bits-ui datepicker -->
				<input
					type="date"
					{id}
					{disabled}
					onblur={() => onblur(value)}
					bind:value={
						() => {
							if (value === undefined) return undefined;
							return dates.format(value, 'yyyy-MM-dd');
						},
						(newValue) => {
							if (newValue === undefined) {
								onblur(undefined);
								return undefined;
							}
							onblur(dates.parse(newValue, 'yyyy-MM-dd', new Date()));
							return newValue;
						}
					}
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
										? fileObject.file.size > size.maximum
											? 'var(--fg-error)'
											: gradientedColor(
													fileObject.file.size / size.maximum,
													'fg-success',
													'fg-warning'
												)
										: undefined}
								>
									{formatBytesSize(fileObject.file.size)}
								</code>
								<span class="name">
									<OverflowableText text={fileObject.file.name} />
								</span>
							{:else}
								<code
									class="size"
									use:tooltip={size.maximum
										? `La taille maximale est de ${formatBytesSize(size.maximum)}`
										: 'Aucune limite de taille'}
								>
									{#if size.maximum}
										&lt;{formatBytesSize(size.maximum, 'narrow')}
									{:else}
										∞
									{/if}
								</code>
								<div class="name empty">Aucun fichier</div>
							{/if}

							<div class="actions">
								<ButtonInk
									onclick={async () => {
										const [file] = await promptForFiles({
											accept
										});

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
											file
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
							<div class="preview" in:fade>
								<FilePreview file={fileObject.file} />
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
		border-bottom: 2px dashed var(--fg-neutral);
		display: flex;
		align-items: center;

		&:focus-within {
			border-bottom-style: solid;
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

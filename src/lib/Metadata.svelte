<script>
	import IconCheck from '~icons/ph/check';
	import IconMerged from '~icons/ph/stack';
	import IconTechnical from '~icons/ph/wrench';
	import IconClear from '~icons/ph/x';
	import ConfidencePercentage from './ConfidencePercentage.svelte';
	import { isType } from './metadata';
	import MetadataInput from './MetadataInput.svelte';
	import { getSettings } from './settings.svelte';
	import { tooltip } from './tooltips';
	import { safeJSONParse } from './utils';

	/**
	 * @typedef {object} Props
	 * @property {import('./database').Metadata} definition
	 * @property {undefined | import('./database').MetadataValue} value
	 * @property {boolean} [merged] the value is the result of the merge of multiple metadata values
	 * @property {(value: undefined | import('./metadata').RuntimeValue) => void} [onchange]
	 */

	/** @type {Props} */
	let { value, merged, definition, onchange = () => {} } = $props();

	const _id = $props.id();
</script>

<div class="metadata">
	<section class="first-line">
		<label for={_id}>
			{#if definition.label}
				{definition.label}
			{:else}
				<div class="technical-indicator" use:tooltip={'Métadonnée technique'}>
					<IconTechnical />
				</div>
				<code>
					{definition.id}
				</code>
			{/if}
		</label>
		<div class="value">
			<MetadataInput
				id={_id}
				{definition}
				value={value?.value}
				onblur={onchange}
				{merged}
				confidences={Object.fromEntries([
					...Object.entries(value?.alternatives ?? {}).map(([key, value]) => [
						safeJSONParse(key)?.toString(),
						value
					]),
					[safeJSONParse(value?.value)?.toString(), value?.confidence]
				])}
			/>
			{#if value?.confidence}
				<ConfidencePercentage value={value.confidence} />
			{/if}
			{#if merged}
				<div
					class="merged-indicator"
					use:tooltip={'Valeur issue de la fusion de plusieurs valeurs différentes. Modifier cette valeur pour modifier toutes les valeurs de la sélection'}
				>
					<IconMerged />
				</div>
			{/if}
			<button
				class="clear"
				use:tooltip={'Supprimer cette valeur'}
				disabled={!value}
				onclick={() => {
					if (!value) return;
					value = undefined;
					onchange(undefined);
				}}
			>
				<IconClear />
			</button>
		</div>
	</section>
	{#if value && Object.keys(value.alternatives).length > 0}
		<section class="alternatives">
			<div class="title">Alternatives</div>
			<ul class="options">
				{#each Object.entries(value.alternatives).sort(([, a], [, b]) => b - a) as [jsonValue, confidence] (jsonValue)}
					{@const stringValue = safeJSONParse(jsonValue)?.toString()}
					{@const enumVariant = isType('enum', definition.type, stringValue)
						? definition.options?.find(({ key }) => key === stringValue)
						: undefined}
					<li>
						<div class="value" use:tooltip={enumVariant?.description}>
							{enumVariant?.label || stringValue}
						</div>
						<ConfidencePercentage value={confidence} />
						<button
							use:tooltip={'Sélectionner cette valeur'}
							onclick={() => {
								value = {
									value: JSON.parse(jsonValue),
									confidence,
									alternatives: value?.alternatives ?? {}
								};
								onchange(value?.value);
							}}
						>
							<IconCheck />
						</button>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
	{#if definition.description || definition.learnMore}
		<section class="learnmore">
			{#if definition.description}
				<p>{definition.description}</p>
			{/if}
			{#if definition.learnMore}
				<a href={definition.learnMore} target="_blank">En savoir plus</a>
			{/if}
		</section>
	{/if}
	{#if getSettings().showTechnicalMetadata}
		<pre>{JSON.stringify({ id: definition.id, value }, null, 2)}</pre>
	{/if}
</div>

<style>
	.metadata {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
	}
	.first-line {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1em;
	}
	.value {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}
	button {
		border: none;
		background: none;
		cursor: pointer;
	}
	.metadata:not(:hover):not(:focus-within) button,
	button:disabled {
		opacity: 0;
	}

	label {
		text-transform: uppercase;
		color: var(--gay);
		letter-spacing: 0.15em;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.alternatives {
		display: flex;
		justify-content: space-between;
	}

	.alternatives .title {
		text-transform: uppercase;
		color: var(--gray);
		letter-spacing: 0.2ch;
	}

	.alternatives ul {
		list-style: none;
		padding: 0;
		display: flex;
		flex-direction: column;
		justify-content: end;
		margin-top: 0.5em;
		gap: 0.25em;
	}
	.alternatives li {
		display: flex;
		align-items: center;
		justify-content: end;
		gap: 0.5em;
	}

	.merged-indicator {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--fg-primary);
	}
</style>

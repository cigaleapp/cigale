<script>
	import IconCheck from '~icons/ph/check';
	import IconClear from '~icons/ph/x';
	import MetadataInput from './MetadataInput.svelte';
	import { tooltip } from './tooltips';

	/**
	 * @typedef {object} Props
	 * @property {import('./database').Metadata} definition
	 * @property {undefined | import('./database').MetadataValue} value
	 * @property {boolean} [conflicted] the value is in conflict (selection has multiple differing values)
	 * @property {(value: undefined | import('./metadata').RuntimeValue) => void} [onchange]
	 */

	/** @type {Props} */
	let { value, conflicted, definition, onchange = () => {} } = $props();

	const _id = $props.id();
</script>

<div class="metadata">
	<section class="first-line">
		<label for={_id}>
			{definition.label || definition.id}
		</label>
		<div class="value">
			<MetadataInput id={_id} {definition} value={value?.value} onblur={onchange} {conflicted} />
			{@render confidenceDisplay(value?.confidence)}
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
				{#each Object.entries(value.alternatives).sort(([, a], [, b]) => b - a) as [stringifiedValue, confidence] (stringifiedValue)}
					<li>
						<div class="value">{stringifiedValue}</div>
						{@render confidenceDisplay(confidence)}
						<button
							use:tooltip={'Sélectionner cette valeur'}
							onclick={() => {
								value = {
									value: JSON.parse(stringifiedValue),
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
</div>

{#snippet confidenceDisplay(/** @type {number|undefined} */ confidence)}
	{#if confidence && confidence > 0 && confidence < 1}
		<code
			class="confidence"
			style:color="var(--fg-{confidence < 0.25
				? 'error'
				: confidence < 0.5
					? 'warning'
					: confidence < 0.95
						? 'neutral'
						: 'success'})"
		>
			{Math.round(confidence * 100)
				.toString()
				.padStart(3, '\u00a0')}%
		</code>
	{/if}
{/snippet}

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
	}
</style>

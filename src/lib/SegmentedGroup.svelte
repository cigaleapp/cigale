<!-- @component a segmented group (implemented as radio inputs) with animated transitions when the active value changes -->

<script lang="ts" generics="Key extends string">
	import type { Snippet } from 'svelte';

	import { tooltip } from './tooltips.js';

	type Props = {
		options: Key[];
		current: NoInfer<Key>;
		disabled?: (key: Key) => boolean | string;
	} & Record<`option_${NoInfer<Key>}`, Snippet<[{current: boolean}]>>;

	let {
		options,
		disabled: isDisabled = () => false,
		current = $bindable(),
		...snippets
	}: Props = $props();

	const id = $props.id();
</script>

<div class="segmented-group">
	{#each options as key (key)}
		{@const disabled = isDisabled(key)}
		{@const disabledWhy = typeof disabled === 'string' ? disabled : undefined}

		<label for="{id}-{key}" use:tooltip={disabledWhy}>
			<input
				disabled={Boolean(disabled)}
				type="radio"
				name={id}
				bind:group={current}
				value={key}
				id="{id}-{key}"
			/>
			{@render snippets[`option_${key}`]({ current: current === key })}
		</label>
	{/each}
</div>

<style>
	input {
		display: none;
	}

	.segmented-group {
		background-color: rgb(from var(--gray) r g b / 20%);
		border-radius: var(--corner-radius);
		padding: 0.25em 0.5em;
		gap: 0.5em;
		display: flex;
		align-items: center;
	}

	label {
		border-radius: var(--corner-radius);
		padding: 0.25em 0.5em;
		border: 1px solid transparent;

		&:has(input:checked) {
			background-color: var(--bg-neutral);
		}

		&:has(input:disabled) {
			color: var(--gay);
			cursor: not-allowed;
		}

		&:not(:has(input:checked)):not(:has(input:disabled)) {
			cursor: pointer;
			&:hover,
			&:focus-within {
				border-color: var(--gray);
			}
		}
	}
</style>

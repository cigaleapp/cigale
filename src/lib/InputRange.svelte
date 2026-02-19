<script lang="ts">
	import { range, unique } from './utils.js';

	interface Props {
		min: number;
		max: number;
		/** Maximum step size */
		granularity?: number | undefined;
		/** Number of steps to use. If not set, uses as much steps as granularity allows */
		stepcount?: number;
		/** Array of numbers to specify every tick's value, a single number of specify a number of ticks to uniformly distribute on the slider */
		ticks?: number | number[];
		value: number | undefined;
		disabled?: boolean;
		onblur?: () => void;
		// eslint-disable-next-line no-unused-vars
		onvalue?: (value: number) => void;
	}

	let {
		min,
		max,
		stepcount = Infinity,
		granularity,
		ticks = 0,
		value = $bindable(),
		disabled,
		onblur,
		onvalue
	}: Props = $props();

	const componentId = $props.id();

	const stepsize = $derived((max - min) / (stepcount - 1));
	const step = $derived(granularity ? Math.max(stepsize, granularity) : stepsize);
</script>

<input
	type="range"
	{min}
	{max}
	{step}
	{disabled}
	bind:value
	list="{componentId}-ticks"
	style:--slider-width="{value ? ((value - min) / (max - min)) * 100 : 0}%"
	{onblur}
	oninput={({ currentTarget }) => {
		onvalue?.(
			granularity && granularity >= 1
				? Number.parseInt(currentTarget.value, 10)
				: Number.parseFloat(currentTarget.value)
		);
	}}
/>

{#if Array.isArray(ticks) || ticks > 0}
	<datalist id="{componentId}-ticks">
		{#if Array.isArray(ticks)}
			{#each unique(ticks) as tick (tick)}
				<option value={tick}></option>
			{/each}
		{:else}
			{#each range(ticks) as i (i)}
				<option value={min + (i * (max - min)) / (ticks - 1)}></option>
			{/each}
		{/if}
	</datalist>
{/if}

<style>
	/* Many thanks to CSS Tricks: https://css-tricks.com/sliding-nightmare-understanding-range-input/ */

	input {
		margin: 0;
		padding: 0;
		width: 100%;
		height: 1.5em;
		background: transparent;

		--track-height: 0.5em;
		--track-color: var(--track-background, var(--bg-primary-translucent));
		--track-filled-color: var(--track-fill, var(--bg-primary));
		--thumb-color: var(--track-thumb, var(--bg-neutral));

		&:is(:hover, :focus-visible) {
			--track-filled-color: var(--track-fill, var(--fg-primary));
		}
	}

	input,
	input::-webkit-slider-thumb {
		-webkit-appearance: none;
	}

	input::-ms-tooltip {
		display: none;
	}

	/* Full track */

	input::-webkit-slider-runnable-track {
		box-sizing: border-box;
		border: none;
		width: 100%;
		height: var(--track-height);
		background: var(--track-color);
		border-radius: 9999px;
	}

	input:is(:focus-visible)::-webkit-slider-runnable-track {
		border: 1px solid var(--fg-neutral);
	}

	input::-moz-range-track {
		box-sizing: border-box;
		border: none;
		width: 100%;
		height: var(--track-height);
		background: var(--track-color);
		border-radius: 9999px;
	}

	input:is(:focus-visible)::-moz-range-track {
		border: 1px solid var(--fg-neutral);
	}

	input::-ms-track {
		box-sizing: border-box;
		border: none;
		width: 100%;
		height: var(--track-height);
		background: var(--track-color);
		border-radius: 9999px;
	}

	input:is(:focus-visible)::-ms-track {
		border: 1px solid var(--fg-neutral);
	}

	/* Thumb */

	input::-webkit-slider-thumb {
		cursor: pointer;
		margin-top: -0.625em;
		box-sizing: border-box;
		border: none;
		width: 1.5em;
		height: 1.5em;
		border-radius: 50%;
		background: var(--thumb-color);
		border: 1px solid var(--fg-neutral);
		transition: border 0.1s ease;
	}

	input:is(:hover, :focus-visible)::-webkit-slider-thumb {
		border-color: var(--track-filled-color);
	}

	input:is(:active)::-webkit-slider-thumb {
		border-width: calc(1.5em / 2 - 5px);
	}

	input::-moz-range-thumb {
		cursor: pointer;
		box-sizing: border-box;
		border: none;
		width: 1.5em;
		height: 1.5em;
		border-radius: 50%;
		background: var(--thumb-color);
		border: 1px solid var(--fg-neutral);
		transition: border 0.1s ease;
	}

	input:is(:hover, :focus-visible)::-moz-range-thumb {
		border-color: var(--track-filled-color);
	}

	input:is(:active)::-moz-range-thumb {
		border-width: calc(1.5em / 2 - 5px);
	}

	input::-ms-thumb {
		cursor: pointer;
		margin-top: 0;
		box-sizing: border-box;
		border: none;
		width: 1.5em;
		height: 1.5em;
		border-radius: 50%;
		background: var(--thumb-color);
		border: 1px solid var(--fg-neutral);
		transition: border 0.1s ease;
	}

	input:is(:hover, :focus-visible)::-ms-thumb {
		border-color: var(--track-filled-color);
	}

	input:is(:active)::-ms-thumb {
		border-width: calc(1.5em / 2 - 5px);
	}

	/* Filled track */

	input::-webkit-slider-runnable-track {
		transition: background 0.1s ease;
		background: linear-gradient(
			to right,
			var(--track-filled-color) var(--slider-width),
			var(--track-color) var(--slider-width)
		);
	}

	input::-moz-range-progress {
		transition: background 0.1s ease;
		height: var(--track-height);
		background: var(--track-filled-color);
		border-radius: 9999px;
	}

	input::-ms-fill-lower {
		transition: background 0.1s ease;
		height: var(--track-height);
		background: var(--track-filled-color);
		border-radius: 9999px;
	}
</style>

<!-- 
@component Requires a parent element with a defined width

TODO: Don't animate when progress decreases (e.g. when a new task starts and it goes back to 0)
-->

<script lang="ts">
	import { tooltip } from './tooltips.js';
	import { clamp, ensureArray, sum } from './utils.js';

	interface Props {
		/** Pass in an array of values for a multi-phase progress bar. Numbers must be in decreasing order for this to make sense */
		progress: number | number[];
		/** Always display the progress bar, even when progress is 0 or 1 */
		alwaysActive?: boolean;
		/** Display a progress percentage below the bar. If a number, denotes the number of decimal places to show. Defaults to 0 (if set to true). */
		percentage?: boolean | number;
		/** Add hover tooltips to the different phases of the progress bar */
		phases?: string[];
	}

	const { progress, percentage, alwaysActive = false, phases = [] }: Props = $props();

	const inactive = $derived(
		ensureArray(progress).every((p) => [0, 1].includes(p)) && !alwaysActive
	);

	/**
	 * If we have [0.85, 0.6], this will be [0.6, 0.25]
	 */
	const incrementalProgresses = $derived.by(() => {
		const increments: number[] = [];
		let position = 0;

		for (const p of ensureArray(progress).toReversed()) {
			increments.push(p - position);
			position = p;
		}

		return increments;
	});
	$inspect({ incrementalProgresses });
</script>

<div class="bars">
	{#each ensureArray(progress) as p, i (i)}
		{@const phase = phases[ensureArray(progress).length - 1 - i]}
		{@const percentage = Math.round(clamp(ensureArray(progress)[progress.length - 1 - i], 0, 1) * 100)}
		<div
			class="tooltip-container"
			use:tooltip={phase ? `${phase}: ${percentage}%` : ""}
			style:left="{(incrementalProgresses[i - 1] ?? 0) * 100}%"
			style:width="{(incrementalProgresses[i] ?? 0) * 100}%"
		></div>
		<progress
			class="progress-bar"
			class:inactive
			value={clamp(p, 0, 1)}
			max="1"
			style:--phased-fill-color="color-mix(var(--_fill-color) {((i + 1) /
				ensureArray(progress).length) *
				100}%, var(--bg-neutral))"
		></progress>
	{/each}
</div>

{#if percentage && !inactive && ensureArray(progress).length === 1}
	<p>
		<code class="progress-percentage">
			{(ensureArray(progress)[0] * 100).toFixed(
				typeof percentage === 'number' ? percentage : 0
			)}%
		</code>
	</p>
{/if}

<style>
	.progress-bar.inactive {
		opacity: 0;
		transition: opacity 1s;
	}

	.bars {
		width: 100%;
		height: var(--height, 0.25rem);
		border-radius: var(--corners, 0);
		background: var(--inactive-bg);
		overflow: hidden;
		position: relative;
		--_fill-color: var(--fill-color, var(--fg-primary));
	}

	.tooltip-container {
		z-index: 100;
		position: absolute;
		top: 0;
		bottom: 0;
	}

	.progress-bar {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		appearance: none;
		-webkit-appearance: none;
		border: 0;
		background: transparent;
		color: var(--phased-fill-color);
	}

	.progress-bar::-webkit-progress-bar {
		background: transparent;
	}

	.progress-bar::-webkit-progress-value {
		background: var(--phased-fill-color);
		transition: width 0.5s;
	}

	.progress-bar::-moz-progress-bar {
		background: var(--phased-fill-color);
		transition: width 0.5s;
	}

	.progress-percentage {
		text-align: center;
	}
</style>

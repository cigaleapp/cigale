<!-- 
@component Requires a parent element with a defined width

TODO: Don't animate when progress decreases (e.g. when a new task starts and it goes back to 0)
-->

<script>
	import { clamp } from './utils.js';

	/**
	 * @typedef {object} Props
	 * @property {number} progress
	 * @property {boolean} [alwaysActive] always display the progress bar, even when progress is 0 or 1
	 * @property {boolean|number} [percentage=false] display a progress percentage below the bar. If a number, denotes the number of decimal places to show. Defaults to 0 (if set to true).
	 */

	/** @type {Props} */
	const { progress, percentage, alwaysActive = false } = $props();

	const inactive = $derived([0, 1].includes(progress) && !alwaysActive);
</script>

<div class="progress-bar" class:inactive>
	<div class="completed" style:width="{clamp(progress * 100, 0, 100)}%"></div>
</div>

{#if percentage && !inactive}
	<p>
		<code class="progress-percentage">
			{(progress * 100).toFixed(typeof percentage === 'number' ? percentage : 0)}%
		</code>
	</p>
{/if}

<style>
	.progress-bar.inactive {
		opacity: 0;
		transition: opacity 1s;
	}

	.progress-bar {
		width: 100%;
		height: var(--height, 0.25rem);
		border-radius: var(--corners, 0);
		background: var(--inactive-bg);
		overflow: hidden;
	}

	.progress-bar .completed {
		height: 100%;
		background: var(--fill-color, var(--fg-primary));
		transition: width 0.5s;
	}

	.progress-percentage {
		text-align: center;
	}
</style>

<!-- 
 
@component
CSS Variables: `--size` (default: `1em`)


-->

<script lang="ts">
	/**
	 * @typedef Props
	 * @type {object}
	 * @property {number|undefined} [progress] - The progress of the loading spinner (between 0 and 1). Leave undefined to show the spinner without progress (infinite).
	 * @property {boolean} [waiting=false] - Whether the spinner is in a waiting state (e.g. for a pending image). If true, the spinner will not show progress.
	 */

	/** @type {Props} */
	const { progress: rawProgress = undefined, waiting = false } = $props();

	// Don't show progress if we're below 2% cuz we wouldnt see anything anyway
	const progress = $derived((rawProgress ?? 0) < 0.02 ? undefined : rawProgress);

	const dashOffsetScale = [-125, 0];
	const dashOffset = $derived.by(() => {
		if (waiting) return undefined;
		if (progress === undefined) return -30;
		return Math.ceil(dashOffsetScale[0] + progress * (dashOffsetScale[1] - dashOffsetScale[0]));
	});
</script>

<div class="loading-spinner" class:infinite={!waiting && progress === undefined} class:waiting>
	<svg class="circular-loader" viewBox="25 25 50 50" width="50" height="50">
		<circle
			class="loader-path"
			stroke-dashoffset={dashOffset}
			cx="50"
			cy="50"
			r="20"
			fill="none"
			stroke="currentColor"
			stroke-width="6"
		/>
	</svg>
</div>

<style>
	.loading-spinner {
		display: inline-block;
		display: flex;
		justify-content: center;
		align-items: center;
		width: var(--size, 1em);
		height: var(--size, 1em);
	}

	.loading-spinner.waiting {
		animation: pulse 1.5s ease-in-out infinite;
	}

	.waiting .loader-path {
		stroke-dasharray: 5, 13;
		stroke-dashoffset: 0;
	}

	.loading-spinner:not(.infinite) .circular-loader {
		/* So that the start of the loading spinner is at the center top */
		transform: rotate(261deg);
	}

	.loading-spinner.infinite {
		animation: spin 2s linear infinite;
	}

	.loading-spinner:not(.infinite):not(.waiting) {
		animation: spin 500ms linear infinite;
	}

	.loader-path {
		stroke-dasharray: 300;
		stroke-linecap: round;
	}

	.infinite .loader-path {
		animation: dash 1.5s ease-in-out infinite;
		stroke-dashoffset: -10;
		stroke-dasharray: 150, 200;
	}

	svg {
		height: 1em;
		width: 1em;
		height: 100%;
		transform-origin: center center;
		width: 100%;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}

		to {
			transform: rotate(1turn);
		}
	}

	@keyframes dash {
		0% {
			stroke-dasharray: 1, 200;
			stroke-dashoffset: 0;
		}
		50% {
			stroke-dasharray: 89, 200;
			stroke-dashoffset: -35;
		}
		100% {
			stroke-dasharray: 89, 200;
			stroke-dashoffset: -124;
		}
	}

	@keyframes pulse {
		0% {
			opacity: 1;
		}
		50% {
			opacity: 0.25;
		}
		100% {
			opacity: 1;
		}
	}
</style>

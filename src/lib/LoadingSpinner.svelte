<script>
	/**
	 * @typedef Props
	 * @type {object}
	 * @property {number|undefined} [progress] - The progress of the loading spinner (between 0 and 1). Leave undefined to show the spinner without progress (infinite).
	 */

	/** @type {Props} */
	const { progress = undefined } = $props();

	const dashOffsetScale = [-125, 0];
	const dashOffset = $derived.by(() => {
		if (progress === undefined) return undefined;
		return Math.ceil(dashOffsetScale[0] + progress * (dashOffsetScale[1] - dashOffsetScale[0]));
	});
</script>

<div class="loading-spinner" class:infinite={progress === undefined}>
	<svg class="circular-loader" viewBox="25 25 50 50" width="50" height="50">
		<circle
			class="loader-path"
			stroke-dashoffset={dashOffset ?? '-30'}
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

	.loading-spinner:not(.infinite) {
		/* So that the start of the loading spinner is at the center top */
		transform: rotate(261deg);
	}

	.loading-spinner.infinite {
		animation: spin 2s linear infinite;
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
</style>

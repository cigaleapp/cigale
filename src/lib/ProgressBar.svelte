<script>
	/**
	 * @typedef {object} Props
	 * @property {number} progress
	 */

	/** @type {Props} */
	const { progress } = $props();
</script>

<div class="progress-bar" class:inactive={[0, 1].includes(progress)}>
	<div class="completed" style:width="{progress * 100}%"></div>
</div>

<style>
	.progress-bar.inactive {
		opacity: 0;
		transition: opacity 1s;
	}

	.progress-bar {
		width: 100%;
		height: 0.25rem;
		border-radius: var(--corners, 0);
		overflow: hidden;
	}

	.progress-bar .completed {
		height: 100%;
		background: var(--fg-primary);
		transition: width 0.5s;
	}
</style>

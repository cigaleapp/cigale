<script lang="ts">
	import type { CaptureDevice } from './device.svelte.js';

	import ProgressBar from '$lib/ProgressBar.svelte';

	interface Props {
		device: CaptureDevice;
	}

	const { device }: Props = $props();
</script>

<div class="audio-monitor">
	<div class="vu-meter">
		<ProgressBar alwaysActive progress={device.amplitudeTracker.latestFrame.amplitude} />
	</div>

	<div class="history">
		{#each device.amplitudeTracker.history as { amplitude, recorded }, i (i)}
			<div class="tick" class:recorded style:--amplitude={amplitude}></div>
		{/each}
	</div>
</div>

<style>
	.audio-monitor {
		display: flex;
		height: 100%;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		color: var(--fg-neutral);
		padding: 2rem;
	}

	.history {
		height: 200px;
		width: 100%;
		display: flex;
		justify-content: end;
		align-items: end;
		gap: 5px;
		overflow: clip;
	}

	.history .tick {
		width: 1px;
		flex-shrink: 0;
		height: calc(max(1px, var(--amplitude) * 100%));
		background: var(--fg-neutral);
		border-radius: 1000px;

		&.recorded {
			background: var(--fg-primary);
		}
	}

	.vu-meter {
		rotate: -90deg;
		width: 200px;
		--height: 100px;
		--inactive-bg: rgb(from var(--fg-primary) r g b / 25%);
	}
</style>

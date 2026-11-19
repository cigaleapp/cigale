<script lang="ts">
	import type { CaptureDevice } from './device.svelte.js';

	interface Props {
		device: CaptureDevice;
	}

	const { device }: Props = $props();
</script>

<div class="info">
	{#each device.timer!.config.messages.status as line, i (i)}
		{const formatted = $derived(device.timer!.formatMessage(line))}
		{const stopwatchPattern = new RegExp(`^[0-9.,'":-\\s]+$`)}

		<svelte:element this={stopwatchPattern.test(formatted) ? 'code' : 'div'} class="line">
			{formatted}
		</svelte:element>
	{/each}
</div>

<style>
	.info {
		color: white;
		text-align: center;

		code {
			font-size: 0.9em;
		}
	}
</style>

<script lang="ts">
	import type { CaptureDevice } from './device.svelte.js';

	import { fade } from 'svelte/transition';

	import IconPause from '~icons/ri/pause-line';
	import IconPlayFill from '~icons/ri/play-fill';
	import ButtonInk from '#lib/ButtonInk.svelte';
	import { formatDurationStopwatch } from '#lib/date.js';

	interface Props {
		device: CaptureDevice;
	}

	const { device }: Props = $props();
</script>

<section class="floating-messages" pw-testid="floating-messages">
	{#if device.floatingmsg.text}
		<p transition:fade={{ duration: 500 }}>
			{device.floatingmsg.text}
		</p>
	{/if}
</section>

<section class="floating-action" data-blink={device.timer?.paused}>
	{#if device.timer?.started}
		<ButtonInk onclick={() => device.timer?.togglePause()}>
			{#if device.timer?.paused}
				<IconPlayFill />
				Reprendre
			{:else}
				<IconPause />
				Pause
			{/if}
		</ButtonInk>
	{/if}
</section>

{#if device.recordingDuration !== null}
	<code class="recording-duration" transition:fade={{ duration: 200 }}>
		{formatDurationStopwatch(device.recordingDuration)}
	</code>
{/if}

<style>
	.floating-messages {
		z-index: 20;
		position: fixed;
		inset-inline: 0;
		bottom: calc(var(--bottom-actions-height) + 1.5em);
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;

		p {
			color: white;
			background: var(--ui-surfaces);
			border-radius: 99999px;
			padding: 0.5em 1em;
		}
	}

	.floating-action {
		z-index: 15;
		position: fixed;
		inset-inline: 0;
		top: calc(var(--top-actions-height) - 0.25em);
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;

		--fg: white;

		&[data-blink='true'] {
			animation: blink infinite 1s;
		}
	}

	.recording-duration {
		z-index: 15;
		position: fixed;
		inset-inline: 0;
		bottom: calc(var(--bottom-actions-height) - 0.5em);
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;
		font-size: 0.9rem;

		background: rgb(0 0 0 / 25%);
		color: white;
		padding: 0.5em;
	}

	@keyframes blink {
		from {
			opacity: 1;
		}
		50% {
			opacity: 0.125;
		}
		to {
			opacity: 1;
		}
	}
</style>

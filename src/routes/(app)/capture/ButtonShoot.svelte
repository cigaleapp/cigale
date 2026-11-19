<script lang="ts">
	import type { CaptureDevice } from './device.svelte.js';

	import IconPlay from '~icons/ri/play-large-line';
	import IconStartTimer from '~icons/ri/timer-line';
	import { switchValue } from '$lib/utils.js';

	interface Props {
		device: CaptureDevice;
	}

	const { device }: Props = $props();
</script>

<button
	class="shoot"
	disabled={!device.ready}
	title="Prendre une photo"
	onclick={async () => {
		await device.shoot();
	}}
>
	{const Icon = $derived(
		switchValue(device.shootingPhase, {
			inert: device.timer ? IconStartTimer : null,
			'before-timer': null,
			'wait-start-timer': IconPlay,
			'timer-running': switchValue(device.timerShoot, {
				manually: null,
				'on-timer': 'A',
			}),
			'after-timer': null,
			done: null,
		})
	)}

	{#if Icon}
		<div class="start-timer-icon" style:color={typeof Icon === 'string' ? 'black' : 'white'}>
			{#if typeof Icon === 'string'}
				{Icon}
			{:else}
				<Icon />
			{/if}
		</div>
	{/if}

	<svg class="shoot-icon" data-phase={device.shootingPhase} data-shoot={device.timerShoot}>
		<circle
			class="ring"
			cx="50%"
			cy="50%"
			r="43%"
			fill="none"
			stroke="var(--color, white)"
			stroke-width="2px"
			stroke-linecap="round"
			{@attach (node: SVGCircleElement) => {
				if (!device.timer) {
					node.style.strokeDasharray = '';
					node.style.stroke = 'white';
					return;
				}

				if (!['wait-start-timer', 'timer-running'].includes(device.shootingPhase)) {
					node.style.strokeDasharray = '';
					node.style.stroke = 'white';
					return;
				}

				const length = node.getTotalLength();

				const gap = 4;
				const nongap = Math.round(
					(length - gap * device.timer.lapsTotalCount) / device.timer.lapsTotalCount
				);

				node.style.strokeDasharray = `${nongap} ${gap}`;
				node.style.stroke = 'var(--gay)';
			}}
		></circle>

		{#if !Icon || typeof Icon === 'string'}
			<rect
				class="inside"
				class:recording={device.recording}
				x="14%"
				y="14%"
				width="72%"
				height="72%"
				fill="var(--color, white)"
			></rect>
		{/if}

		{#if device.timer?.started}
			{#key device.timer.globalProgress}
				<circle
					class="timer-progress"
					cx="50%"
					cy="50%"
					r="43%"
					fill="none"
					stroke="var(--progress-color, white)"
					stroke-width="3px"
					{@attach (node: SVGCircleElement) => {
						if (!device.timer) return;
						const length = node.getTotalLength();
						node.style.strokeDasharray = `${device.timer.globalProgress * length} 1000000`;
					}}
				></circle>
			{/key}

			{#key device.timer.lapProgress}
				<circle
					class="lap-progress"
					cx="50%"
					cy="50%"
					r="39%"
					fill="none"
					stroke="var(--lap-progress-color, red)"
					stroke-width="1px"
					{@attach (node: SVGCircleElement) => {
						if (!device.timer) return;
						const length = node.getTotalLength();
						node.style.strokeDasharray = `${device.timer.lapProgress * length} 1000000`;
					}}
				></circle>
			{/key}
		{/if}
	</svg>
</button>

<style>
	button.shoot {
		background: none;
		font-size: 1rem;

		&:active,
		&:focus-visible {
			.shoot-icon .inside {
				scale: 0.5;
			}
		}

		&:disabled .shoot-icon {
			--color: darkgray;
		}

		& {
			position: relative;

			.start-timer-icon {
				position: absolute;
				inset: 0;
				display: flex;
				justify-content: center;
				align-items: center;
			}
		}
	}

	.shoot-icon {
		height: 5em;
		width: 5em;
		--color: white;
	}

	.shoot-icon circle {
		transition: 500ms;
		transform-origin: 50% 50%;
		rotate: -90deg;

		--lap-progress-color: white;

		&.timer-progress,
		&.lap-progress {
			transition: 50ms linear;
		}
	}

	.shoot-icon .inside {
		transform-origin: 50% 50%;
		rx: 50%;
		transition:
			scale 100ms ease,
			rx 100ms ease;

		&.recording {
			scale: 50%;
			rx: 10%;
			--color: red;
		}
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

	.shoot-icon[data-phase='wait-start-timer'] .ring {
		animation: blink infinite 1s ease;
	}

	.shoot-icon[data-shoot='on-timer'][data-phase='timer-running'] .lap-progress {
		stroke-width: 2px;
	}
</style>

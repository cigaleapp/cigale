<script lang="ts">
	import { range } from '$lib/utils.js';

	interface Props {
		domain: [number, number];
		horizontal?: boolean;
		label?: (value: number) => string;
		/** In tick-per-px */
		tickDensity?: number;
		/** In label-per-tick */
		labelDensity?: number;
		/** Number of sub-ticks for every tick */
		subtickDensity?: number;
	}

	const {
		domain,
		horizontal = false,
		label = (value) => value.toString(),
		tickDensity = horizontal ? 1 / 50 : 1 / 20,
		labelDensity = 1 / 2,
		subtickDensity = horizontal ? 5 : 3,
	}: Props = $props();

	let height = $state<number>();
	let width = $state<number>();

	const ticks = $derived.by(() => {
		if (!height) return [];

		const [lo, hi] = domain;

		let count = Math.round(tickDensity * (horizontal ? width : height));

		// Prevent last tick AND second-to-last tick from both having a label
		if (count % (1 / labelDensity) === 0) count++;

		return range(count).map((i) => lo + (i / count) * (hi - lo));
	});

	const tickPosition = (index: number, subindex: number) =>
		(index * subtickDensity + subindex) / ((ticks.length - 1) * subtickDensity);
</script>

<div class="rule" class:horizontal bind:clientHeight={height} bind:clientWidth={width}>
	<!-- <div class="unit">{unit}</div> -->

	{#each ticks as value, i}
		{const first = i === 0}
		{const last = $derived(i === ticks.length - 1)}

		<div class="mark" class:first class:last style:--position={tickPosition(i, 0)}>
			{#if first || last || i % Math.round(1 / labelDensity) === 0}
				{label(value)}
			{/if}
		</div>

		{#if !last}
			{#each range(subtickDensity) as j}
				<div class="mark sub" style:--position={tickPosition(i, j + 1)}></div>
			{/each}
		{/if}
	{/each}
</div>

<style>
	.rule {
		position: relative;
		color: var(--fg-neutral);
		background: var(--bg-neutral);
		--mark-size: 1rem;

		&.horizontal {
			height: 3rem;

			.mark {
				flex-direction: column;
				left: calc(var(--position) * 100%);
				height: 100%;
				width: 0;
				overflow: visible;
				/* top: var(--mark-size); */
			}

			.mark.last {
				align-items: end;
			}

			.mark.first {
				align-items: start;
			}

			.mark::before {
				width: 1px;
				height: var(--mark-size);
				margin-bottom: 0.25em;
			}

			.mark.sub::before {
				height: calc(var(--mark-size) / 2);
			}
		}

		&:not(.horizontal) {
			width: 4rem;

			.mark {
				flex-direction: row;
				bottom: calc(var(--position) * 100%);
				width: 100%;
				height: 0;
				overflow: visible;
			}

			.mark.first {
				align-items: end;
			}

			.mark.last {
				align-items: start;
			}

			.mark::before {
				height: 1px;
				width: var(--mark-size);
				margin-right: 0.25em;
			}

			.mark.sub::before {
				width: calc(var(--mark-size) / 2);
			}
		}

		.mark {
			display: flex;
			/* font-family: var(--font-mono); */
			font-size: 0.75rem;
			font-weight: 200;
			position: absolute;
			height: 1px;
			align-items: center;
		}

		.mark::before {
			content: '';
			display: block;
			width: 1rem;
			height: 1px;
			background: var(--fg-neutral);
			align-self: center;
		}
	}
</style>

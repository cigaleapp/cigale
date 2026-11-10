<script lang="ts">
	import { range, round } from '$lib/utils.js';

	interface Props {
		domain: [number, number];
	}

	const { domain }: Props = $props();

	const frequenciesSpace = $derived.by(() => {
		const [lo, hi] = domain;

		if (lo === -Infinity && hi === Infinity) {
			return [lo, 0, 0, 0, hi];
		}

		const COUNT = 21;

		return range(COUNT).map((i) => lo + (i / COUNT) * (hi - lo));
	});

	const unit = $derived(frequenciesSpace.every((freq) => freq >= 1e3) ? 'kHz' : 'Hz');
</script>

<div class="rule">
	<!-- <div class="unit">{unit}</div> -->

	{#each frequenciesSpace as frequency, i}
		<div class="mark" class:first={i === 0} class:last={i === frequenciesSpace.length - 1}>
			{#if i % 2 === 0}
				{#if !Number.isFinite(frequency)}
					{frequency.toString().replace('Infinity', '∞')}
				{:else if frequency >= 1e3}
					{round(frequency * 1e-3, 1)}k
					<!-- {unit === 'Hz' ? 'k' : ''} -->
				{:else}
					{round(frequency)}
					<!-- {unit === 'kHz' ? 'm' : ''} -->
				{/if}
			{/if}
		</div>
	{/each}
</div>

<style>
	.rule {
		display: flex;
		flex-direction: column-reverse;
		justify-content: space-between;
		/* margin-left: -0.5rem; */
		position: relative;
		width: 4rem;
		/* border-left: 1px solid var(--faint); */

		.unit {
			position: absolute;
			bottom: 0.5rem;
			right: 0.5rem;
		}

		.mark {
			display: flex;
			/* font-family: var(--font-mono); */
			font-size: 0.75rem;
			font-weight: 200;
		}

		.mark::before {
			content: '';
			display: block;
			margin-right: 0.25em;
			width: 1rem;
			height: 1px;
			background: var(--fg-neutral);
			align-self: center;
		}

		.mark.first::before {
			align-self: end;
			margin-bottom: 4px;
		}

		.mark.last::before {
			margin-top: 4px;
			align-self: start;
		}
	}
</style>

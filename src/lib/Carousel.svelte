<script lang="ts" generics="T">
	import type { EmblaCarouselType } from 'embla-carousel';
	import AutoHeight from 'embla-carousel-auto-height';
	import embla from 'embla-carousel-svelte';
	import type { Snippet } from 'svelte';

	import IconPrev from '~icons/ri/arrow-left-s-line';
	import IconNext from '~icons/ri/arrow-right-s-line';

	import ButtonIcon from './ButtonIcon.svelte';

	interface Props {
		items: T[];
		item: Snippet<[T]>;
	}

	const { item: itemSnippet, items }: Props = $props();

	let canScrollNext = $state(true);
	let canScrollPrev = $state(false);
	let carousel: EmblaCarouselType | undefined = $state();

	$effect(() => {
		function onSettle() {
			canScrollPrev = carousel?.canScrollPrev() ?? false;
			canScrollNext = carousel?.canScrollNext() ?? false;
		}

		carousel?.on('settle', onSettle);
		return () => carousel?.off('settle', onSettle);
	});
</script>

<div class="embla">
	{#key items}
		{#if items.length > 1}
			<nav>
				<ButtonIcon
					help="Image précédente"
					class="embla__prev"
					disabled={!canScrollPrev}
					onclick={() => {
						carousel?.scrollPrev();
					}}
				>
					<IconPrev />
				</ButtonIcon>
				<ButtonIcon
					help="Image suivante"
					class="embla_next"
					disabled={!canScrollNext}
					onclick={() => {
						carousel?.scrollNext();
					}}
				>
					<IconNext />
				</ButtonIcon>
			</nav>
		{/if}
		<div
			class="embla__viewport"
			use:embla={{
				options: { duration: 15 },
				plugins: [AutoHeight()]
			}}
			onemblaInit={(event: CustomEvent) => {
				carousel = event.detail;
			}}
		>
			<div class="embla__container">
				{#each items as item, i (i)}
					<div class="embla__slide">
						{@render itemSnippet(item)}
					</div>
				{/each}
			</div>
		</div>
	{/key}
</div>

<style>
	.embla {
		flex-shrink: 0;
	}

	.embla__viewport {
		overflow: hidden;
	}

	.embla__container {
		align-items: flex-start;
		display: flex;
	}

	.embla__slide {
		flex: 0 0 100%;
		min-width: 0;
	}

	nav {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 1rem;
		gap: 1rem;
	}
</style>

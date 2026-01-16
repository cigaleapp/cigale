<script module lang="ts">
	export interface Props<T = unknown> {
		items: T[];
		item: Snippet<[T]>;
		scrollers?: {
			next: () => void;
			prev: () => void;
		};
	}
</script>

<script lang="ts" generics="T">
	import type { EmblaCarouselType } from 'embla-carousel';
	import embla from 'embla-carousel-svelte';
	import type { Snippet } from 'svelte';

	import IconPrev from '~icons/ri/arrow-left-s-line';
	import IconNext from '~icons/ri/arrow-right-s-line';

	import ButtonIcon from './ButtonIcon.svelte';

	let { item: itemSnippet, items, scrollers = $bindable() }: Props<T> = $props();

	let canScrollNext = $state(true);
	let canScrollPrev = $state(false);
	let currentIndex = $state(0);
	let carousel: EmblaCarouselType | undefined = $state();

	$effect(() => {
		if (!carousel) return;
		scrollers = {
			next: () => carousel?.scrollNext(),
			prev: () => carousel?.scrollPrev()
		};
	});

	$effect(() => {
		function onSettle() {
			canScrollPrev = carousel?.canScrollPrev() ?? false;
			canScrollNext = carousel?.canScrollNext() ?? false;
			currentIndex = carousel?.selectedScrollSnap() ?? 0;
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
				<div class="dots">
					{#each items as _, i (i)}
						<button
							class="dot"
							aria-label="Aller à l'image {i + 1}"
							class:active={currentIndex === i}
							onclick={() => {
								carousel?.scrollTo(i);
							}}
						></button>
					{/each}
				</div>
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
				options: { duration: 15 }
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
		position: relative;
		height: 100%;
	}

	.embla__viewport {
		overflow: hidden;
		height: 100%;
	}

	.embla__container {
		align-items: flex-start;
		display: flex;
		height: 100%;
	}

	.embla__slide {
		flex: 0 0 100%;
		min-width: 0;
		height: 100%;
	}

	nav {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		position: absolute;
		bottom: 0;
		padding-bottom: 1em;
		padding-top: 2em;
		z-index: 10;
		width: 100%;
		background: linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.7) 100%);
	}

	.dots {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.7rem;
	}

	.dots button {
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 50%;
		background-color: white;
		border: none;
		padding: 0;
		cursor: pointer;
	}

	.dots button:not(:hover):not(:focus-visible):not(.active) {
		opacity: 0.5;
	}
</style>

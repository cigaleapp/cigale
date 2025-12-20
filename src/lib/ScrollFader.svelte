<script lang="ts">
	import type { Snippet } from 'svelte';

	import { effectiveBackgroundColor } from './utils';

	interface Props {
		/** Height of the fade effect in pixels */
		height: number;
		/** Scrollable contents */
		children: Snippet;
	}

	const { height, children }: Props = $props();

	let outerContainer: HTMLElement | undefined = undefined;

	function onscroll({ target }: Pick<Event, 'target'>) {
		if (!(target instanceof HTMLElement)) return;
		if (!outerContainer) return;

		const scrollable = target;
		const scrollTop = scrollable.scrollTop;
		const scrollHeight = scrollable.scrollHeight;
		const clientHeight = scrollable.clientHeight;

		if (scrollTop + clientHeight >= scrollHeight - height * 0.75) {
			outerContainer.classList.add('hidden');
		} else {
			outerContainer.classList.remove('hidden');
		}
	}

	const contentsContainer = $derived.by(() => {
		if (!outerContainer) return null;
		return outerContainer.firstElementChild as HTMLElement | null;
	});

	$effect(() => {
		if (!outerContainer) return;
		if (!contentsContainer) return;

		const bgColor = effectiveBackgroundColor(contentsContainer);
		outerContainer.style.setProperty('--background-color', bgColor);
		contentsContainer.style.height = '100%';

		onscroll({ target: contentsContainer });

		contentsContainer.addEventListener('scroll', onscroll);
		return () => contentsContainer.removeEventListener('scroll', onscroll);
	});

	$effect(() => {
		if (!contentsContainer) return;

		// Listen for size changes on the contents container and re-evaluate the fade
		const observer = new MutationObserver(() => {
			onscroll({ target: contentsContainer });
		});

		observer.observe(contentsContainer, {
			childList: true,
			subtree: true,
			characterData: true
		});

		return () => observer.disconnect();
	});
</script>

<div bind:this={outerContainer} class="fade-scroller" style:--scrollfade-height="{height}px">
	{@render children()}
</div>

<style>
	.fade-scroller {
		position: relative;
		/* overflow-y: auto; */
	}

	.fade-scroller::after {
		content: '';
		pointer-events: none;
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: var(--scrollfade-height);
		transition: opacity 0.3s;
		background: linear-gradient(
			to bottom,
			rgba(255, 255, 255, 0),
			var(--background-color, white)
		);
	}

	.fade-scroller:global(.hidden::after) {
		opacity: 0;
	}
</style>

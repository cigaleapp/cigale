<script lang="ts" module>
	export const Loading = Symbol('LoadingTextLoading');
	export type MaybeLoading<T> = T | typeof Loading;

	export function loaded<T>(value: MaybeLoading<T>): value is T {
		return value !== Loading;
	}
</script>

<!-- Credits: https://github.com/nolimits4web/skeleton-elements -->
<script lang="ts" generics="T extends string | number = string | number">
	import { tooltip } from './tooltips.js';
	import { LOREM_IPSUM } from './utils.js';

	import '$lib/skeleton-font.css';

	import type { Snippet } from 'svelte';
	import { fade } from 'svelte/transition';

	interface Props {
		/** HTML tag to use for the text element */
		tag?: string;
		/** Value to display when loaded */
		value: MaybeLoading<T> | null | undefined;
		/** Help text to show as a tooltip */
		help?: string;
		/** Text to use for determining the length of the skeleton text. Use lines or words to specify a length and get text from lorem ipsum */
		mask?: string | { lines: number } | { words: number };
		/** Content to show when the value is loaded */
		loaded?: Snippet<[T]>;
	}

	const { tag = 'span', value, help, mask, loaded: loadedContent }: Props = $props();

	// Text to use as skeleton UI is either the text given in the default slot, or lines of lorem ipsum if lines is specified, or a fallback
	const loadingTextLines = $derived.by(() => {
		if (!mask) return ['Chargement...'];

		let output: string[];

		if (typeof mask === 'string') {
			output = mask.split('\n');
		} else if ('words' in mask) {
			output = [LOREM_IPSUM.split(/\s+/).slice(0, mask.words).join(' ')];
		} else {
			output = LOREM_IPSUM.split('\n').slice(0, mask.lines);
		}

		output = output.filter(Boolean);
		if (output.length > 0) return output;
		return ['Chargement...'];
	});
</script>

{#if !loaded(value) || value === null || value === undefined}
	<svelte:element
		this={tag === 'code' ? 'span' : tag}
		use:tooltip={help}
		class="skeleton-text"
		in:fade={{ duration: 200 }}
	>
		{#each loadingTextLines as line, i (i)}
			{#if i > 0}
				<br />
			{/if}
			<span>{line}</span>
		{/each}
	</svelte:element>
{:else}
	<svelte:element this={tag} use:tooltip={help} data-loaded in:fade={{ duration: 200 }}>
		{#if loadedContent}
			{@render loadedContent(value)}
		{:else}
			{value}
		{/if}
	</svelte:element>
{/if}

<style>
	.skeleton-text span {
		/* no putting in a fallback generic font prevents unsupported skeleton text characters from showing up */
		/* stylelint-disable-next-line font-family-no-missing-generic-family-keyword */
		font-family: skeleton;
		user-select: none;

		color: transparent;
		letter-spacing: -0.03em;
		background-color: var(--faint);
		border-radius: 1000px;
		box-decoration-break: clone;

		mask-image: linear-gradient(
			to right,
			transparent 0%,
			black 25%,
			black 75%,
			transparent 100%
		);
		mask-repeat: repeat;
		mask-position: 50% top;
		mask-size: 200% 100%;
		animation: skeleton-effect-wave 1s infinite;
	}

	@keyframes skeleton-effect-wave {
		0% {
			mask-position: 50% top;
		}

		100% {
			mask-position: -150% top;
		}
	}

	[data-loaded] {
		overflow: inherit;
		text-overflow: inherit;
		white-space: inherit;
	}
</style>

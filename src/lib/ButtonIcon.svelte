<script lang="ts">
	import LoadingSpinner from './LoadingSpinner.svelte';
	import { tooltip } from './tooltips.js';

	type OnclickSignals = {
		/** Marks the beginning of the loading state. */
		loadingStarted: () => void;
		/** Marks the end of the loading state. */
		loadingEnded: () => void;
	};

	interface Props {
		// eslint-disable-next-line no-unused-vars
		onclick: (e: MouseEvent, signals: OnclickSignals) => void | Promise<void>;
		children: import('svelte').Snippet;
		submits?: boolean;
		help: string;
		keyboard?: string;
		disabled?: boolean;
		crossout?: boolean;
		dangerous?: boolean;
		preload?: () => void;
		loading?: boolean;
		tooltipParams?: Partial<import('#lib/tooltips.js').TooltipParameters>;
	}

	let {
		children,
		onclick,
		help,
		keyboard,
		disabled,
		crossout,
		preload,
		dangerous,
		submits,
		tooltipParams = {},
		loading: showLoading,
		...rest
	}: Props & Record<string, unknown> = $props();

	let loading = $state(false);
</script>

<button
	disabled={disabled || loading}
	onclick={async (e) => {
		if (disabled) return;
		loading = true;
		try {
			await onclick(e, {
				loadingStarted: () => {
					loading = true;
				},
				loadingEnded: () => {
					loading = false;
				},
			});
		} finally {
			loading = false;
		}
	}}
	onmouseenter={() => preload?.()}
	class:crossout
	class:dangerous
	use:tooltip={{ text: help, keyboard, ...tooltipParams }}
	aria-label={help}
	type={submits ? 'submit' : 'button'}
	{...rest}
>
	{#if showLoading && loading}
		<LoadingSpinner --size="1.2em" />
	{:else}
		{@render children()}
	{/if}
</button>

<style>
	button {
		cursor: pointer;
		background-color: var(--bg, transparent);
		color: var(--fg, var(--fg-primary));
		display: inline-flex;
		justify-content: center;
		align-items: center;
		border: 1px solid var(--gray);
		padding: 0.5em;
		border-radius: var(--corner-radius);
		font-weight: bold;
		font-size: var(--font-size, 1em);
		border: none;
		position: relative;

		&.dangerous {
			color: var(--fg-error);
		}
	}

	button:is(:hover, :focus-visible) {
		background-color: var(--hover-bg, var(--bg-primary-translucent));
		color: var(--hover-fg, var(--fg-neutral));
	}

	button.dangerous:is(:hover, :focus-visible) {
		background-color: var(--bg-error);
		color: var(--fg-neutral);
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	button.crossout::after {
		content: '';
		position: absolute;
		width: 75%;
		height: 1px;
		background-color: var(--fg, var(--fg-primary));
		transform: rotate(-45deg);
	}
</style>

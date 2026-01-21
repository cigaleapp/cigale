<script>
	import './style.css';
	import '$lib/tippy-svg-arrow.css';
	import '$lib/range-inputs.css';

	import { fadeOutElement } from '$lib/utils';

	const { children } = $props();

	$effect(() =>
		fadeOutElement('#loading', 250, {
			firstTimeDuration: 1_000
		})
	);

	$effect(() => {
		window.nativeWindow?.setControlsColor(
			getComputedStyle(document.documentElement).getPropertyValue('--fg-primary')
		);
	});
</script>

{@render children?.()}

<style>
	:global(*) {
		scrollbar-width: thin;
	}

	:global(body) {
		display: flex;
		flex-direction: column;
		height: 100vh;
	}

	:global(body, input, textarea, button, dialog) {
		background-color: var(--bg-neutral);
		color: var(--fg-neutral);
	}

	:global(::placeholder) {
		color: var(--gay);
	}

	:global(a, a:visited) {
		color: inherit;
	}

	:global(a:hover) {
		color: var(--fg-primary);
	}

	:global(body) {
		font-family: var(--font-regular);
	}

	:global(input, textarea, button) {
		font-family: inherit;
	}

	:global(button) {
		border: none;
		cursor: pointer;
	}

	:global(code, pre, code a, code input) {
		font-family: var(--font-mono);
		font-weight: 260;
	}

	:global(svg.icon) {
		display: inline-flex;
		justify-content: center;
		align-items: center;
		flex-shrink: 0;
	}

	/* Tippy.js (see https://atomiks.github.io/tippyjs/v6/themes/#tippy-elements) */
	:global([data-tippy-root] .tippy-box) {
		background: var(--bg-neutral) !important;
		color: var(--fg-neutral);
		border-radius: var(--corner-radius);
		border: 1px solid var(--fg-neutral);
	}

	:global([data-tippy-root]) {
		/* Position tooltips above bits-ui comboboxes (and other flyouts) */
		z-index: 100000 !important;
	}

	:global([data-tippy-root] .tippy-content) {
		word-break: break-all;
	}

	:global([data-tippy-root] .tippy-box > .tippy-svg-arrow) {
		fill: var(--bg-neutral) !important;
		stroke: var(--fg-neutral);
		stroke-width: 1px;
	}

	:global(input[type='range']) {
		accent-color: var(--fg-primary);
		--track-height: 0.5em;
	}

	:global(textarea) {
		resize: vertical;
		border: 1px solid var(--gay);
		border-radius: var(--corner-radius);
		padding: 0.5em;
		width: 100%;
		max-width: 70rem;
	}
</style>

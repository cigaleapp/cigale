<script>
	import './style.css';
	import '$lib/tippy-svg-arrow.css';

	const { children } = $props();

	$effect(() => {
		document.querySelector('#loading')?.remove();
	});

	$effect(() => {
		window.nativeWindow?.setControlsColor(
			getComputedStyle(document.documentElement).getPropertyValue('--fg-primary')
		);
	});
</script>

{@render children?.()}

<style>
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

	:global(*) {
		font-family: 'Host Grotesk', sans-serif;
	}

	:global(code, pre) {
		font-family: 'Fragment Mono', monospace;
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

	:global([data-tippy-root] .tippy-box > .tippy-svg-arrow) {
		fill: var(--bg-neutral) !important;
		stroke: var(--fg-neutral);
		stroke-width: 1px;
	}

	:global(input[type='range']) {
		accent-color: var(--fg-primary);
	}
</style>

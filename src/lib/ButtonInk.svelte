<script>
	import { tooltip } from './tooltips.js';

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {import('svelte').Snippet} children
	 * @property {(e: MouseEvent) => void} [onclick]
	 * @property {URL | string} [href]
	 * @property {boolean} [inline=false] removes horizontal padding so that it its neatly with other inline elements
	 * @property {boolean} [dangerous=false]
	 * @property {boolean} [disabled=false]
	 * @property {boolean} [fills=false] fills the whole container
	 * @property {string | { text: string; keyboard: string }} [help]
	 */

	/** @type {Props} */
	let {
		children,
		onclick,
		help,
		href,
		dangerous,
		disabled = false,
		inline = false,
		fills = false
	} = $props();

	const hrefIsExternal = $derived(
		href && URL.canParse(href) ? new URL(href).origin !== location.origin : false
	);
</script>

<svelte:element
	this={href ? 'a' : 'button'}
	href={href?.toString()}
	target={hrefIsExternal ? '_blank' : undefined}
	role="button"
	{onclick}
	use:tooltip={help}
	{disabled}
	class={{ dangerous, inline, fills }}
>
	{@render children()}
</svelte:element>

<style>
	[role='button'] {
		background-color: var(--bg, var(--bg-neutral));
		color: var(--fg, var(--fg-primary));
		display: flex;
		gap: 0.5em;
		justify-content: center;
		align-items: center;
		border: none;
		padding: 0.5em;
		border-radius: var(--corner-radius);
		text-transform: uppercase;
		font-weight: bold;
		letter-spacing: 0.05em;
		cursor: pointer;
		text-decoration: none;
		font-size: 1em;
	}

	[role='button'].inline {
		padding-left: 0;
		padding-right: 0;
	}

	[role='button']:is(:hover, :focus-visible) {
		background-color: var(--bg-hover, var(--bg-primary-translucent));
	}

	[role='button']:disabled {
		color: var(--gay);
		cursor: not-allowed;
	}

	[role='button'].dangerous {
		color: var(--fg-error);
	}

	[role='button'].dangerous:is(:hover, :focus-visible) {
		background-color: var(--bg-error-hover, var(--bg-error));
	}

	[role='button'].fills {
		height: 100%;
		width: 100%;
		border-radius: 0;
	}
</style>

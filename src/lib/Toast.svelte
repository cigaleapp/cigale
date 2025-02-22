<!-- 
@component Displays a notification message to the user above the page.
-->

<script generics="T">
	import IconDebug from '~icons/ph/bug';
	import IconSuccess from '~icons/ph/check';
	import IconInfo from '~icons/ph/info';
	import IconWarning from '~icons/ph/warning';
	import { default as IconClose, default as IconError } from '~icons/ph/x';
	import ButtonInk from './ButtonInk.svelte';
	import { fade, slide } from 'svelte/transition';

	/**
	 * @typedef Toast
	 * @type {import('$lib/toasts.svelte').Toast<T>}
	 */

	/**
	 * @typedef Props
	 * @property {string} message the toast to display
	 * @property {Toast['type']} type the type of toast to display
	 * @property {?() => void} onaction the action to perform when the user interacts with the toast
	 * @property {string} [action] the text to use for the action button
	 * @property {?() => void} ondismiss the action to perform when the user dismisses the toast
	 * @property {string} [dismiss] the text to use for the dismiss button. If not set, a close icon will be used instead
	 */

	/** @type {Props} */
	const { type, message, action, onaction, dismiss, ondismiss } = $props();
	const Icon = $derived(
		{
			warning: IconWarning,
			error: IconError,
			success: IconSuccess,
			info: IconInfo,
			debug: IconDebug
		}[type]
	);
	const style = $derived.by(() => {
		switch (type) {
			case 'debug':
				return 'neutral';
			case 'info':
				return 'primary';
			default:
				return type;
		}
	});
</script>

<article
	class="toast"
	style:--bg="var(--bg-{style})"
	style:--fg="var(--fg-{style})"
	in:slide={{ axis: 'y', duration: 200 }}
	out:fade={{ duration: 200 }}
>
	<div class="icon"><Icon /></div>
	<p>{message}</p>
	<section class="actions">
		{#if action && onaction}
			<ButtonInk onclick={onaction}>
				{action}
			</ButtonInk>
		{/if}
		{#if dismiss}
			<ButtonInk onclick={ondismiss}>
				{dismiss}
			</ButtonInk>
		{:else}
			<button onclick={ondismiss}>
				<IconClose />
			</button>
		{/if}
	</section>
</article>

<style>
	button {
		appearance: none;
		background: none;
		border: none;
		display: flex;
		justify-content: center;
		align-items: center;
		cursor: pointer;
		padding: 0.5em;
	}

	button:is(:hover, :focus-visible) {
		background-color: rgb(from var(--fg-neutral) r g b / 0.15);
		border-radius: var(--corner-radius);
	}

	article {
		background: var(--bg-neutral);
		padding: 0.125em 1em;
		border-radius: var(--corner-radius);
		display: flex;
		border: calc(3 * var(--border-thickness)) solid var(--bg);
		color: var(--fg);
		align-items: center;
		gap: 1em;
		width: max-content;
		min-width: calc(min(200px, 100vw));
	}

	.icon {
		display: flex;
		justify-content: center;
		align-items: center;
		background: var(--bg);
		padding: 0.25em;
		border-radius: 100000px;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 1em;
	}
</style>

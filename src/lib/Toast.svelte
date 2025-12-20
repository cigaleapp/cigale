<!-- 
@component Displays a notification message to the user above the page.
-->

<script module>
	import IconDebug from '~icons/ri/bug-2-line';
	import IconSuccess from '~icons/ri/check-line';
	import IconError from '~icons/ri/close-line';
	import IconInfo from '~icons/ri/information-2-line';
	import IconWarning from '~icons/ri/triangle-line';

	/**
	 * @param {import('$lib/toasts.svelte.js').Toast<any>['type']} type
	 */
	export function toastIcon(type) {
		switch (type) {
			case 'info':
				return IconInfo;
			case 'success':
				return IconSuccess;
			case 'warning':
				return IconWarning;
			case 'error':
				return IconError;
			case 'debug':
				return IconDebug;
		}
	}

	/**
	 * @param {import('$lib/toasts.svelte.js').Toast<any>['type']} type
	 */
	export function toastTheme(type) {
		switch (type) {
			case 'info':
				return 'primary';
			case 'success':
				return 'success';
			case 'warning':
				return 'warning';
			case 'error':
				return 'error';
			case 'debug':
				return 'secondary';
		}
	}
</script>

<script generics="T">
	import { fade, slide } from 'svelte/transition';

	import IconClose from '~icons/ri/close-line';

	import ButtonInk from './ButtonInk.svelte';

	/**
	 * @typedef Toast
	 * @type {import('$lib/toasts.svelte').Toast<T>}
	 */

	/**
	 * @typedef Props
	 * @property {string} message the toast to display
	 * @property {Toast['type']} type the type of toast to display
	 * @property {URL | (() => void) | undefined} onaction the action to perform when the user interacts with the toast
	 * @property {string|undefined} [action] the text to use for the action button
	 * @property {(() => void) | undefined} ondismiss the action to perform when the user dismisses the toast
	 * @property {string|undefined} [dismiss] the text to use for the dismiss button. If not set, a close icon will be used instead
	 */

	/** @type {Props} */
	const { type, message, action, onaction, dismiss, ondismiss = () => {} } = $props();
</script>

<article
	class="toast"
	data-type={type}
	style:--bg="var(--bg-{toastTheme(type)})"
	style:--fg="var(--fg-{toastTheme(type)})"
	in:slide={{ axis: 'y', duration: 200 }}
	out:fade={{ duration: 200 }}
>
	<div class="icon">
		{#await toastIcon(type) then Icon}
			<Icon />
		{/await}
	</div>
	<p>{message}</p>
	<section class="actions">
		{#if action}
			{#if onaction instanceof URL}
				<ButtonInk href={onaction}>
					{action}
				</ButtonInk>
			{:else if onaction}
				<ButtonInk onclick={onaction}>
					{action}
				</ButtonInk>
			{/if}
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
		padding: 0.5em 1em;
		border-radius: var(--corner-radius);
		display: flex;
		border: calc(3 * var(--border-thickness)) solid var(--bg);
		color: var(--fg);
		align-items: center;
		gap: 0.25em 1em;
		width: max-content;
		min-width: calc(min(200px, 100vw));
		max-width: calc(100vw - 2em);
	}

	p {
		margin: 0;
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

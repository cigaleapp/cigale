<!-- 
@component Displays a notification message to the user above the page.
-->

<script generics="T">
	import IconDebug from '~icons/ph/bug';
	import IconSuccess from '~icons/ph/check';
	import IconInfo from '~icons/ph/info';
	import IconWarning from '~icons/ph/warning';
	import { default as IconClose, default as IconError } from '~icons/ph/x';

	/**
	 * @typedef Props
	 * @property {string} message the toast to display
	 * @property {import('$lib/toasts.svelte').Toast<T>['type']} type the type of toast to display
	 * @property {?() => void} onaction the action to perform when the user interacts with the toast
	 * @property {?string} action the text to use for the action button
	 * @property {?() => void} ondismiss the action to perform when the user dismisses the toast
	 * @property {?string} dismiss the text to use for the dismiss button. If not set, a close icon will be used instead
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

<article class="toast" style:--bg="var(--bg-{style})" style:--fg="var(--fg-{style})">
	<div class="icon"><Icon /></div>
	<p>{message}</p>
	<section class="actions">
		{#if action && onaction}
			<!-- TODO: Use ButtonInk -->
			<button onclick={onaction}>
				{action}
			</button>
		{/if}
		<!-- TODO: Use ButtonInk / ButtonIcon -->
		<button onclick={ondismiss}>
			{#if dismiss}
				{dismiss}
			{:else}
				<IconClose />
			{/if}
		</button>
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

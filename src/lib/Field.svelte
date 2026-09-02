<script>
	import 'svelte';

	import IconError from '~icons/ri/close-line';
	import IconWarning from '~icons/ri/triangle-line';

	import { componentOrSnippet } from './componentOrSnippet.svelte';

	/**
	 * @import { Snippet, Component } from 'svelte';
	 *
	 * @typedef {object} Props
	 * @property {string | Snippet} label
	 * @property {boolean} [compact] put label and content side by side
	 * @property {string | Snippet} [error] a error message to display. Takes precedence over hint
	 * @property {string | Snippet} [warning] just like error but shown as a warning instead
	 * @property {string | Snippet} [hint]
	 * @property {undefined | Component } [Icon]
	 * @property {undefined | Snippet} [icon]
	 * @property {boolean} [indent-icon=true] if true, the contents below the label will be indented to align with the label's text, putting the icon outside the indentation. Only has an effect if an icon is provided.
	 * @property {boolean} [composite=false] if true, the children will not be wrapped in a label element. useful when the children is composed of multiple inputs.
	 * @property {Snippet} children
	 */

	/** @type {Props} */
	const {
		label,
		hint,
		error,
		warning,
		children,
		composite,
		compact,
		icon,
		Icon,
		'indent-icon': indentIcon = true,
	} = $props();
</script>

<div class="field" class:has-icon={Icon || icon} class:indent-icon={indentIcon} class:compact>
	{#if indentIcon}
		<div class="icon">
			{@render componentOrSnippet(Icon, icon)}
		</div>
	{/if}

	<div class="main">
		<svelte:element this={composite ? 'div' : 'label'}>
			<div class="label">
				{#if !indentIcon}
					<div class="icon">{@render componentOrSnippet(Icon, icon)}</div>
				{/if}
				{#if typeof label === 'string'}
					{label}
				{:else}
					{@render label()}
				{/if}
			</div>
			{@render children()}
		</svelte:element>
		{#if error}
			<div class="hint error">
				<IconError />
				<div class="content">
					{#if typeof error === 'string'}
						{error}
					{:else}
						{@render error()}
					{/if}
				</div>
			</div>
		{:else if warning}
			<div class="hint warning">
				<IconWarning />
				<div class="content">
					{#if typeof warning === 'string'}
						{warning}
					{:else}
						{@render warning()}
					{/if}
				</div>
			</div>
		{:else if hint}
			<div class="hint">
				{#if typeof hint === 'string'}
					{hint}
				{:else}
					{@render hint()}
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.field {
		width: 100%;
		display: flex;
	}

	.field.compact > .main > :first-child {
		display: flex;
		gap: 0.5em;
		align-items: center;
	}

	.field.has-icon {
		gap: 0.5em;
	}

	.main {
		width: 100%;
	}

	.field .label {
		text-transform: uppercase;
		letter-spacing: 1px;
		font-weight: bold;
		font-size: 0.9em;
	}

	.field:not(.compact) .label {
		margin-bottom: 0.5em;
	}

	.field .label :global(p) {
		text-transform: none;
		letter-spacing: normal;
		font-weight: normal;
		font-size: 1rem;
	}

	.field.has-icon:not(.indent-icon) .label {
		margin-bottom: 1em;
	}

	.label .icon {
		display: inline-block;
		margin-right: 0.25ch;
		font-size: 1.1em;
		height: 1.1lh;
		vertical-align: middle;
	}

	.hint:is(.error, .warning) {
		display: flex;
		align-items: center;
		gap: 0.5em;
		font-size: 0.9em;
		margin-top: 0.5em;

		&.error {
			color: var(--fg-error);
		}

		&.warning {
			color: var(--fg-warning);
		}
	}

	.hint.error:has(.content:empty) {
		opacity: 0;
	}
</style>

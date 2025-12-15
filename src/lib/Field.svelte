<script lang="ts">
	import 'svelte';

	import IconError from '~icons/ri/close-line';

	/**
	 * @import { Snippet, Component } from 'svelte';
	 *
	 * @typedef {object} Props
	 * @property {string | Snippet} label
	 * @property {string | Snippet} [error] a error message to display. Takes precedence over hint
	 * @property {string | Snippet} [hint]
	 * @property {undefined | Component } [Icon]
	 * @property {undefined | Snippet} [icon]
	 * @property {boolean} [composite=false] if true, the children will not be wrapped in a label element. useful when the children is composed of multiple inputs.
	 * @property {Snippet} children
	 */

	/** @type {Props} */
	const { label, hint, error, children, composite, icon, Icon } = $props();
</script>

<div class="field" class:has-icon={Icon || icon}>
	<div class="icon">
		{#if Icon}
			<Icon />
		{:else if icon}
			{@render icon()}
		{/if}
	</div>

	<div class="main">
		<svelte:element this={composite ? 'div' : 'label'}>
			<div class="label">
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
		margin-bottom: 0.5em;
	}

	.field .label :global(p) {
		text-transform: none;
		letter-spacing: normal;
		font-weight: normal;
		font-size: 1rem;
	}

	.hint.error {
		color: var(--fg-error);
		display: flex;
		align-items: center;
		gap: 0.5em;
		font-size: 0.9em;
		margin-top: 0.5em;
	}

	.hint.error:has(.content:empty) {
		opacity: 0;
	}
</style>

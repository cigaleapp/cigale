<script lang="ts">
	import IconSuccess from '~icons/ri/check-line';
	import IconFail from '~icons/ri/close-line';
	import IconOpenExternal from '~icons/ri/external-link-fill';
	import IconChecking from '~icons/ri/more-fill';

	import ButtonIcon from './ButtonIcon.svelte';
	import Field from './Field.svelte';
	import InlineTextInput from './InlineTextInput.svelte';

	/**
	 * @import { Component, Snippet } from 'svelte';
	 */

	/**
	 * @typedef {object} Props
	 * @property {string} label
	 * @property {string} [hint]
	 * @property {string} value
	 * @property {boolean} [check]
	 * @property {Component} [Icon]
	 * @property {Snippet} [icon]
	 * @property {(newValue: string, setValue: (value: string) => void) => void } onblur
	 */

	/** @type {Props} */
	const { label, hint: hintprefix, icon, Icon, value, onblur, check = false } = $props();
</script>

<Field {label} {icon} {Icon}>
	<div class="input-and-actions">
		<InlineTextInput {label} {value} {onblur} />
		<ButtonIcon
			help="Ouvrir le lien"
			onclick={() => {
				window.open(value, '_blank');
			}}
		>
			<IconOpenExternal />
		</ButtonIcon>
	</div>

	{#snippet hint()}
		{#if hintprefix}
			{hintprefix} ·
		{/if}
		{#if value && check}
			<div class="hint">
				{#await fetch(value, { method: 'HEAD' })}
					<div class="check loading">
						<IconChecking />
						Vérification…
					</div>
				{:then response}
					{#if response.ok}
						<div class="check ok">
							<IconSuccess />
							Accessible
						</div>
					{:else}
						<div class="check fail">
							<IconFail />
							Inaccessible: HTTP {response.status}
							{#await response.text() then text}{text}{/await}
						</div>
					{/if}
				{:catch error}
					<div class="check fail">
						<IconFail />
						Inaccessible: {error}
					</div>
				{/await}
			</div>
		{/if}
	{/snippet}
</Field>

<style>
	.check {
		display: flex;
		align-items: center;
		gap: 0.25em;
		font-size: 0.9em;
	}

	.check.ok {
		color: var(--fg-success);
	}

	.check.fail {
		color: var(--fg-error);
	}

	.input-and-actions {
		display: flex;
		align-items: center;
		gap: 0.25em;
		width: 100%;
	}
</style>

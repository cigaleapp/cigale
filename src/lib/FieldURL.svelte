<script>
	import Field from './Field.svelte';
	import InlineTextInput from './InlineTextInput.svelte';
	import IconSuccess from '~icons/ph/check';
	import IconFail from '~icons/ph/x';
	import IconChecking from '~icons/ph/dots-three';

	/**
	 * @typedef {object} Props
	 * @property {string} label
	 * @property {string} [hint]
	 * @property {string} value
	 * @property {(newValue: string, setValue: (value: string) => void) => void } onblur
	 */

	/** @type {Props} */
	const { label, hint: hintprefix, value, onblur } = $props();
</script>

<Field {label}>
	<InlineTextInput {label} {value} {onblur} />

	{#snippet hint()}
		{#if hintprefix}
			{hintprefix} ·
		{/if}
		{#if value}
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
</style>

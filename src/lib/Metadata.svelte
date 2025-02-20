<script>
	import Checkbox from './Checkbox.svelte';
	import RadioButtons from './RadioButtons.svelte';

	let { value = $bindable(), children, type, options = [] } = $props();
</script>

<div class="meta">
	<label>{@render children()}</label>

	{#if type === 'date'}
		<input class="date" type="date" bind:value />
	{:else if type === 'enumeration'}
		<RadioButtons {options} bind:value name=""></RadioButtons>
	{:else if type === 'number'}
		<input type="text" bind:value />
		<div class="ligne"></div>
	{:else if type === 'boolean'}
		<Checkbox bind:value>
			<div class="niOuiNiNon">
				{#if value}
					Oui
				{:else}
					Non
				{/if}
			</div>
		</Checkbox>
	{:else}
		<input type="text" bind:value />
		<div class="ligne"></div>
	{/if}
</div>

<style>
	.meta {
		gap: 0.1em;
		display: flex;
		flex-direction: column;
	}

	label {
		color: var(--gray);
		text-transform: uppercase;
		font-weight: bold;
		font-size: 0.75em;
	}

	.ligne {
		height: 2px;
		background-color: var(--bg-neutral);
		display: flex;
	}

	input {
		outline: none;
		border: none;
	}

	.meta:hover .ligne {
		background-color: var(--fg-neutral);
	}

	.meta:focus-within .ligne {
		background-color: var(--bg-primary);
	}

	.meta:focus-within label {
		color: var(--fg-neutral);
	}

	.niOuiNiNon {
		color: var(--gay);
	}

	.niOuiNiNon:hover {
		color: var(--fg-neutral);
	}
	.date {
		color: var(--gay);
	}

	.date:hover {
		color: var(--fg-neutral);
	}
</style>

<script>
	let { value = $bindable(), children } = $props();
</script>

<div class="meta">
	<div class="label">{@render children()}</div>
	<textarea class="zone" bind:value placeholder="Entrez une valeur"></textarea>
	<rect class="ligne"></rect>
</div>

<style>
	.meta {
		gap: 0.1em;
	}

	.label {
		color: var(--gray);
		text-transform: uppercase;
		font-weight: bold;
		font-size: 0.75em;
	}

	.ligne {
		height: 2px;
		width: 100px;
		background-color: var(--bg-neutral);
		display: flex;
	}

	.zone {
		width: 100px;
		height: 1em;
		border: none;
		resize: none;
	}

	.zone:focus-visible {
		outline: none;
		color: var(--bg-primary);
	}

	.zone:focus-visible::placeholder {
		color: var(--gray);
	}

	.meta:hover .ligne {
		background-color: var(--fg-neutral);
	}

	.meta:focus-within .ligne {
		background-color: var(--bg-primary);
	}

	.meta:focus-within .label {
		color: var(--fg-neutral);
	}
</style>

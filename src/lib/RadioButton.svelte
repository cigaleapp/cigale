<script>
	let { options, name, value = $bindable() } = $props();
</script>

<br />
{#each options as option}
	<label>
		<input type="radio" {name} value={option} bind:group={value} />
		{option}
	</label>
{/each}
<br />
Vous avez choisi l'option {value} félicitation

<style>
	:root {
		--accent-color: CornflowerBlue;
		--color: var(--bg-primary); /*à remplacer avec --bg-primary */
	}

	input[type='radio'] {
		accent-color: var(--color);
		color: --bg-neutral;
		display: flex;
	}
	input[type='radio']:hover {
		color: var(--color);
		border-radius: 50%;
		box-shadow: 0 0 8px var(--color);
	}
</style>

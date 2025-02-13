<script>
	let { options, name, value } = $props();
</script>

<br />
{#each options as option}
	<label>
		<input type="radio" {name} value={option} bind:group={value} />
		{option}
	</label><br />
{/each}
Vous avez choisi l'option {value} félicitation

<style>
	:root {
		--accent-color: CornflowerBlue;
		--color: #30b9b3;
	}

	input[type='radio'] {
		accent-color: var(--color);
		color: white;
	}
</style>

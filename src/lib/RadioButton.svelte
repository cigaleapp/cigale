<script>
	let { options, name } = $props();
	let resultat = $state(1);
</script>

<br />
{#each options as option}
	<label>
		<input type="radio" {name} value={option} bind:group={resultat} />
		{option}
	</label><br />
{/each}
Vous avez choisi l'option {resultat} félicitation

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

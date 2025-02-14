<script>
	let { options, name, value = $bindable() } = $props();
</script>

{#each options as option}
	<div class="radio">
		<input type="radio" {name} value={option} style="align-items: center;" bind:group={value} />
		{option}
	</div>
{/each}
<br />
Vous avez choisi l'option {value} félicitation

<style>
	:root {
		--accent-color: CornflowerBlue;
		--color: var(--bg-primary);
	}

	input[type='radio'] {
		accent-color: var(--color);
		color: --bg-neutral;
		align-items: center;
	}
	input[type='radio']:hover {
		color: var(--color);
		border-radius: 50%;
		box-shadow: 0 0 8px var(--color);
	}

	.radio {
		align-items: center;
	}
</style>

<script>
	let { options, name } = $props()
</script>

<br />
{#each options as option}
	<label>
		<input type="radio" {name} value={option} />
		{option}
	</label><br />
{/each}

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

<br />
{#each [1, 2, 3] as number}
	<label>
		<input type="radio" name="scoops" value={number} />

		{number}
		{number === 1 ? 'scoop' : 'scoops'}
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

<script>
	let { options, name, value = $bindable() } = $props();
</script>

{#each options as option}
	<div>
		<label class="radio">
			<input type="radio" {name} value={option} style="align-items: center;" bind:group={value} />
			{option}
		</label>
	</div>
{/each}

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
	}

	.radio {
		align-items: center;
	}
</style>

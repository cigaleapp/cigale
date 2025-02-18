<script>
	let { options, name, value = $bindable() } = $props();
</script>

{#each options as option}
	<div>
		<label class="radio">
			<input type="radio" {name} value={option} bind:group={value} />
			{option}
		</label>
	</div>
{/each}

<style>
	input[type='radio'] {
		accent-color: var(--bg-primary);
		color: var(--bg-neutral);
		align-items: center;
	}
	
	input[type='radio']:hover {
		color: var(--bg-primary);
		border-radius: 50%;
	}

	.radio {
		align-items: center;
	}
</style>

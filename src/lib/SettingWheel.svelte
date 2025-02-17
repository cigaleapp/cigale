<script>
	import Icon from '~icons/ph/gear-light';
	let isActive = false;

	function handleClick() {
		isActive = !isActive;
	}
</script>

<div class="container" aria-pressed={isActive}>
	<button class:isActive onclick={handleClick} aria-pressed={isActive} type="button">
		<Icon />
	</button>
</div>

<style>
	button {
		position: fixed;
		display: flex;
		color: var(--color);
		background: none;
		border: none;
		cursor: pointer;
	}

	button:hover {
		color: var(--bg-primary);
	}

	button[aria-pressed="true"] {
		position: fixed;
		display: flex;
		color: red;
		transform: rotate(360deg);
		transition: transform 1s ease-in-out;
	}

	.container[aria-pressed='true'] {
		background-color: var(--bg-primary);
		position: fixed;
		display: inline-block;
		background-color: var(--bg-primary);
		transition: background-color 1s ease-in-out;
	}
</style>

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
	{#if isActive}
		<div class="dropdown-menu">
			<p>Paramètres</p>
			<p>Langues</p>
			<p>Quitter</p>
		</div>
	{/if}
</div>

<style>
	button {
		position: absolute;
		display: flex;
		align-items: center;
		color: var(--bg-primary);
		border: none;
		cursor: pointer;
		background: none;
	}

	button:hover {
		color: var(--bg-primary);
	}

	button[aria-pressed='true'] {
		position: absolute;
		color: red;
		transform: rotate(360deg);
		transition: transform 1s ease-in-out;
	}

	.dropdown-menu {
		position: absolute;
		top: 8rem;
		background-color: var(--bg-primary);
		color: var(--text-primary);
		border-radius: 0.5rem;
		padding: 0.5rem;
	}
</style>

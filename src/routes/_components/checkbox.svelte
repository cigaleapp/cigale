<!-- ici mettre class:checked={value} pour avoir la classe checked seulement quand c'est coché -->
<script>
	export let value = false;
	import Icon from '~icons/ph/check-light';
</script>

<label class:checked={value}>
	<div class="box">
		<!-- ici mettre un {#if value} pour afficher la coche que quand c'est coché, et utiliser le composant (attendre que les icones soit setup) -->
		{#if value}
			<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
				<rect
					x="0"
					y="0"
					width="24"
					height="24"
					fill="var(--bg-primary)"
					stroke="var(--fg-neutral)"
					stroke-width="2"
				/>
			</svg>
			<Icon width="20" height="20" style="position: absolute;  color: var(--fg-primary);" />
		{:else}
			<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
				<rect
					x="0"
					y="0"
					width="24"
					height="24"
					fill="none"
					stroke="var(--fg-neutral)"
					stroke-width="2"
				/>
			</svg>
		{/if}
	</div>

	<input type="checkbox" bind:checked={value} />
	hello
</label>

<style>
	/* Cacher l'input natif */
	input {
		display: none;
	}

	/* Styliser notre boite */
	.box {
		border-radius: 3px;
		background-color: var(--bg-neutral);
		padding: 0.25em;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	/* Mettre la boite et le texte à coté */
	label {
		display: flex;
		align-items: center;
	}
</style>

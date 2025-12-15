<script lang="ts">
	//export let value = false;
	import Icon from '~icons/ri/check-line';

	/**
	 * @typedef {object} Props
	 * @property {boolean} [value]
	 * @property {(value: boolean) => void} [onchange]
	 * @property {import('svelte').Snippet} children
	 */

	/** @type {Props & Record<string, any>} */
	let { children, value = $bindable(), onchange = () => {}, ...rest } = $props();

	$effect(() => {
		if (value === undefined) return;
		onchange(value);
	});
</script>

<label class:checked={value}>
	<div class="box">
		<!-- ici mettre un {#if value} pour afficher la coche que quand c'est coché, et utiliser le composant (attendre que les icones soit setup) -->
		{#if value}
			<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
				<rect
					x="1"
					y="1"
					width="22"
					height="22"
					fill="var(--bg-primary)"
					stroke="var(--fg-neutral)"
					stroke-width="1"
					rx="4"
				/>
			</svg>
			<Icon width="20" height="20" style="position: absolute;  color: var(--fg-primary);" />
		{:else}
			<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
				<rect
					x="1"
					y="1"
					width="22"
					height="22"
					fill="none"
					stroke="var(--fg-neutral)"
					stroke-width="1"
					rx="4"
				/>
			</svg>
		{/if}
	</div>

	<input {...rest} type="checkbox" bind:checked={value} />
	{@render children()}
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
		position: relative;
	}

	/* Mettre la boite et le texte à coté */
	label {
		display: flex;
		align-items: center;
	}
</style>

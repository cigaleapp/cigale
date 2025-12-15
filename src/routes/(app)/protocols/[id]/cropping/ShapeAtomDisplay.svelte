<script lang="ts">
	import * as Math from 'svelte-mathml';

	/**
	 * @type {{atom: string}}
	 */
	const { atom } = $props();

	const isVariable = $derived(!['score', '_', 'delete', ''].includes(atom));
</script>

<span class="atom" class:text={!isVariable} class:math={isVariable}>
	{#if isVariable && atom.length === 2}
		<math>
			<Math.Line><Math.Scripts base={atom[0]} sub={atom[1]} /></Math.Line>
		</math>
	{:else if isVariable}
		<math>
			<Math.Line><Math.Atom expr={atom} /></Math.Line>
		</math>
	{:else}
		{atom}
	{/if}
</span>

<style>
	.atom {
		text-align: center;
		font-weight: normal;

		&.math {
			font-size: 1.3em;
		}
	}
</style>

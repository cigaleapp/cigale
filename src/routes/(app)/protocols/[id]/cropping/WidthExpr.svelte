<script>
	import * as Math from '$lib/mathml';
	import { tooltip } from '$lib/tooltips';

	/**
	 * @typedef {object} Props
	 * @property {typeof import('$lib/schemas/protocols.js').ModelDetectionOutputShape.infer} shape
	 */

	/** @type {Props} */
	const { shape } = $props();

	/**
	 * @param {Array<typeof shape[number]>} atoms
	 */
	function shapeHas(...atoms) {
		return atoms.every((a) => shape.includes(a));
	}
</script>

<Math.Line>
	{#if shapeHas('w')}
		<Math.Atom expr="w" />
	{:else if shapeHas('sx', 'ex')}
		<Math.Subtract>
			{#snippet lhs()}
				<Math.Scripts base="e" sub="x" />
			{/snippet}
			{#snippet rhs()}
				<Math.Scripts base="s" sub="x" />
			{/snippet}
		</Math.Subtract>
	{:else if shapeHas('cx', 'ex') || shapeHas('cx', 'sx')}
		<Math.Atom expr="2" />
		<Math.Wrap with="()">
			<Math.Subtract>
				{#snippet lhs()}
					<Math.Scripts base={shapeHas('ex') ? 'e' : 'c'} sub="x" />
				{/snippet}
				{#snippet rhs()}
					<Math.Scripts base={shapeHas('cx') ? 'c' : 's'} sub="x" />
				{/snippet}
			</Math.Subtract>
		</Math.Wrap>
	{:else}
		<span
			class="invalid"
			use:tooltip={"Impossible de déterminer la largeur. Il manque l'une des grandeurs suivantes: (w) ou (sx et ex) ou (cx et ex) ou (cx et sx)"}
		>
			Invalide
		</span>
	{/if}
</Math.Line>

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
	{#if shapeHas('h')}
		<Math.Atom expr="h" />
	{:else if shapeHas('sy', 'ey')}
		<Math.Subtract>
			{#snippet lhs()}
				<Math.Scripts base="e" sub="y" />
			{/snippet}
			{#snippet rhs()}
				<Math.Scripts base="s" sub="y" />
			{/snippet}
		</Math.Subtract>
	{:else if shapeHas('cy', 'ey') || shapeHas('cy', 'sy')}
		<Math.Atom expr="2" />
		<Math.Wrap with="()">
			<Math.Subtract>
				{#snippet lhs()}
					<Math.Scripts base={shapeHas('ey') ? 'e' : 'c'} sub="y" />
				{/snippet}
				{#snippet rhs()}
					<Math.Scripts base={shapeHas('cy') ? 'c' : 's'} sub="y" />
				{/snippet}
			</Math.Subtract>
		</Math.Wrap>
	{:else}
		<span
			class="invalid"
			use:tooltip={"Impossible de déterminer la largeur. Il manque l'une des grandeurs suivantes: (w) ou (sy et ey) ou (cy et ey) ou (cy et sy)"}
		>
			Invalide
		</span>
	{/if}
</Math.Line>

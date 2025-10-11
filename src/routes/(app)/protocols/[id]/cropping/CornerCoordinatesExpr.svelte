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

<Math.Vector>
	{#snippet x()}
		{#if shapeHas('cx', 'w')}
			<Math.Add>
				{#snippet lhs()}
					<Math.Scripts base="c" sub="x" />
				{/snippet}
				{#snippet rhs()}
					<Math.Fraction numerator="w" denominator="2" />
				{/snippet}
			</Math.Add>
		{:else if shapeHas('ex')}
			<Math.Scripts base="e" sub="x" />
		{:else if shapeHas('sx', 'w')}
			<Math.Add>
				{#snippet lhs()}
					<Math.Scripts base="s" sub="x" />
				{/snippet}
				{#snippet rhs()}
					<Math.Atom expr="w" />
				{/snippet}
			</Math.Add>
		{:else if shapeHas('sx', 'cx')}
			<Math.Add>
				{#snippet lhs()}
					<Math.Scripts base="s" sub="x" />
				{/snippet}
				{#snippet rhs()}
					<Math.Atom expr="2" />
					<Math.Wrap with="()">
						<Math.Subtract>
							{#snippet lhs()}
								<Math.Scripts base="c" sub="x" />
							{/snippet}
							{#snippet rhs()}
								<Math.Scripts base="s" sub="x" />
							{/snippet}
						</Math.Subtract>
					</Math.Wrap>
				{/snippet}
			</Math.Add>
		{:else}
			<span
				class="invalid"
				use:tooltip={"Impossible de déterminer cette coordonnée. Il manque l'une des grandeurs suivantes: (cx et w) ou (ex) ou (sx et w)"}
			>
				Invalide
			</span>
		{/if}
	{/snippet}
	{#snippet y()}
		{#if shapeHas('cy', 'h')}
			<Math.Add>
				{#snippet lhs()}
					<Math.Scripts base="c" sub="y" />
				{/snippet}
				{#snippet rhs()}
					<Math.Fraction numerator="h" denominator="2" />
				{/snippet}
			</Math.Add>
		{:else if shapeHas('ey')}
			<Math.Scripts base="e" sub="y" />
		{:else if shapeHas('sy', 'h')}
			<Math.Add>
				{#snippet lhs()}
					<Math.Scripts base="s" sub="y" />
				{/snippet}
				{#snippet rhs()}
					<Math.Atom expr="h" />
				{/snippet}
			</Math.Add>
		{:else if shapeHas('sy', 'cy')}
			<Math.Add>
				{#snippet lhs()}
					<Math.Scripts base="s" sub="y" />
				{/snippet}
				{#snippet rhs()}
					<Math.Atom expr="2" />
					<Math.Wrap with="()">
						<Math.Subtract>
							{#snippet lhs()}
								<Math.Scripts base="c" sub="y" />
							{/snippet}
							{#snippet rhs()}
								<Math.Scripts base="s" sub="y" />
							{/snippet}
						</Math.Subtract>
					</Math.Wrap>
				{/snippet}
			</Math.Add>
		{:else}
			<span
				class="invalid"
				use:tooltip={"Impossible de déterminer cette coordonnée. Il manque l'une des grandeurs suivantes: (cy et h) ou (ey) ou (sy et h)"}
			>
				Invalide
			</span>
		{/if}
	{/snippet}
</Math.Vector>

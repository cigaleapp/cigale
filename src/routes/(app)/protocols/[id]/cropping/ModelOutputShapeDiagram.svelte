<script>
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import { MODEL_DETECTION_OUTPUT_SHAPES } from '$lib/schemas/protocols.js';
	import { tooltip } from '$lib/tooltips';
	import { entries } from '$lib/utils.js';
	import { Popover } from 'bits-ui';
	import IconAdd from '~icons/ph/plus';
	import IconTrash from '~icons/ph/trash';
	import MathMLVector from './MathMLVector.svelte';
	import ShapeAtomDisplay from './ShapeAtomDisplay.svelte';

	/**
	 * @typedef {typeof import('$lib/schemas/protocols.js').ModelDetectionOutputShape.infer[number]} Atom
	 */

	/**
	 * @typedef {object} Props
	 * @property {Atom[]} shape
	 * @property {(i: number) => Promise<void>} ondelete
	 * @property {(i: number, newAtom: Atom) => Promise<void>} onchange
	 * @property {(newAtom: Atom) => Promise<void>} onadd
	 */

	/** @type {Props} */
	const { shape, ondelete, onchange, onadd } = $props();

	function shapeHas(...atoms) {
		return atoms.every((a) => shape.includes(a));
	}
</script>

<div class="diagram">
	<div class="network" style:--shape-length={shape.length}>
		<div class="node faded start">
			<div class="weight"></div>
			<div class="weight"></div>
			<div class="weight"></div>
			<div class="weight"></div>
			<div class="neuron"></div>
			<div class="label"></div>
		</div>
		{#each [...shape, ''] as dim, i (i)}
			<div class="node">
				<div class="weight"></div>
				<div class="weight"></div>
				<div class="weight"></div>
				<div class="weight"></div>

				<div class="neuron"></div>

				<div class="label">
					<Popover.Root>
						<Popover.Trigger>
							{#snippet child({ props })}
								{#if dim}
									<button
										use:tooltip={"Change l'élément"}
										class="open-atom-picker"
										{...props}
									>
										<ShapeAtomDisplay atom={dim} />
									</button>
								{:else}
									<ButtonIcon help="Ajouter un élément" {...props}>
										<IconAdd />
									</ButtonIcon>
								{/if}
							{/snippet}
						</Popover.Trigger>

						<Popover.Content>
							{#each entries(MODEL_DETECTION_OUTPUT_SHAPES) as [atom, { help }]}
								<ButtonIcon
									{help}
									onclick={() => {
										if (dim === '') {
											onadd(atom);
										} else {
											onchange(i, atom);
										}
									}}
								>
									<ShapeAtomDisplay {atom} />
								</ButtonIcon>
							{/each}
							<div class="spacer"></div>
							<ButtonIcon
								help="Supprimer cet élément"
								dangerous
								onclick={() => {
									if (dim === '') return;
									ondelete(i);
								}}
							>
								<IconTrash />
							</ButtonIcon>
						</Popover.Content>
					</Popover.Root>
				</div>
			</div>
		{/each}
		<div class="node faded end">
			<div class="weight"></div>
			<div class="weight"></div>
			<div class="weight"></div>
			<div class="weight"></div>
			<div class="neuron"></div>
			<div class="label"></div>
		</div>
	</div>

	<div class="sep">
		<svg
			width="2em"
			height="1em"
			viewBox="0 0 68 32"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M1.39844 15.8231L8.89576 8.3258L22.1662 21.5962L35.4366 8.3258L42.9339 15.8231H64.1324M64.1324 15.8231C64.1324 15.8231 52.9299 8.3258 52.9299 0.56543M64.1324 15.8231C64.1324 15.8231 52.9299 21.5962 52.9299 31.285"
				stroke="var(--fg-neutral)"
				stroke-width="2px"
			/>
		</svg>
	</div>

	<div class="bounding-box">
		<math class="scale-label height math">
			{#if shapeHas('h')}
				<mi>h</mi>
			{:else if shapeHas('sy', 'ey')}
				<mrow>
					<msub>
						<mi>e</mi>
						<mi>y</mi>
					</msub>
					<mo>-</mo>
					<msub>
						<mi>s</mi>
						<mi>y</mi>
					</msub>
				</mrow>
			{:else if shapeHas('cy', 'ey') || shapeHas('cy', 'sy')}
				<mrow>
					<mn>2</mn>
					<mo fence="true" form="prefix">(</mo>
					{#if shapeHas('cy', 'ey')}
						<msub>
							<mi>e</mi>
							<mi>y</mi>
						</msub>
						<mo>-</mo>
						<msub>
							<mi>c</mi>
							<mi>y</mi>
						</msub>
					{:else}
						<msub>
							<mi>c</mi>
							<mi>y</mi>
						</msub>
						<mo>-</mo>
						<msub>
							<mi>s</mi>
							<mi>y</mi>
						</msub>
					{/if}
					<mo fence="true" form="postfix">)</mo>
				</mrow>
			{:else}
				<span
					class="invalid"
					use:tooltip={"Impossible de déterminer la hauteur. Il manque l'une des grandeurs suivantes: (h) ou (sy et ey) ou (cy et ey) ou (cy et sy)"}
				>
					Invalide
				</span>
			{/if}
		</math>
		<div class="scale height"></div>

		<math class="scale-label width math">
			{#if shapeHas('w')}
				<mi>w</mi>
			{:else if shapeHas('sx', 'ex')}
				<mrow>
					<msub>
						<mi>e</mi>
						<mi>x</mi>
					</msub>
					<mo>-</mo>
					<msub>
						<mi>s</mi>
						<mi>x</mi>
					</msub>
				</mrow>
			{:else if shapeHas('cx', 'ex') || shapeHas('cx', 'sx')}
				<mrow>
					<mn>2</mn>
					<mo fence="true" form="prefix">(</mo>
					{#if shapeHas('cx', 'ex')}
						<msub>
							<mi>e</mi>
							<mi>x</mi>
						</msub>
						<mo>-</mo>
						<msub>
							<mi>c</mi>
							<mi>x</mi>
						</msub>
					{:else}
						<msub>
							<mi>c</mi>
							<mi>x</mi>
						</msub>
						<mo>-</mo>
						<msub>
							<mi>s</mi>
							<mi>x</mi>
						</msub>
					{/if}
					<mo fence="true" form="postfix">)</mo>
				</mrow>
			{:else}
				<span
					class="invalid"
					use:tooltip={"Impossible de déterminer la largeur. Il manque l'une des grandeurs suivantes: (w) ou (sx et ex) ou (cx et ex) ou (cx et sx)"}
				>
					Invalide
				</span>
			{/if}
		</math>
		<div class="scale width"></div>

		<div class="box">
			<div class="cross">
				<div class="line horizontal"></div>
				<div class="line vertical"></div>
			</div>

			<div class="corner-coordinates">
				<MathMLVector>
					{#snippet x()}
						{#if shapeHas('cx', 'w')}
							<mrow>
								<msub>
									<mi>c</mi>
									<mi>x</mi>
								</msub>
								<mo>+</mo>
								<mfrac>
									<mi>w</mi>
									<mn>2</mn>
								</mfrac>
							</mrow>
						{:else if shapeHas('ex')}
							<msub>
								<mi>e</mi>
								<mi>x</mi>
							</msub>
						{:else if shapeHas('sx', 'w')}
							<mrow>
								<msub>
									<mi>s</mi>
									<mi>x</mi>
								</msub>
								<mo>+</mo>
								<mi>w</mi>
							</mrow>
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
							<mrow>
								<msub>
									<mi>c</mi>
									<mi>y</mi>
								</msub>
								<mo>+</mo>
								<mfrac>
									<mi>h</mi>
									<mn>2</mn>
								</mfrac>
							</mrow>
						{:else if shapeHas('ey')}
							<msub>
								<mi>e</mi>
								<mi>y</mi>
							</msub>
						{:else if shapeHas('sy', 'h')}
							<mrow>
								<msub>
									<mi>s</mi>
									<mi>y</mi>
								</msub>
								<mo>+</mo>
								<mi>h</mi>
							</mrow>
						{:else if shapeHas('sy', 'cy')}
							<mrow>
								<msub>
									<mi>s</mi>
									<mi>y</mi>
								</msub>
								<mo>+</mo>
								<mrow>
									<mn>2</mn>
									<mo fence="true" form="prefix">(</mo>
									<msub>
										<mi>c</mi>
										<mi>y</mi>
									</msub>
									<mo>-</mo>
									<msub>
										<mi>s</mi>
										<mi>y</mi>
									</msub>
									<mo fence="true" form="postfix">)</mo>
								</mrow>
							</mrow>
						{:else}
							<span
								class="invalid"
								use:tooltip={"Impossible de déterminer cette coordonnée. Il manque l'une des grandeurs suivantes: (cy et h) ou (ey) ou (sy et h)"}
							>
								Invalide
							</span>
						{/if}
					{/snippet}
				</MathMLVector>
			</div>

			<div class="corner-point"></div>
		</div>
	</div>
</div>

<div class="diagram-labels">
	<div>
		Couche de sortie du modèle
		<p class="details">Répété pour chaque boîte englobante détectée</p>
	</div>
	<div class="sep"></div>
	<div>Boîte englobante</div>
</div>

<style>
	.diagram,
	.diagram-labels {
		margin: 2em 0;
		display: grid;
		grid-template-columns: 1.5fr 4rem 3fr;
		gap: 3em;
		align-items: center;
	}

	.diagram-labels div {
		text-align: center;

		.details {
			font-size: 0.8em;
			margin-top: 0.25em;
		}
	}

	.sep {
		display: flex;
		font-size: 1.5em;
	}

	.network {
		display: flex;
		flex-direction: column;
		gap: 0.75em;
		overflow: hidden;
		min-width: 150px;

		/* height: calc((var(--shape-length, 1) * 1 + 2 * 0.5) * (35px + 0.75em / 2)); */
	}

	.node {
		display: flex;
		align-items: center;
		position: relative;
		margin-left: 30px;

		height: 35px;

		&.faded {
			opacity: 0.5;
		}
	}

	.weight {
		height: 1px;
		background: var(--fg-neutral);
		width: 50px;
		position: absolute;
		left: -50px;
		transform-origin: 30px 0;

		&:nth-child(1) {
			rotate: 35deg;
			top: -2px;
			left: -40px;
		}

		&:nth-child(2) {
			rotate: 15deg;
			top: 10px;
			left: -45px;
		}

		&:nth-child(3) {
			rotate: -15deg;
			top: 25px;
			left: -45px;
		}

		&:nth-child(4) {
			rotate: -35deg;
			top: 35px;
			left: -40px;
		}
	}

	@keyframes spin {
		from {
			rotate: 0deg;
		}
		to {
			rotate: 360deg;
		}
	}

	.neuron {
		width: 30px;
		height: 30px;
		border-radius: 50%;
		border: 1px solid var(--fg-neutral);
		background: var(--bg-neutral);
		z-index: 2;
	}

	.label {
		margin-left: 0.5em;
	}

	.bounding-box {
		position: relative;
		height: 350px;
		width: 100%;
	}

	.box {
		border: 1px solid var(--fg-neutral);
		position: absolute;
		top: 75px;
		right: 100px;
		height: 200px;
		width: 200px;
		/* background-image: url('/ant.png');
        background-size: cover; */
	}

	.scale-label {
		position: absolute;
		font-size: 1.25em;
		font-family: 'CMU Serif', serif;
		font-style: italic;

		&.width {
			top: 10px;
			right: 100px;
			width: 200px;
			text-align: center;
		}

		&.height {
			top: calc(50px + 200px / 2 - 50px);
			right: calc(100px + 200px + 50px + 25px / 2);
			width: 6rem;
			text-align: right;
		}
	}

	.scale {
		position: absolute;
		background-color: var(--fg-neutral);

		&.width {
			height: 1px;
			width: 200px;
			top: 50px;
			right: 100px;
		}

		&.height {
			width: 1px;
			height: 200px;
			top: 75px;
			right: calc(100px + 200px + 25px);
		}

		&::before,
		&::after {
			content: '';
			position: absolute;
			background-color: var(--fg-neutral);
		}

		&.height::before,
		&.height::after {
			width: 20px;
			height: 1px;
			left: calc(-20px / 2);
		}

		&.height::before {
			top: 0;
		}

		&.height::after {
			bottom: 0;
		}

		&.width::before,
		&.width::after {
			height: 20px;
			width: 1px;
			top: calc(-20px / 2);
		}

		&.width::before {
			left: 0;
		}

		&.width::after {
			right: 0;
		}
	}

	.corner-coordinates {
		position: absolute;
		right: 20px;
		bottom: 30px;
	}

	.corner-point {
		position: absolute;
		border-radius: 50%;
		width: 20px;
		height: 20px;
		background-color: var(--fg-neutral);
		right: -10px;
		bottom: -10px;
	}

	.invalid {
		color: var(--fg-error);
		font-weight: bold;
		font-style: normal;
	}

	math *:not(.invalid) {
		font-family: 'CMU Serif', serif;
	}

	mi {
		font-style: italic;
	}

	.open-atom-picker {
		background: none;
		border: none;
		cursor: pointer;
	}

	:global([data-popover-content]) {
		padding: 0.5rem;
		border-radius: var(--corner-radius);
		background-color: var(--bg-primary-translucent);
		display: grid;
		grid-template-columns: repeat(4, 5rem);
		grid-auto-rows: 5rem;
		z-index: 100;
	}
</style>

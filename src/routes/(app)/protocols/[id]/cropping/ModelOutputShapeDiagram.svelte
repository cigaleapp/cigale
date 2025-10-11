<script>
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import { MODEL_DETECTION_OUTPUT_SHAPES } from '$lib/schemas/protocols.js';
	import { tooltip } from '$lib/tooltips';
	import { entries } from '$lib/utils.js';
	import { Popover } from 'bits-ui';
	import { SvelteSet } from 'svelte/reactivity';
	import IconTrash from '~icons/ph/trash';
	import ShapeAtomDisplay from './ShapeAtomDisplay.svelte';
	import * as Math from '$lib/mathml/index.js';
	import HeightExpr from './HeightExpr.svelte';
	import WidthExpr from './WidthExpr.svelte';
	import CornerCoordinatesExpr from './CornerCoordinatesExpr.svelte';
	import MorphArrow from './MorphArrow.svelte';

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

	/** @type {Set<number>} */
	let openedPickers = $state(new SvelteSet());

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
					<Popover.Root
						bind:open={
							() => openedPickers.has(i),
							(v) => {
								if (v) openedPickers.add(i);
								else openedPickers.delete(i);
							}
						}
					>
						<Popover.Trigger>
							{#snippet child({ props })}
								<button
									{...props}
									class="open-atom-picker"
									class:create={dim === ''}
								>
									{#if dim === ''}
										Ajouter
									{:else}
										<ShapeAtomDisplay atom={dim} />
									{/if}
								</button>
							{/snippet}
						</Popover.Trigger>

						<Popover.Content align="end">
							{#each entries(MODEL_DETECTION_OUTPUT_SHAPES) as [atom, { help }] (atom)}
								<ButtonIcon
									{help}
									onclick={() => {
										openedPickers.delete(i);

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
									openedPickers.delete(i);
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
		<MorphArrow />
	</div>

	<div class="bounding-box">
		<math class="scale-label height math">
			<HeightExpr {shape} />
		</math>
		<div class="scale height"></div>

		<math class="scale-label width math">
			<WidthExpr {shape} />
		</math>
		<div class="scale width"></div>

		<div class="box">
			<div class="cross">
				<div class="line horizontal"></div>
				<div class="line vertical"></div>
			</div>

			<div class="corner-coordinates">
				<CornerCoordinatesExpr {shape} />
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

	button.create {
		color: var(--gay);
	}
</style>

<script>
	import '$lib/fonts-math/import.css';

	import { Popover } from 'bits-ui';
	import * as Math from 'svelte-mathml';
	import { SvelteSet } from 'svelte/reactivity';

	import IconTrash from '~icons/ri/delete-bin-line';
	import IconEdit from '~icons/ri/pencil-line';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import { MODEL_DETECTION_OUTPUT_SHAPES } from '$lib/schemas/neural.js';
	import { tooltip } from '$lib/tooltips';
	import { compareBy, entries } from '$lib/utils.js';

	import MorphArrow from './MorphArrow.svelte';
	import ShapeAtomDisplay from './ShapeAtomDisplay.svelte';

	/**
	 * @typedef {typeof import('$lib/schemas/neural.js').ModelDetectionOutputShape.infer} Atom
	 */

	/**
	 * @typedef {object} Props
	 * @property {Atom[]} shape
	 * @property {(i: number) => (void|Promise<void>)} ondelete
	 * @property {(change: [number, Atom]) => (void|Promise<void>)} onchange
	 * @property {(newAtom: Atom) => (void|Promise<void>)} onadd
	 */

	/** @type {Props} */
	const { shape, ondelete, onchange, onadd } = $props();

	/** @type {Set<number>} */
	let openedPickers = new SvelteSet();

	const ALL_SHAPES = entries(MODEL_DETECTION_OUTPUT_SHAPES)
		.map(([atom, data]) => ({ atom, ...data }))
		.toSorted(
			compareBy(({ atom }) =>
				['score', 'cx', 'cy', 'sx', 'sy', 'ex', 'ey', 'w', 'h', '_'].indexOf(atom)
			)
		);

	/**
	 * @param {Array<typeof shape[number]>} atoms
	 */
	function shapeHas(...atoms) {
		return atoms.every((a) => shape.includes(a));
	}

	const heightExpression = $derived.by(() => {
		if (shapeHas('h')) {
			return 'h';
		} else if (shapeHas('sy', 'ey')) {
			return 'e_y - s_y';
		} else if (shapeHas('cy', 'ey')) {
			return '2 * (e_y - c_y)';
		} else if (shapeHas('cy', 'sy')) {
			return '2 * (c_y - s_y)';
		} else {
			return null;
		}
	});

	const widthExpression = $derived.by(() => {
		if (shapeHas('w')) {
			return 'w';
		} else if (shapeHas('sx', 'ex')) {
			return 'e_x - s_x';
		} else if (shapeHas('cx', 'ex')) {
			return '2 * (e_x - c_x)';
		} else if (shapeHas('cx', 'sx')) {
			return '2 * (c_x - s_x)';
		} else {
			return null;
		}
	});

	const cornerXExpression = $derived.by(() => {
		if (shapeHas('cx', 'w')) {
			return 'c_x + w/2';
		} else if (shapeHas('ex')) {
			return 'e_x';
		} else if (shapeHas('sx', 'w')) {
			return 's_x + w';
		} else if (shapeHas('sx', 'cx')) {
			return 's_x + 2*(c_x - s_x)';
		} else {
			return null;
		}
	});

	const cornerYExpression = $derived.by(() => {
		if (shapeHas('cy', 'h')) {
			return 'c_y + h/2';
		} else if (shapeHas('ey')) {
			return 'e_y';
		} else if (shapeHas('sy', 'h')) {
			return 's_y + h';
		} else if (shapeHas('sy', 'cy')) {
			return 's_y + 2*(c_y - s_y)';
		} else {
			return null;
		}
	});
</script>

<div class="diagram">
	<div class="network" style:--shape-length={shape.length}>
		<div class="node faded start">
			<div class="weight"></div>
			<div class="weight"></div>
			<div class="weight"></div>
			<div class="weight"></div>
			<div class="neuron"></div>
			<div class="label">
				<ShapeAtomDisplay atom={shape.at(-1) || ''} />
			</div>
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
									use:tooltip={MODEL_DETECTION_OUTPUT_SHAPES[dim]?.help}
									class:create={dim === ''}
								>
									<div class="label">
										{#if dim === ''}
											Ajouter
										{:else}
											<ShapeAtomDisplay atom={dim} />
										{/if}
									</div>
									<div class="edit-icon">
										<IconEdit />
									</div>
								</button>
							{/snippet}
						</Popover.Trigger>

						<Popover.Content align="end">
							{#each ALL_SHAPES as { help, atom } (atom)}
								<ButtonIcon
									{help}
									onclick={() => {
										openedPickers.delete(i);

										if (dim === '') {
											onadd(atom);
										} else {
											onchange([i, atom]);
										}
									}}
								>
									<div class="popover-option">
										<ShapeAtomDisplay {atom} />
										<span class="name">{help}</span>
									</div>
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
								<div class="popover-option">
									<IconTrash />
									<span class="name">Supprimer</span>
								</div>
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
			<div class="label">
				<ShapeAtomDisplay atom={shape.at(0) || ''} />
			</div>
		</div>
	</div>

	<div class="sep">
		<small>devient</small>
		<MorphArrow />
	</div>

	<div class="bounding-box">
		<span class="scale-label height math">
			{#if heightExpression}
				<Math.Parse expr={heightExpression} />
			{:else}
				<span
					class="invalid"
					use:tooltip={"Impossible de déterminer la hauteur. Il manque l'une des grandeurs suivantes: (h) ou (sy et ey) ou (cy et ey) ou (cy et sy)"}
				>
					?
				</span>
			{/if}
		</span>
		<div class="scale height"></div>

		<span class="scale-label width math">
			{#if widthExpression}
				<Math.Parse expr={widthExpression} />
			{:else}
				<span
					class="invalid"
					use:tooltip={"Impossible de déterminer la largeur. Il manque l'une des grandeurs suivantes: (w) ou (sx et ex) ou (cx et ex) ou (cx et sx)"}
				>
					?
				</span>
			{/if}
		</span>
		<div class="scale width"></div>

		<div class="box">
			<div class="cross">
				<div class="line horizontal"></div>
				<div class="line vertical"></div>
			</div>

			<div class="corner-coordinates">
				<Math.Vector>
					{#snippet x()}
						{#if cornerXExpression}
							<Math.Parse bare expr={cornerXExpression} />
						{:else}
							<mtext
								class="invalid"
								use:tooltip={"Impossible de déterminer cette coordonnée. Il manque l'une des grandeurs suivantes: (cx et w) ou (ex) ou (sx et w)"}
							>
								?
							</mtext>
						{/if}
					{/snippet}
					{#snippet y()}
						{#if cornerYExpression}
							<Math.Parse bare expr={cornerYExpression} />
						{:else}
							<mtext
								class="invalid"
								use:tooltip={"Impossible de déterminer cette coordonnée. Il manque l'une des grandeurs suivantes: (cy et h) ou (ey) ou (sy et h)"}
							>
								?
							</mtext>
						{/if}
					{/snippet}
				</Math.Vector>
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
	<!-- <div class="sep"></div> -->
	<div>Boîte englobante</div>
</div>

<style>
	.diagram,
	.diagram-labels {
		margin: 2em 0;
		display: grid;
		gap: 3em;
		align-items: center;
	}

	.diagram {
		grid-template-columns: 100px 3em 1fr;
	}

	.diagram-labels {
		grid-template-columns: 1fr 1fr;
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

	.neuron {
		width: 30px;
		height: 30px;
		border-radius: 50%;
		border: 1px solid var(--fg-neutral);
		background: var(--bg-neutral);
		z-index: 2;
	}

	.label {
		margin-left: 0.25em;
	}

	.faded .label {
		margin-left: 0.75em;
		opacity: 0.5;
	}

	.sep {
		font-size: 1.5em;
		display: flex;
		flex-direction: column;
		color: var(--fg-primary);

		small {
			font-size: 0.65em;
		}
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
		right: 20px;
		height: 200px;
		width: 200px;
		/* background-image: url('/ant.png');
        background-size: cover; */
	}

	.scale-label {
		position: absolute;
		font-size: 1.25em;

		&.width {
			top: 10px;
			right: 20px;
			width: 200px;
			text-align: center;
		}

		&.height {
			top: calc(50px + 200px / 2 - 65px);
			right: calc(20px + 200px + 50px);
			width: 6em;
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
			right: 20px;
		}

		&.height {
			width: 1px;
			height: 200px;
			top: 75px;
			right: calc(20px + 200px + 25px);
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
		font-size: 1.2em;
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

	.open-atom-picker {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 1.2em;
		width: 4ch;
		height: 4ch;
		display: flex;
		align-items: center;

		div {
			display: flex;
			width: 100%;
			align-items: center;
		}

		.edit-icon {
			color: var(--fg-primary);
			display: none;
		}

		&:is(:hover, :focus-visible) {
			.label {
				display: none;
			}
			.edit-icon {
				display: flex;
			}
		}
	}

	:global([data-popover-content]) {
		padding: 0.5em;
		border-radius: var(--corner-radius);
		background-color: var(--bg-neutral);
		box-shadow:
			0 3px 6px rgba(0, 0, 0, 0.16),
			0 3px 6px rgba(0, 0, 0, 0.23);
		display: flex;
		flex-direction: column;
		/* gap: 1em; */
		z-index: 100;
		/* font-size: 1.3em; */
	}

	.popover-option {
		display: grid;
		grid-template-columns: 3em 1fr;
		align-items: center;
		width: 100%;
		gap: 1ch;
		font-weight: normal;

		.name {
			text-align: start;
		}
	}

	button.create {
		color: var(--gay);
	}
</style>

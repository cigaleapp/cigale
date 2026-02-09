<script>
	import '$lib/fonts-math/import.css';

	import * as Math from 'svelte-mathml';

	import Field from '$lib/Field.svelte';
	import FieldUrl from '$lib/FieldURL.svelte';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import RadioButtons from '$lib/RadioButtons.svelte';

	import { updater as _updater } from '../updater.svelte';
	import ModelOutputShapeDiagram from './ModelOutputShapeDiagram.svelte';

	/**
	 * @typedef {object} Props
	 * @property {number} i index of the model in the protocol.crop.infer array
	 * @property {import('$lib/schemas/neural').NeuralInference} inference
	 */

	/** @type {Props} */
	const { inference, i } = $props();
	const { name, input, output, model } = $derived(inference);

	/**
	 * @template T
	 * @param {(inferences: import('$lib/schemas/neural').NeuralInference[], v: T) => void | Promise<void>} changes
	 * @returns {(v: T) => Promise<void>}
	 */
	const updater = (changes) =>
		_updater((m, ...args) => {
			if (!m.infer || !('neural' in m.infer)) return;
			changes(m.infer.neural, ...args);
		});

	/**
	 * @template T
	 * @param {(shape: typeof import('$lib/schemas/neural').NeuralBoundingBoxInference.infer['output']['shape'], v: T) => void | Promise<void>} changes
	 * @returns {(v: T) => Promise<void>}
	 */
	const outputShapeUpdater = (changes) =>
		updater((inf, ...args) => {
			if (!inf[i].output || !('shape' in inf[i].output)) return;
			changes(inf[i].output.shape, ...args);
		});
</script>

<Field label="Nom du modèle">
	<InlineTextInput
		value={name ?? '(Sans nom)'}
		label="Nom du modèle"
		onblur={updater((inf, newName) => {
			inf[i].name = newName;
		})}
	/>
</Field>
<FieldUrl
	check
	label="URL du ficher .onnx"
	value={typeof model === 'string' ? model : ''}
	onblur={updater((inf, newModel) => {
		inf[i].model = newModel;
	})}
/>
<Field composite label="Taille des images en entrée">
	<div class="composite-input-line">
		<InlineTextInput
			label="Largeur"
			value={input.width.toString()}
			onblur={updater((inf, width) => {
				inf[i].input.width = parseInt(width, 10);
			})}
		/>
		<span class="separator">×</span>
		<InlineTextInput
			label="Hauteur"
			value={input.height.toString()}
			onblur={updater((inf, height) => {
				inf[i].input.height = parseInt(height, 10);
			})}
		/>
		<span class="unit">pixels</span>
	</div>
</Field>

<Field label="Disposition des pixels">
	<RadioButtons
		horizontal
		cards
		value={input.disposition ?? 'CHW'}
		onchange={updater((inf, newValue) => {

			if (!newValue) return

			// The if prevent infinite loops since calling the updater
			// triggers a load function re-run, which
			// in turns updates input.disposition
			if (newValue === inf[i].input.disposition) return;


			inf[i].input.disposition = newValue;
		})}
		options={[
			{
				key: 'CHW',
				label: 'Hauteur-largeur sans batch',
				subtext: 'CHW'
			},
			{
				key: '1CHW',
				label: 'Hauteur-largeur avec batch*',
				subtext: 'BCHW'
			}
		]}
	>
		{#snippet children({ key, label, subtext })}
			<div class="pixel-dispositions radio-card-text">
				<span class="text">{label}</span>
				<span class="description">({subtext})</span>
			</div>
			<div class="pixel-dispositions radio-card-examples">
				<code>
					[ R<sub>1,1</sub>, R<sub>1,2</sub>, …, R<sub>2,1</sub>, R<sub>2,2</sub>, … ]
				</code>

				<p>Représente</p>

				{#snippet rgb(/** @type {string} */ sub)}
					{#if key === 'CHW'}
						<Math.Matrix brackets="[]" columns={3}>
							{#snippet x()}
								<Math.Scripts base="R" {sub} />
							{/snippet}
							{#snippet y()}
								<Math.Scripts base="G" {sub} />
							{/snippet}
							{#snippet z()}
								<Math.Scripts base="B" {sub} />
							{/snippet}
						</Math.Matrix>
					{:else}
						<Math.Matrix brackets="[]" columns={3}>
							{#snippet x()}
								<Math.Wrap with="[]">
									<Math.Scripts base="R" {sub} />
								</Math.Wrap>
							{/snippet}
							{#snippet y()}
								<Math.Wrap with="[]">
									<Math.Scripts base="G" {sub} />
								</Math.Wrap>
							{/snippet}
							{#snippet z()}
								<Math.Wrap with="[]">
									<Math.Scripts base="B" {sub} />
								</Math.Wrap>
							{/snippet}
						</Math.Matrix>
					{/if}
				{/snippet}
				<Math.Line>
					<Math.Matrix brackets="[]" columns={2} height="Hauteur" width="Largeur">
						{#snippet a1()}
							{@render rgb('1, 1')}
						{/snippet}
						{#snippet a3()}
							<Math.Atom expr="…" />
						{/snippet}
						{#snippet b1()}
							{@render rgb('2, 1')}
						{/snippet}
						{#snippet b3()}
							<Math.Atom expr="…" />
						{/snippet}
						{#snippet c1()}
							<Math.Atom expr="⋮" />
						{/snippet}
						{#snippet c3()}
							<Math.Atom expr="⋱" />
						{/snippet}
					</Math.Matrix>
				</Math.Line>
			</div>
		{/snippet}
	</RadioButtons>
	{#snippet hint()}
		<p class="disclaimer-no-batch-support">
			<small>
				*Pour l'instant, CIGALE ne prend pas avantage des réseaux capables de traiter des
				images par batch, donc il n'enverra toujours qu'une image à la fois au modèle.
				<br />
				Cela pourrait changer dans le futur, donc il est toujours utile de configurer correctement
				la disposition des pixels.
			</small>
		</p>
	{/snippet}
</Field>
<Field label="Valeur des pixels">
	<RadioButtons
		horizontal
		cards
		value={input.normalized ? 'normalized' : 'raw'}
		onchange={updater((inf, newValue) => {
			// The if prevent infinite loops since calling the updater
			// See comment in updater() of RadioButtons above
			const newNormalized = newValue === 'normalized';
			if (newNormalized === inf[i].input.normalized) return;

			inf[i].input.normalized = newNormalized;
		})}
		options={[
			{
				key: 'raw',
				label: 'Brutes',
				subtext: /* @wc-include */ 'entre 0 et 255'
			},
			{
				key: 'normalized',
				label: 'Normalisées',
				subtext: /* @wc-include */ 'entre 0 et 1'
			}
		]}
	>
		{#snippet children({ key, label, subtext })}
			{@const colors = [
				[44, 19, 116],
				[148, 0, 0]
			]}
			<div class="color-values radio-card-text">
				<span class="text">{label}</span>
				<span class="description">{subtext}</span>
			</div>
			<div class="color-values radio-card-examples">
				{#each colors as color (color.join(''))}
					{@const [r, g, b] = color.map((c) =>
						c === 0 ? 0 : key === 'normalized' ? (c / 255).toFixed(2) : c
					)}
					<div class="example">
						<div class="swatch" style:background-color="rgb({color.join(',')})"></div>
						<code class="coords">
							<span class="label">R</span>
							{r}
							<br />
							<span class="label">G</span>
							{g}
							<br />
							<span class="label">B</span>
							{b}
						</code>
					</div>
				{/each}
			</div>
		{/snippet}
	</RadioButtons>
</Field>

{#if output && 'shape' in output}
	<Field composite label="Forme de la sortie">
		<div class="diagram">
			<ModelOutputShapeDiagram
				{...output}
				onadd={outputShapeUpdater((shape, atom) => {
					shape.push(atom);
				})}
				onchange={outputShapeUpdater((shape, [j, atom]) => {
					shape[j] = atom;
				})}
				ondelete={outputShapeUpdater((shape, j) => {
					shape.splice(j, 1);
				})}
			/>
		</div>
	</Field>
{/if}

<style>
	.composite-input-line {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 11rem;
	}

	.radio-card-examples.pixel-dispositions {
		/* XXX: to center back the matrix, seems like the height annotation has too much leftover spacing on the left */

		margin-top: 1.25em;
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;
		gap: 1em;

		:global(math) {
			font-size: 1.2em;
			margin: 0.5em 0;
			margin-left: -1.2em;
		}

		code {
			font-size: 0.8rem;
		}
	}

	.radio-card-text {
		margin-bottom: 0.75em;

		.description,
		p {
			color: var(--gay);
		}
	}

	.radio-card-examples.color-values {
		display: flex;
		gap: 1.5em;
		margin-bottom: 0.25em;

		.example {
			display: flex;
			align-items: center;
			gap: 0.75em;

			.swatch {
				width: 2em;
				height: 2em;
				border-radius: 50%;
			}

			.coords {
				font-size: 0.75em;
			}

			.label {
				color: var(--gray);
			}
		}
	}

	.disclaimer-no-batch-support {
		margin-top: 1em;
		color: var(--gay);
	}
</style>

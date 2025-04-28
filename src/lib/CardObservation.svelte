<script>
	import AnimatableCheckmark from './AnimatableCheckmark.svelte';
	import Card from './Card.svelte';
	import LoadingSpinner from './LoadingSpinner.svelte';
	import Logo from './Logo.svelte';
	import ButtonInk from './ButtonInk.svelte';
	import IconDelete from '~icons/ph/trash';
	import IconImage from '~icons/ph/image';
	import { tooltip } from './tooltips';

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {() => void} [onclick]
	 * @property {() => void} [onstacksizeclick]
	 * @property {() => void} [ondelete]
	 * @property {string} title
	 * @property {number} [stacksize=1] - number of images in this observation
	 * @property {string} image - image url
	 * @property {boolean} selected
	 * @property {boolean} [selectable=true] - whether this image can be selected
	 * @property {boolean} [highlighted] - whether this image is highlighted. selected implies highlighted.
	 * @property {number} [loading] - progress (between 0 and 1) of loading the image. Use -1 to show the spinner without progress (infinite).
	 * @property {string} [loadingText] - text to show when loading and progress is -1
	 * @property {object[]} [boundingBoxes] - array of bounding boxes. Values are between 0 and 1 (relative to the width/height of the image)
	 * @property {number} boundingBoxes.x
	 * @property {number} boundingBoxes.y
	 * @property {number} boundingBoxes.width
	 * @property {number} boundingBoxes.height
	 * @property {boolean} [errored=false] - statusText is an error message, and the image processing failed
	 * @property {string} [statusText] - text to show when loading and progress is -1
	 */

	/** @type {Props & Omit<Record<string, unknown>, keyof Props>}*/
	const {
		onclick,
		onstacksizeclick,
		title,
		image,
		loading,
		selected,
		selectable = true,
		highlighted,
		errored = false,
		statusText = 'Chargement…',
		stacksize = 1,
		boundingBoxes = [],
		ondelete,
		...rest
	} = $props();

	const stacked = $derived(stacksize > 1);

	// TODO: extract logic to tooltip.js
	// https://stackoverflow.com/a/10017343/9943464
	let titleElement = $state();
	let titleOffsetWidth = $state(0);
	let titleWasEllipsed = $derived(titleOffsetWidth < titleElement?.scrollWidth);
</script>

<div
	class="observation"
	class:selected
	class:selectable
	class:highlighted
	class:loading
	class:stacked
	data-selectable={selectable ? '' : undefined}
	{...rest}
	use:tooltip={errored ? statusText : undefined}
>
	<div class="main-card">
		<!-- use () => {} instead of undefined so that the hover/focus styles still apply -->
		<Card onclick={loading || errored ? undefined : (onclick ?? (() => {}))}>
			<div class="inner">
				{#if loading !== undefined || errored}
					<div class="loading-overlay">
						{#if errored}
							<Logo --size="1.5em" variant="error" />
						{:else}
							<LoadingSpinner progress={loading === -1 ? undefined : loading} />
						{/if}
						<span class="text" class:smol={errored || loading === -1}>
							{#if errored || loading === undefined}
								Erreur
							{:else if loading === -1}
								{statusText}
							{:else}
								{Math.round(loading * 100)}%
							{/if}
						</span>
						{#if ondelete}
							<section class="errored-actions">
								<ButtonInk onclick={ondelete}>
									<IconDelete /> Supprimer
								</ButtonInk>
							</section>
						{/if}
					</div>
				{/if}
				<div class="containbb">
					{#if image}
						<img src={image} alt={title} />
					{:else}
						<div class="img-placeholder">
							<IconImage />
						</div>
					{/if}
					{#each boundingBoxes as bounding, index (index)}
						<div
							class="bb"
							style="left: {bounding.x * 100}%; top: {bounding.y * 80}%; width: {bounding.width *
								100}%; height: {80 * bounding.height}%;"
						></div>
					{/each}
				</div>

				<footer>
					<div class="check-icon">
						<AnimatableCheckmark />
					</div>
					<h2
						bind:this={titleElement}
						bind:offsetWidth={titleOffsetWidth}
						use:tooltip={titleWasEllipsed ? title : undefined}
					>
						{title}
					</h2>
					<button
						disabled={loading}
						class="stack-count"
						use:tooltip={`Cette observation regroupe ${stacksize} images. Cliquez pour les voir toutes.`}
						onclick={(/** @type {MouseEvent} */ e) => {
							e.stopPropagation();
							onstacksizeclick?.();
						}}
					>
						{stacksize}
					</button>
				</footer>
			</div>
		</Card>
	</div>

	{#if stacked}
		<div class="stack-backgroud-card">
			<Card></Card>
		</div>
	{/if}
</div>

<style>
	.observation {
		--card-width: 200px;
		--card-height: 250px;
		--card-padding: 0; /* since the image kisses the corners */
		--stack-offset: 0.25em;
		--transition-duration: 0.3s;
		--card-bg: var(--bg2-neutral);
		position: relative;
		width: var(--card-width);
		user-select: none;
	}

	.observation.selectable {
		cursor: pointer;
	}

	.observation:is(.selected, .highlighted) {
		--card-bg: var(--bg-primary-translucent);
		color: var(--fg-primary);
	}

	.main-card {
		transition: transform calc(var(--transition-duration) / 1.5);
	}

	@media (prefers-reduced-motion: no-preference) {
		.observation:not(.loading).stacked:is(:hover, :has(:focus-visible)) .main-card {
			transform: rotate(-3deg);
		}
	}

	.inner {
		display: grid;
		grid-template-rows: 200px 1fr;
		grid-template-columns: 100%;
		width: 100%;
		height: 100%;
		position: relative;
	}

	.loading-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgb(from var(--bg-neutral) r g b / 0.75);
		z-index: 10;
		font-size: 3em;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}

	.loading-overlay .text {
		font-size: 1.5rem;
	}

	.loading-overlay .text.smol {
		margin-top: 0.5em;
		font-size: 1.2rem;
	}

	img,
	.img-placeholder {
		width: 100%;
		height: 200px;
		/*object-fit: cover;*/
	}

	.img-placeholder {
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: 3em;
		opacity: 0.25;
		color: var(--gay);
		background: var(--gray);
	}

	footer {
		display: flex;
		align-items: center;
		padding: 0 0.5em;
	}

	.check-icon {
		overflow: hidden;
		width: 0;
		transition: all var(--transition-duration) calc(var(--transition-duration) * 0.1);
	}

	.check-icon :global(svg path) {
		stroke-dasharray: 20;
		stroke-dashoffset: 20;
		transition: all var(--transition-duration);
	}

	.selected .check-icon {
		width: 1.5rem;
	}

	.selected .check-icon :global(svg path) {
		stroke-dashoffset: 0;
	}

	@keyframes reveal-icon {
		from {
			opacity: 0;
			width: 0;
		}
		20% {
			opacity: 1;
		}
		to {
			width: 1.7rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.observation {
			--transition-duration: 0s;
		}
	}

	h2 {
		font-size: 1rem;
		margin: 0;
		text-align: center;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
		margin-right: 0.75em;
	}

	.stack-count {
		background: var(--bg-primary-translucent);
		color: var(--fg-primary);
		border-radius: 50%;
		width: 1.5em;
		height: 1.5em;
		font-size: 0.9rem;
		font-weight: bold;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		border: 2px solid transparent;
		margin-left: auto;
		cursor: pointer;
		transition: all calc(var(--transition-duration) / 2);
	}

	.selected .stack-count {
		background-color: var(--bg-primary);
	}

	.stack-count:is(:hover, :focus-visible) {
		border-color: var(--fg-primary);
	}

	/** Lazy hack to keep alignment of title when check icon gets added but we have stacked==false */
	.observation:not(.stacked) .stack-count {
		opacity: 0;
		visibility: hidden;
		width: 0;
	}

	.observation:not(.loading):is(:hover, :has(:focus-visible)) {
		--stack-offset: 0.4em;
	}

	.stack-backgroud-card {
		position: absolute;
		top: var(--stack-offset);
		left: var(--stack-offset);
		z-index: -10;
		width: var(--card-width);
		pointer-events: none;
		transition:
			top calc(var(--transition-duration) / 1.5),
			left calc(var(--transition-duration) / 1.5);
	}

	.bb {
		position: absolute;
		border: 2px solid white;
		outline: 2px solid black;
		filter: contrast(200%);
	}

	.containbb {
		display: inline-block;
	}

	@media (prefers-reduced-motion: no-preference) {
		.observation:not(.loading):is(:hover, :has(:focus-visible)) .stack-backgroud-card {
			transform: rotate(3deg);
		}
	}

	.errored-actions {
		margin-top: 0.75em;
		font-size: 0.4em;
		--fg: var(--fg-error);
		--bg-hover: var(--bg-error);
	}
</style>

<script module>
	/**
	 * @typedef {'queued' | 'loading' | 'ok' | 'errored'} Status
	 */
	/**
	 * @typedef Props
	 * @type {object}
	 * @property {(e: MouseEvent, set: (props: { status?: Status, loadingStatusText?: string }) => void) => void} [onclick]
	 * @property {() => void} [onstacksizeclick]
	 * @property {() => void} [ondelete]
	 * @property {() => void} [onretry]
	 * @property {string | undefined} [tooltip] tooltip to show
	 * @property {string} id
	 * @property {string} title
	 * @property {number} [stacksize=1] - number of images in this observation
	 * @property {string | undefined} image - image url
	 * @property {Status} [status="ok"] - status of the image processing
	 * @property {string} [statusText] - text to show when status is not `"ok"`
	 * @property {string} [loadingStatusText] statusText override when status == "loading"
	 * @property {boolean} [selectable=true] - whether this image can be selected
	 * @property {boolean} [selected=false]
	 * @property {boolean} [highlighted] - whether this image is highlighted. selected implies highlighted.
	 * @property {"show-all" | "apply-first" | "none"} [boxes] what to do with the images' bounding boxes. Either display them all, or crop to the first one.
	 * @property {object[]} [boundingBoxes] - array of bounding boxes. Values are between 0 and 1 (relative to the width/height of the image)
	 * @property {number} boundingBoxes.x
	 * @property {number} boundingBoxes.y
	 * @property {number} boundingBoxes.width
	 * @property {number} boundingBoxes.height
	 */
</script>

<script>
	import IconRetry from '~icons/ri/arrow-go-back-fill';
	import IconDelete from '~icons/ri/delete-bin-line';
	import IconImage from '~icons/ri/image-2-line';

	import AnimatableCheckmark from './AnimatableCheckmark.svelte';
	import ButtonInk from './ButtonInk.svelte';
	import Card from './Card.svelte';
	import CroppedImg from './CroppedImg.svelte';
	import LoadingSpinner from './LoadingSpinner.svelte';
	import Logo from './Logo.svelte';
	import OverflowableText from './OverflowableText.svelte';
	import { tooltip } from './tooltips.js';

	/** @type {Props & Omit<Record<string, unknown>, keyof Props>}*/
	let {
		onclick,
		onstacksizeclick,
		ondelete,
		onretry,
		title,
		image,
		selected = false,
		selectable = true,
		highlighted,
		status,
		statusText,
		loadingStatusText,
		stacksize = 1,
		boundingBoxes = [],
		boxes,
		tooltip: tooltipText,
		id,
		...rest
	} = $props();

	const stacked = $derived(stacksize > 1);

	const loading = $derived(status === 'loading' || status === 'queued');
	const errored = $derived(status === 'errored');

	const defaultStatusText = $derived.by(() => {
		if (status === 'loading') return 'Chargement…';
		if (status === 'queued') return 'En attente';
		if (status === 'errored') return 'Erreur';
		return '';
	});
</script>

<article
	class="observation"
	class:selected
	class:selectable
	class:highlighted
	class:loading
	class:stacked
	data-selectable={selectable ? '' : undefined}
	data-id={id}
	aria-label={title}
	use:tooltip={tooltipText}
	{...rest}
>
	<div class="main-card">
		<!-- use () => {} instead of undefined so that the hover/focus styles still apply -->
		<Card
			tag="div"
			onclick={(e) => {
				if (loading || errored) return;
				if (!(e instanceof MouseEvent)) return;
				onclick?.(e, (newProps) => {
					if (newProps.status) status = newProps.status;
					if (newProps.loadingStatusText) loadingStatusText = newProps.loadingStatusText;
				});
			}}
		>
			<div class="inner">
				{#if status !== 'ok'}
					<div class="loading-overlay">
						{#if status === 'errored'}
							<Logo --size="1.5em" variant="error" />
						{:else if status === 'loading'}
							<LoadingSpinner />
						{:else if status === 'queued'}
							<LoadingSpinner waiting />
						{/if}
						<span class="text smol">
							{#if status === 'loading' && loadingStatusText}
								{loadingStatusText}
							{:else}
								{statusText || defaultStatusText}
							{/if}
						</span>
						{#if ondelete || onretry}
							<section class="errored-actions">
								{#if ondelete}
									<ButtonInk
										dangerous
										onclick={(e) => {
											e.stopPropagation();
											ondelete();
										}}
									>
										<IconDelete />
										Supprimer
									</ButtonInk>
								{/if}
								{#if !loading && onretry}
									<ButtonInk
										onclick={(e) => {
											e.stopPropagation();
											onretry();
										}}
									>
										<IconRetry />
										Rééssayer
									</ButtonInk>
								{/if}
							</section>
						{/if}
					</div>
				{/if}
				<div class="boundingboxes-wrapper" class:has-boxes={boxes === 'show-all'}>
					{#if image}
						{#if boxes === 'apply-first' && boundingBoxes.length > 0}
							<CroppedImg blurfill src={image} alt={title} box={boundingBoxes[0]} />
						{:else}
							<img src={image} alt={title} />
						{/if}
					{:else}
						<div class="img-placeholder">
							<IconImage />
						</div>
					{/if}
					{#if boxes === 'show-all'}
						{#each boundingBoxes as bounding, index (index)}
							<div
								data-testid="card-observation-bounding-box"
								class="bb"
								style="left: {bounding.x * 100}%; top: {bounding.y *
									80}%; width: {bounding.width * 100}%; height: {80 *
									bounding.height}%;"
							></div>
						{/each}
					{/if}
				</div>

				<footer>
					<div class="check-icon">
						<AnimatableCheckmark />
					</div>
					<h2>
						<OverflowableText text={title} />
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
		<div class="stack-background-card">
			<Card tag="div"></Card>
		</div>
	{/if}
</article>

<style>
	.observation {
		--card-width: calc(var(--card-size-factor, 1) * 200px);
		--card-height: calc(var(--card-size-factor, 1) * 250px);
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
		grid-template-rows: calc(var(--card-size-factor, 1) * 200px) 1fr;
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
		height: calc(var(--card-size-factor, 1) * 200px);
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
		overflow: hidden;
		margin-right: 0.75em;
		display: flex;
		align-items: center;
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

	.stack-background-card {
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

	.boundingboxes-wrapper {
		display: inline-block;
		overflow: hidden;
	}

	.boundingboxes-wrapper:not(.has-boxes) {
		position: relative;
	}

	.boundingboxes-wrapper :global(picture) {
		position: absolute;
		inset: 0;
	}

	@media (prefers-reduced-motion: no-preference) {
		.observation:not(.loading):is(:hover, :has(:focus-visible)) .stack-background-card {
			transform: rotate(3deg);
		}
	}

	.errored-actions {
		margin-top: 0.75em;
		font-size: 0.4em;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5em;
	}
</style>

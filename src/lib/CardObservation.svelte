<script>
	import AnimatableCheckmark from './AnimatableCheckmark.svelte';
	import Card from './Card.svelte';
	import LoadingSpinner from './LoadingSpinner.svelte';
	import { tooltip } from './tooltips';

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {() => void} onclick
	 * @property {() => void} [onstacksizeclick]
	 * @property {string} title
	 * @property {number} [stacksize=1] - number of images in this observation
	 * @property {string} image - image url
	 * @property {boolean} selected
	 * @property {number} [loading] - progress (between 0 and 1) of loading the image. Use -1 to show the spinner without progress (infinite).
	 * @property {string} [loadingText] - text to show when loading and progress is -1
	 */

	/** @type {Props & Omit<Record<string, unknown>, keyof Props>}*/
	const {
		onclick,
		onstacksizeclick,
		title,
		image,
		loading,
		selected,
		loadingText = 'Chargement…',
		stacksize = 1,
		...rest
	} = $props();

	const stacked = $derived(stacksize > 1);

	// TODO: extract logic to tooltip.js
	// https://stackoverflow.com/a/10017343/9943464
	let titleElement = $state();
	let titleOffsetWidth = $state(0);
	let titleWasEllipsed = $derived(titleOffsetWidth < titleElement?.scrollWidth);
</script>

<div class="observation" class:selected class:loading class:stacked {...rest}>
	<div class="main-card">
		<!-- use () => {} instead of undefined so that the hover/focus styles still apply -->
		<Card onclick={loading ? undefined : (onclick ?? (() => {}))}>
			<div class="inner">
				{#if loading !== undefined}
					<div class="loading-overlay">
						<LoadingSpinner progress={loading === -1 ? undefined : loading} />
						<span class="text" class:smol={loading === -1}>
							{#if loading !== -1}
								{Math.round(loading * 100)}%
							{:else}
								{loadingText}
							{/if}
						</span>
					</div>
				{/if}
				<img src={image} alt={title} />
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
						onclick={(e) => {
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
		--card-bg: var(--bg-neutral);
		position: relative;
		width: var(--card-width);
		user-select: none;
	}

	.observation:not(.loading) {
		cursor: pointer;
	}

	.observation.selected {
		--card-bg: var(--bg-primary-translucent);
		color: var(--fg-primary);
	}

	.main-card {
		transition: transform calc(var(--transition-duration) / 1.5);
	}

	@media (prefers-reduced-motion: no-preference) {
		/* TODO: remove :global(), c pa bi1!! */
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

	img {
		width: 100%;
		height: 200px;
		object-fit: cover;
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

	@media (prefers-reduced-motion: no-preference) {
		.observation:not(.loading):is(:hover, :has(:focus-visible)) .stack-backgroud-card {
			transform: rotate(3deg);
		}
	}
</style>

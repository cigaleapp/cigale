<script lang="ts" module>
	type Status = 'queued' | 'loading' | 'ok' | 'errored';

	type EventHandler = (
		// eslint-disable-next-line no-unused-vars
		e: MouseEvent | TouchEvent,
		// eslint-disable-next-line no-unused-vars
		set: (props: { status?: Status; loadingStatusText?: string }) => void
	) => Promise<void>;

	type Props = {
		onclick?: EventHandler;
		onstacksizeclick?: EventHandler;
		ondoubleclick?: EventHandler;
		ondelete?: EventHandler;
		onretry?: EventHandler;
		/** tooltip to show */
		tooltip?: string | undefined;
		id: string;
		title: string;
		/**number of images in this observation */
		stacksize?: number;
		/**image url */
		image: string | undefined;
		/** status of the image processing */
		status: Status;
		/** text to show when status is not `"ok"` */
		statusText: string;
		/** statusText override when status == "loading" */
		loadingStatusText: string;
		/** whether this image can be selected */
		selectable: boolean;
		selected: boolean;
		/** whether this image is highlighted. selected implies highlighted. */
		highlighted: boolean;
		/** original dimensions of the image */
		dimensions: { width: number; height: number | undefined };
		/**  what to do with the images' bounding boxes. Either display them all, or crop to the first one. */
		boxes: 'show-all' | 'apply-first' | 'none';
		/** array of bounding boxes. Values are between 0 and 1 (relative to the width/height of the image) */
		boundingBoxes: TopLeftBoundingBox[];
	};
</script>

<script lang="ts">
	import type { TopLeftBoundingBox } from './BoundingBoxes.svelte';

	import IconRetry from '~icons/ri/arrow-go-back-fill';
	import IconDelete from '~icons/ri/delete-bin-line';
	import IconImage from '~icons/ri/image-2-line';

	import AnimatableCheckmark from './AnimatableCheckmark.svelte';
	import ButtonInk from './ButtonInk.svelte';
	import Card from './Card.svelte';
	import CroppedImg from './CroppedImg.svelte';
	import LoadingSpinner from './LoadingSpinner.svelte';
	import Logo from './Logo.svelte';
	import { IsMobile } from './mobile.svelte.js';
	import OverflowableText from './OverflowableText.svelte';
	import { tooltip } from './tooltips.js';
	import { onlongpress } from './touch/longpress.js';
	import { uiState } from './uistate.svelte.js';

	let {
		onclick,
		ondoubleclick,
		onstacksizeclick,
		ondelete,
		onretry,
		title,
		image,
		dimensions,
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
	}: Props & Omit<Record<string, unknown>, keyof Props> = $props();

	const handlers = $derived({
		onclick,
		ondoubleclick,
		onstacksizeclick,
		ondelete,
		onretry,
	});

	const mobile = new IsMobile();

	const stacked = $derived(stacksize > 1);

	const loading = $derived(status === 'loading' || status === 'queued');
	const errored = $derived(status === 'errored');

	const defaultStatusText = $derived.by(() => {
		if (status === 'loading') return 'Chargement…';
		if (status === 'queued') return 'En attente';
		if (status === 'errored') return 'Erreur';
		return '';
	});

	let longpressCooldown = $state(false);

	const selectByClicking = $derived(
		!longpressCooldown &&
			mobile.current &&
			uiState?.setSelection &&
			// FIXME: sometimes we have empty strings in the selection lol
			uiState.selection.filter(Boolean).length > 0
	);

	function callEventHandler(
		name: Extract<keyof Props, `on${string}`>,
		event: MouseEvent | TouchEvent
	) {
		handlers[name]?.(event, (newProps) => {
			if (newProps.status) status = newProps.status;
			if (newProps.loadingStatusText) loadingStatusText = newProps.loadingStatusText;
		});
	}
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
	oncontextmenu={(e) => {
		if (!mobile.current) return;
		if (!uiState?.setSelection) return;
		e.preventDefault();
	}}
	{@attach onlongpress(250, {
		short(e) {
			if (selectByClicking) {
				// Add to selection instead
				e.preventDefault();
				uiState?.toggleSelection(id);
				return;
			}

			if (loading || errored) return;
			callEventHandler('onclick', e);
		},
		long() {
			if (!selectable) return;
			if (!mobile.current) return;
			if (!uiState) return;

			uiState.toggleSelection(id);

			longpressCooldown = true;
			setTimeout(() => {
				longpressCooldown = false;
			}, 500);
		},
	})}
>
	<div class="main-card">
		<Card tag="div" ondoubleclick={(e) => callEventHandler('ondoubleclick', e)}>
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
											callEventHandler('ondelete', e);
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
											callEventHandler('onretry', e);
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
						{#if boxes === 'apply-first' && boundingBoxes.length > 0 && dimensions}
							<CroppedImg
								blurfill
								{dimensions}
								src={image}
								alt={title}
								box={boundingBoxes[0]}
							/>
						{:else}
							<!-- TODO compute dimensions to emulate object-fit: contain… (1/2) -->
							<img src={image} alt={title} />
						{/if}
					{:else}
						<div class="img-placeholder">
							<IconImage />
						</div>
					{/if}
					{#if boxes === 'show-all'}
						{#each boundingBoxes as bounding, index (index)}
							<!-- TODO …and use it here to compute box dimensions, taking into account image's original dimensions (% -> px) then making it relative to the actual <img> tag dims (px -> %)  (2/2) -->
							<div
								pw-testid="card-observation-bounding-box"
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
						onclick={(e: MouseEvent) => {
							e.stopPropagation();
							callEventHandler('onstacksizeclick', e);
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

		@media (max-width: 600px) {
			--card-width: calc(var(--card-size-factor, 1) * 150px);
			--card-height: calc(var(--card-size-factor, 1) * 200px);
		}

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
		grid-template-rows: calc(var(--card-height) - 50px) 1fr;
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
		height: 100%;
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
		font-size: 0.37em;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5em;
	}
</style>

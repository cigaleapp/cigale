<script>
	import Card from './Card.svelte';
	import { tooltip } from './tooltips';
	import IconCheck from '~icons/ph/check';

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {() => void} onclick
	 * @property {string} title
	 * @property {number} [stacksize=1] - number of images in this observation
	 * @property {string} image - image url
	 * @property {boolean} selected
	 * @property {number} [loading] - progress (between 0 and 1) of loading the image
	 */

	/** @type {Props}*/
	const { onclick, title, image, loading, selected, stacksize = 1 } = $props();

	const stacked = $derived(stacksize > 1);
</script>

<div class="observation" class:selected class:loading class:stacked>
	<Card {onclick}>
		<div class="inner">
			<img src={image} alt={title} />
			<footer>
				{#if selected}
					<div class="check-icon">
						<IconCheck />
					</div>
				{/if}
				<h2 use:tooltip={title}>{title}</h2>
				{#if stacked}
					<span class="stack-count" use:tooltip={`Cette observation regroupe ${stacksize} images`}>
						{stacksize}
					</span>
				{/if}
			</footer>
		</div>
	</Card>
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
		position: relative;
		width: var(--card-width);
	}

	.observation.selected {
		--card-bg: var(--bg-primary-translucent);
		color: var(--fg-primary);
	}

	.observation:is(:hover, :has(:focus-visible)) {
		--stack-offset: 0.4em;
	}

	.inner {
		display: grid;
		grid-template-rows: 200px 1fr;
		grid-template-columns: 100%;
		width: 100%;
		height: 100%;
	}

	img {
		width: 100%;
		height: 200px;
		object-fit: cover;
	}

	footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 0.5em;
		gap: 0.25em;
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
		background: var(--bg-primary);
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
		border: 1px solid transparent;
	}

	.stack-backgroud-card {
		position: absolute;
		top: var(--stack-offset);
		left: var(--stack-offset);
		z-index: -10;
		width: var(--card-width);
		pointer-events: none;
		transition:
			top 0.3s,
			left 0.3s;
	}
</style>

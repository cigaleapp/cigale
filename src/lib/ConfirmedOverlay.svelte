<script lang="ts">
	import IconConfirmed from '~icons/ri/check-double-line';

	interface Props {
		shown?: boolean;
		/** Function to bind to. Call it to show the overlay for a certain amount of time */
		show: () => Promise<void>;
	}

	let {
		shown = $bindable(false),
		show = $bindable(async () => {
			shown = true;
			await new Promise((resolve) => setTimeout(resolve, 500));
			shown = false;
		})
	}: Props = $props();
</script>

<div class="confirmed-overlay" aria-hidden={!shown}>
	<div class="icon">
		<IconConfirmed />
	</div>
	<p>Confirmé</p>
</div>

<style>
	.confirmed-overlay {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 100;
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: 1.5rem;
		padding: 2rem;
		z-index: 1000;
		color: var(--fg-success);
		background-color: var(--bg-neutral);
		border-radius: var(--corner-radius);
		display: flex;
		flex-direction: column;
		transition: opacity 0.2s;
		pointer-events: none;
	}

	.confirmed-overlay[aria-hidden='true'] {
		opacity: 0;
		/* https://github.com/microsoft/playwright/issues/5129#issuecomment-772746396 */
		visibility: hidden;
	}

	.confirmed-overlay .icon {
		font-size: 2.5em;
		margin-bottom: -1rem;
	}
</style>

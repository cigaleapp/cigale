<script lang="ts">
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import { IsMobile } from '$lib/mobile.svelte.js';

	interface Props {
		back: () => void | Promise<void>;
		feature?: string;
		/** Github issue number tracking the progress */
		issue?: number;
	}
	const { back, feature = 'Cette fonctionnalité', issue: issueNumber }: Props = $props();
	const mobile = new IsMobile();
</script>

{#if mobile.current}
	<div class="overlay">
		<p>
			{feature} est en cours de développement pour les appareils mobiles. En attendant, veuillez
			utiliser un ordinateur pour y accéder.
		</p>
		<ButtonSecondary onclick={back}>Retour</ButtonSecondary>

		{#if issueNumber}
			<footer>
				<p>
					Suivez l'avancement de son développement sur Github: c'est <a
						href="https://github.com/cigaleapp/cigale/issues/{issueNumber}"
						target="_blank">l'issue <code>#{issueNumber}</code></a
					>.
				</p>
			</footer>
		{/if}
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: rgb(from var(--bg-neutral) r g b / 90%);
		backdrop-filter: blur(4px);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1.5rem;
		padding: 1rem;
		text-align: center;
		text-wrap: pretty;

		z-index: 1000;

		& > * {
			max-width: 300px;
		}
	}

	footer {
		position: fixed;
		bottom: 3rem;
	}
</style>

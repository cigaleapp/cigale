<script>
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';

	export let show = false;

	const dispatch = createEventDispatcher();

	function closeModal() {
		show = false;
		dispatch('close');
	}

	function handleKeydown(event) {
		if (event.key === 'Escape') {
			closeModal();
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
	});

	onDestroy(() => {
		window.removeEventListener('keydown', handleKeydown);
	});
	let downloadCroppedImages;
	let downloadObservationCSV;
	let downloadImagesCSV;
</script>

{#if show}
	<div class="modal-overlay" on:click={closeModal} aria-hidden="true">
		<div class="modal-content fade-in" on:click|stopPropagation>
			<h2>Téléchargements</h2>

			<button class="modal-btn" on:click={downloadCroppedImages}>
				Télécharger les images croppées
			</button>
			<button class="modal-btn dotted" on:click={downloadObservationCSV}>
				Télécharger le CSV observation
			</button>
			<button class="modal-btn" on:click={downloadImagesCSV}> Télécharger le CSV images </button>

			<!-- ✅ Bouton de fermeture -->
			<button class="close-btn" on:click={closeModal}>Fermer</button>
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.4);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 999;
		animation: fadeIn 0.2s ease-out;
	}

	.modal-content {
		background: #00d0c8;
		padding: 2rem;
		border-radius: 8px;
		text-align: center;
		position: relative;
		max-width: 400px;
		width: 90%;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
	}

	/* ✅ Animation de fade-in */
	.fade-in {
		animation: fadeIn 0.3s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.modal-btn {
		background-color: black;
		color: white;
		padding: 1rem;
		margin: 0.5rem 0;
		border: none;
		width: 100%;
		cursor: pointer;
		font-size: 1rem;
		border-radius: 4px;
		transition: background 0.3s;
	}

	.modal-btn:hover {
		background-color: #333;
	}

	.dotted {
		border: 2px dashed #a150e6;
	}

	.close-btn {
		margin-top: 1rem;
		background: #aaa;
		color: black;
		padding: 0.8rem;
		width: 100%;
		border: none;
		cursor: pointer;
		font-size: 1rem;
		border-radius: 4px;
	}

	.close-btn:hover {
		background: #888;
	}
</style>

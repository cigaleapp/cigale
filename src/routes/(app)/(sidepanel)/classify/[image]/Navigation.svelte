<script lang="ts">
	import IconPrev from '~icons/ri/arrow-left-s-line';
	import IconNext from '~icons/ri/arrow-right-s-line';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import { defineKeyboardShortcuts } from '$lib/keyboard.svelte.js';
	import { goto } from '$lib/paths.js';

	interface Props {
		currentImageIndex: number;
		totalImages: number;
		nextImage: { id: string } | undefined | null;
		prevImage: { id: string } | undefined | null;
	}

	const { currentImageIndex, totalImages, nextImage, prevImage }: Props = $props();

	async function goToImage(image: { id: string } | undefined | null) {
		if (!image) return;
		await goto('/(app)/(sidepanel)/classify/[image]', {
			image: image.id
		});
	}

	defineKeyboardShortcuts('classification', {
		'$mod+ArrowRight': {
			help: 'Image suivante',
			do: async () => goToImage(nextImage)
		},
		Space: {
			help: 'Image suivante',
			do: async () => goToImage(nextImage)
		},
		'$mod+ArrowLeft': {
			help: 'Image précédente',
			do: async () => goToImage(prevImage)
		},
		'Shift+Space': {
			help: 'Image précédente',
			do: async () => goToImage(prevImage)
		}
	});
</script>

<nav>
	<div class="image-switcher">
		<ButtonIcon
			help="Image précédente"
			keyboard="$mod+ArrowLeft"
			disabled={!prevImage}
			onclick={async () => {
				await goToImage(prevImage);
			}}
		>
			<IconPrev />
		</ButtonIcon>
		<code class="numbers">
			{currentImageIndex + 1}
			<div class="separator">⁄</div>
			{totalImages}
		</code>
		<ButtonIcon
			help="Image suivante"
			keyboard="$mod+ArrowRight"
			disabled={!nextImage}
			onclick={async () => {
				await goToImage(nextImage);
			}}
		>
			<IconNext />
		</ButtonIcon>
	</div>
	<div class="continue">
		<ButtonSecondary
			keyboard="Space"
			help="Marquer le recadrage comme confirmé et passer à la prochaine image non confirmée"
			disabled={!nextImage}
			onclick={async () => {
				if (!nextImage) return;
				await goto('/(app)/(sidepanel)/classify/[image]', {
					image: nextImage.id
				});
			}}
		>
			Continuer
		</ButtonSecondary>
	</div>
</nav>

<style>
	nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.image-switcher {
		display: flex;
		align-items: center;
		gap: 0.5em;

		.numbers {
			display: flex;
			align-items: center;
			gap: 0.2em;
			font-family: var(--font-mono);
		}
	}
</style>

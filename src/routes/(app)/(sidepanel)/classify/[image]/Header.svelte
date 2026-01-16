<script lang="ts">
	import IconConfirmed from '~icons/ri/check-double-line';
	import IconCrop from '~icons/ri/crop-line';
	import IconGallery from '~icons/ri/function-line';
	import ButtonInk from '$lib/ButtonInk.svelte';
	import type { Image, Metadata } from '$lib/database';
	import { parseImageId } from '$lib/images';
	import { defineKeyboardShortcuts } from '$lib/keyboard.svelte.js';
	import KeyboardHint from '$lib/KeyboardHint.svelte';
	import OverflowableText from '$lib/OverflowableText.svelte';
	import { goto, resolve } from '$lib/paths.js';
	import { tooltip } from '$lib/tooltips';

	interface Props {
		image: Image | undefined;
		imageNo: number;
		focusedMetadata: Metadata | undefined;
	}

	const { image, imageNo, focusedMetadata }: Props = $props();

	const cropUrlParams = $derived.by(() => {
		if (!image) return;
		const { subindex, fileId } = parseImageId(image.id);
		if (subindex === null) return;

		return {
			image: fileId,
			from: subindex.toString()
		};
	});

	defineKeyboardShortcuts('classification', {
		Escape: {
			help: 'Retour à la galerie',
			async do() {
				await goto('/(app)/(sidepanel)/classify');
			}
		},
		B: {
			help: "Recadrer l'image",
			when: () => Boolean(cropUrlParams),
			async do() {
				if (!cropUrlParams) return;
				await goto('/(app)/(sidepanel)/crop/[image]/[[from]]', cropUrlParams);
			}
		}
	});
</script>

<header>
	<div class="line">
		<ButtonInk inline href={resolve('/classify')}>
			<IconGallery />
			Autres images
			<KeyboardHint shortcut="Escape" />
		</ButtonInk>

		<ButtonInk
			inline
			disabled={!cropUrlParams}
			href={resolve(
				'/(app)/(sidepanel)/crop/[image]/[[from]]',
				cropUrlParams ?? { image: '' }
			)}
		>
			<IconCrop />
			Recadrer
			<KeyboardHint shortcut="B" />
		</ButtonInk>
	</div>

	<div class="line">
		<h1>
			{#if image}
				<OverflowableText text={`${image.filename} #${imageNo}`} />

				{#if focusedMetadata && image.metadata[focusedMetadata.id]?.confirmed}
					<div class="confirmed" use:tooltip={'Classification confirmée'}>
						<IconConfirmed />
					</div>
				{/if}
			{/if}
		</h1>
	</div>
</header>

<style>
	header {
		display: flex;
		flex-direction: column;
	}

	.line {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 3em;
	}

	h1 {
		overflow: hidden;
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.confirmed {
		color: var(--fg-success);
		display: inline-flex;
		font-size: 0.8em;
	}
</style>

<script lang="ts">
	import IconConfirmed from '~icons/ri/check-double-line';
	import IconCrop from '~icons/ri/crop-line';
	import IconUnconfirmed from '~icons/ri/error-warning-line';
	import IconGallery from '~icons/ri/function-line';
	import { invalidate } from '$app/navigation';
	import ButtonInk from '$lib/ButtonInk.svelte';
	import type * as DB from '$lib/database';
	import { dependencyURI, tables } from '$lib/idb.svelte';
	import { imageIdToFileId } from '$lib/images';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import { defineKeyboardShortcuts } from '$lib/keyboard.svelte.js';
	import KeyboardHint from '$lib/KeyboardHint.svelte';
	import { goto, resolve } from '$lib/paths.js';
	import { tooltip } from '$lib/tooltips';

	interface Props {
		observation: DB.Observation;
		focusedMetadata: DB.Metadata | undefined;
		currentImage: DB.Image;
	}

	const { observation, focusedMetadata, currentImage }: Props = $props();

	const cropUrlParams = $derived({
		image: imageIdToFileId(currentImage.id),
		from: observation.id
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
			Voir tout
			<KeyboardHint shortcut="Escape" />
		</ButtonInk>

		<ButtonInk
			inline
			href={resolve('/(app)/(sidepanel)/crop/[image]/[[from]]', cropUrlParams)}
			disabled={!cropUrlParams}
		>
			<IconCrop />
			Recadrer
			<KeyboardHint shortcut="B" />
		</ButtonInk>
	</div>

	<div class="line">
		<h1>
			{#if observation}
				{#if focusedMetadata && observation.metadataOverrides[focusedMetadata.id]?.confirmed}
					<div class="confirmed" use:tooltip={'Classification confirmée'}>
						<IconConfirmed />
					</div>
				{:else}
					<div class="unconfirmed" use:tooltip={'Classification non confirmée'}>
						<IconUnconfirmed />
					</div>
				{/if}

				<InlineTextInput
					discreet
					label="Nom de l'observation"
					value={observation.label}
					onblur={async (newLabel) => {
						if (newLabel === observation.label) return;
						await tables.Observation.update(observation.id, 'label', newLabel);
						await invalidate(dependencyURI('Observation', observation.id));
					}}
				/>
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
		font-size: 1.5em;
	}

	.confirmed,
	.unconfirmed {
		display: inline-flex;
		font-size: 0.8em;
	}
	.confirmed {
		color: var(--fg-success);
	}
	.unconfirmed {
		color: var(--gray);
	}
</style>

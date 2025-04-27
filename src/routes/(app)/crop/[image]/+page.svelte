<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import {
		boundingBoxIsNonZero,
		toCenteredCoords,
		toPixelCoords,
		toTopLeftCoords
	} from '$lib/BoundingBoxes.svelte';
	import ButtonIcon from '$lib/ButtonIcon.svelte';
	import ButtonInk from '$lib/ButtonInk.svelte';
	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
	import DraggableBoundingBox from '$lib/DraggableBoundingBox.svelte';
	import KeyboardHint from '$lib/KeyboardHint.svelte';
	import ProgressBar from '$lib/ProgressBar.svelte';
	import Switch from '$lib/Switch.svelte';
	import * as idb from '$lib/idb.svelte.js';
	import {
		imageFileIds,
		imageIdToFileId,
		imagesOfImageFile,
		imageId as makeImageId,
		parseImageId
	} from '$lib/images';
	import { assertIs, deleteMetadataValue, storeMetadataValue } from '$lib/metadata';
	import { seo } from '$lib/seo.svelte';
	import { getSettings, setSetting, toggleSetting } from '$lib/settings.svelte';
	import { uiState } from '$lib/state.svelte';
	import { tooltip } from '$lib/tooltips';
	import { mapValues, pick } from '$lib/utils';
	import { formatISO } from 'date-fns';
	import { onDestroy, onMount } from 'svelte';
	import IconToolMove from '~icons/ph/arrows-out-cardinal';
	import IconPrev from '~icons/ph/caret-left';
	import IconNext from '~icons/ph/caret-right';
	import IconContinue from '~icons/ph/check';
	import IconHasCrop from '~icons/ph/crop';
	import IconFocus from '~icons/ph/crosshair-simple';
	import IconFourPointCrop from '~icons/ph/number-circle-four';
	import IconTwoPointCrop from '~icons/ph/number-circle-two';
	import IconConfirmedCrop from '~icons/ph/seal-check';
	import IconToolDragCrop from '~icons/ph/selection-plus';
	import IconGallery from '~icons/ph/squares-four';
	import IconDelete from '~icons/ph/trash';

	const fileId = $derived(page.params.image);
	const images = $derived(imagesOfImageFile(fileId, idb.tables.Image.state));
	const firstImage = $derived(images.at(0));

	$effect(() => seo({ title: `Recadrer ${firstImage?.filename ?? '...'}` }));

	// Controls visibility of the checkmark little centered overlay
	let confirmedOverlayShown = $state(false);

	/** @type {typeof tools[number]['name']} */
	let activeToolName = $state('Glisser-recadrer');
	/**
	 * @typedef {object} Tool
	 * @property {string} name
	 * @property {string} help
	 * @property {import('svelte').Component} icon
	 * @property {string} shortcut
	 * @property {boolean} transformable if true, the bounding box's sides or corners can be dragged
	 * @property {'clickanddrag'|'2point'|'4point'|'off'} createMode
	 * @property {boolean} movable if true, the bounding box can be moved by dragging in its inside
	 * @property {string} [cursor]
	 */
	const tools = /** @type {const} @satisfies {Tool[]} */ ([
		{
			name: 'Glisser-recadrer',
			help: 'Cliquer et glisser pour créer une boîte de recadrage',
			icon: IconToolDragCrop,
			shortcut: 'r',
			transformable: true,
			createMode: 'clickanddrag',
			movable: true,
			cursor: 'crosshair'
		},
		{
			name: '2 points',
			help: 'Cliquer sur les deux coins pour créer une boîte de recadrage',
			icon: IconTwoPointCrop,
			shortcut: 'z',
			transformable: false,
			createMode: '2point',
			movable: false,
			cursor: 'crosshair'
		},
		{
			name: '4 points',
			help: 'Cliquer sur les 4 coins pour créer une boîte de recadrage',
			icon: IconFourPointCrop,
			shortcut: 'Shift+z',
			transformable: false,
			createMode: '4point',
			movable: false,
			cursor: 'crosshair'
		},
		{
			name: 'Déplacer',
			help: 'Cliquer et glisser pour déplacer la boîte de recadrage',
			icon: IconToolMove,
			shortcut: 'v',
			transformable: false,
			createMode: 'off',
			movable: true,
			cursor: 'move'
		}
	]);

	let activeTool = $derived(tools.find(({ name }) => name === activeToolName) || tools[0]);

	let focusedImageId = $state('');

	/**
	 * @type {Record<string, import('$lib/metadata.js').RuntimeValue<'boundingbox'>>}
	 */
	const boundingBoxes = $derived(
		Object.fromEntries(
			images
				.map(({ metadata, id }) => [
					id,
					assertIs('boundingbox', metadata[uiState.cropMetadataId]?.value)
				])
				.filter(([, value]) => Boolean(value))
		)
	);
	const imageSrc = $derived(uiState.previewURLs.get(imageIdToFileId(fileId)));
	const sortedFileIds = $derived(imageFileIds(idb.tables.Image.state).toSorted(idb.idComparator));
	const unconfirmedCropFileIds = $derived(sortedFileIds.filter((id) => !hasConfirmedCrop(id)));
	const prevFileId = $derived.by(() => {
		const idx = sortedFileIds.indexOf(fileId) - 1;
		if (idx < 0) return undefined;
		return sortedFileIds.at(idx);
	});
	const nextFileId = $derived.by(() => {
		const idx = sortedFileIds.indexOf(fileId) + 1;
		if (idx >= sortedFileIds.length) return undefined;
		return sortedFileIds.at(idx);
	});
	const nextUnconfirmedImageId = $derived.by(() => {
		const idx = unconfirmedCropFileIds.indexOf(fileId) + 1;
		if (idx >= unconfirmedCropFileIds.length) return undefined;
		return unconfirmedCropFileIds.at(idx);
	});
	const croppedImagesCount = $derived(sortedFileIds.filter(hasCrop).length);
	const confirmedCropsCount = $derived(sortedFileIds.filter(hasConfirmedCrop).length);

	/** @type {Record<string, undefined | { value: import('$lib/metadata.js').RuntimeValue<'boundingbox'>, confidence: number }>} */
	const initialCrops = $derived(
		Object.fromEntries(
			images.map((image) => {
				// On subsequent crops, the user's crop will be the main value and the neural network's crop will be in the alternatives.
				if (
					image.metadata[uiState.cropMetadataId]?.alternatives &&
					Object.entries(image.metadata[uiState.cropMetadataId].alternatives).length > 0
				) {
					const [[stringValue, confidence]] = Object.entries(
						image.metadata[uiState.cropMetadataId].alternatives
					);
					return [
						image.id,
						{
							value: JSON.parse(stringValue),
							confidence
						}
					];
				}

				// If this is the first time the user is re-cropping the box, this value will be the main values.
				return [image.id, pick(image.metadata[uiState.cropMetadataId], 'value', 'confidence')];
			})
		)
	);

	/**
	 * @param {string} imageFileId
	 */
	function hasCrop(imageFileId) {
		return imagesOfImageFile(imageFileId).every((image) => image.metadata[uiState.cropMetadataId]);
	}

	/**
	 * @param {string|undefined} imageFileId
	 */
	function hasConfirmedCrop(imageFileId) {
		if (!imageFileId) return false;
		if (!hasCrop(imageFileId)) return false;
		return imagesOfImageFile(imageFileId).every(imageHasConfirmedCrop);
	}

	/**
	 * @param {import('$lib/database.js').Image} image
	 */
	function imageHasConfirmedCrop(image) {
		return image.metadata[uiState.cropMetadataId]?.manuallyModified;
	}

	// /**
	//  * @param {string} imageId
	//  */
	// async function revertToInferedCrop(imageId) {
	// 	const initialCrop = initialCrops[imageId];
	// 	// On subsequent crops, the user's crop will be the main value and the neural network's crop will be in the alternatives.
	// 	if (!initialCrop) {
	// 		toasts.error(
	// 			`L'image ${imageId} n'a pas de recadrage alternatif, impossible de revenir au recadrage d'origine`
	// 		);
	// 		return;
	// 	}

	// 	await storeMetadataValue({
	// 		subjectId: fileId,
	// 		metadataId: uiState.cropMetadataId,
	// 		type: 'boundingbox',
	// 		...initialCrop
	// 	});

	// 	await deleteMetadataValue({
	// 		metadataId: uiState.classificationMetadataId,
	// 		subjectId: fileId
	// 	});
	// }

	/**
	 * @param {string|null} imageId ID of the image we're confirming a new crop for. Null if we're creating a new cropbox.
	 * @param {import('$lib/BoundingBoxes.svelte').Rect} newBoundingBox
	 * @param {boolean} [flashConfirmedOverlay=true] flash the confirmed overlay when appropriate
	 * @returns {Promise<string>} the ID of the image we just modified/created
	 */
	async function onConfirmCrop(imageId, newBoundingBox, flashConfirmedOverlay = true) {
		// Flash if the callsite asked for it and this is the last image before the file is considered confirmed
		const willFlashConfirmedOverlay =
			flashConfirmedOverlay && images.filter(imageHasConfirmedCrop).length === images.length - 1;
		const willAutoskip =
			// The user has auto-skip enabled
			getSettings().cropAutoNext &&
			// We aren't deleting the bounding box
			boundingBoxIsNonZero(newBoundingBox) &&
			// in click-and-drag creation mode, auto-skip occurs only when the bounding box did not exist before (since the first creation of the box is much less likely to be the final one)
			(activeTool.createMode !== 'clickanddrag' || !hasCrop(fileId));

		const image = imageId ? images.find((img) => img.id === imageId) : undefined;
		const species = image?.metadata[uiState.classificationMetadataId];
		if (species && !species.manuallyModified) {
			// Species confidence was inferred, we need to remove it so we can infer it again, since it's inferred on the _cropped_ image
			await deleteMetadataValue({
				metadataId: uiState.classificationMetadataId,
				subjectId: fileId
			});
		}

		let newImageId = '';

		if (imageId) {
			// We're modifying an existing cropbox
			await storeMetadataValue({
				metadataId: uiState.cropMetadataId,
				subjectId: imageId,
				type: 'boundingbox',
				value: toCenteredCoords(newBoundingBox),
				confidence: 1,
				// Put the neural-network-inferred (initial) value in the alternatives as a backup
				alternatives: initialCrops[fileId] ? [initialCrops[fileId]] : undefined,
				manuallyModified: true
			});
		} else if (images.length === 1 && firstImage && !firstImage.metadata[uiState.cropMetadataId]) {
			// We're creating a new cropbox, but it is the first one (and we already have an image, it just doesn't have a cropbox)
			newImageId = firstImage.id;
			await storeMetadataValue({
				metadataId: uiState.cropMetadataId,
				subjectId: newImageId,
				type: 'boundingbox',
				value: toCenteredCoords(newBoundingBox),
				confidence: 1,
				manuallyModified: true,
				alternatives: []
			});
		} else {
			// We're creating a 2+nd cropbox
			newImageId = makeImageId(
				fileId,
				Math.max(...images.map(({ id }) => parseImageId(id).subindex)) + 1
			);
			await idb.tables.Image.set({
				id: newImageId,
				filename: firstImage?.filename ?? '',
				addedAt: formatISO(firstImage?.addedAt ?? new Date()),
				contentType: firstImage?.contentType ?? '',
				fileId,
				metadata: {
					[uiState.cropMetadataId]: {
						value: JSON.stringify(toCenteredCoords(newBoundingBox)),
						confidence: 1,
						manuallyModified: true,
						alternatives: {}
					}
				}
			});
		}

		if (willFlashConfirmedOverlay) {
			confirmedOverlayShown = true;
			await new Promise((resolve) => setTimeout(resolve, 500));
			confirmedOverlayShown = false;
		}

		if (willAutoskip) {
			await goto(nextFileId ? `#/crop/${nextFileId}` : `#/classify`);
		}

		return newImageId;
	}

	async function moveToNextUnconfirmed() {
		const imagesAndBoxes = images.map((img) => /** @type {const}*/ ([img, boundingBoxes[img.id]]));

		for (const [image, box] of imagesAndBoxes) {
			await onConfirmCrop(image.id, toTopLeftCoords(box));
		}

		await goto(nextUnconfirmedImageId ? `#/crop/${nextUnconfirmedImageId}` : `#/classify`);
	}

	function goToGallery() {
		uiState.imagePreviouslyOpenedInCropper = fileId;
		goto('#/crop');
	}

	$effect(() => {
		uiState.imageOpenedInCropper = fileId;
	});

	onMount(() => {
		uiState.keybinds['ArrowLeft'] = {
			help: 'Image précédente',
			when: () => Boolean(prevFileId),
			do: () => goto(`#/crop/${prevFileId}`)
		};
		uiState.keybinds['Shift+Space'] = {
			help: 'Image précédente',
			when: () => Boolean(prevFileId),
			do: () => goto(`#/crop/${prevFileId}`)
		};
		uiState.keybinds['ArrowRight'] = {
			help: 'Image suivante',
			when: () => Boolean(nextFileId),
			do: () => goto(`#/crop/${nextFileId}`)
		};
		uiState.keybinds['Space'] = {
			help: 'Continuer',
			do: moveToNextUnconfirmed
		};
		uiState.keybinds['Escape'] = {
			help: 'Quitter le recadrage',
			do: goToGallery
		};
		uiState.keybinds['a'] = {
			help: 'Activer/désactiver la continuation automatique',
			async do() {
				await toggleSetting('cropAutoNext');
			}
		};
		for (const tool of tools) {
			uiState.keybinds[tool.shortcut] = {
				help: `Outil ${tool.name}`,
				do: () => {
					activeToolName = tool.name;
				}
			};
		}
	});
	onDestroy(() => {
		// FIXME: allow registering keybinds for a specific page, and show them in a separate category on the keybinds help modal
		delete uiState.keybinds['ArrowLeft'];
		delete uiState.keybinds['ArrowRight'];
		delete uiState.keybinds['Space'];
		delete uiState.keybinds['Escape'];
		delete uiState.keybinds['A'];
		for (const tool of tools) {
			delete uiState.keybinds[tool.shortcut];
		}
	});

	let imageElement = $state();
</script>

<div class="confirmed-overlay" class:shown={confirmedOverlayShown}>
	<div class="icon">
		<IconConfirmedCrop />
	</div>
	<p>Confirmé</p>
</div>

<div class="layout">
	<aside class="toolbar">
		{#each tools as tool (tool.name)}
			<button
				class:active={tool.name === activeToolName}
				use:tooltip={{
					text: `${tool.name}: ${tool.help}`,
					keyboard: tool.shortcut,
					placement: 'right'
				}}
				onclick={() => {
					activeToolName = tool.name;
				}}
			>
				<tool.icon />
			</button>
		{/each}
	</aside>
	<main class="crop-surface">
		<img src={imageSrc} alt="" bind:this={imageElement} />
		{#if imageElement}
			<DraggableBoundingBox
				{...activeTool}
				{imageElement}
				boundingBoxes={mapValues(
					focusedImageId ? pick(boundingBoxes, focusedImageId) : boundingBoxes,
					toTopLeftCoords
				)}
				onchange={(imageId, box) => onConfirmCrop(imageId, box)}
				oncreate={(box) => onConfirmCrop(null, box)}
			/>
		{/if}
	</main>
	<aside class="info">
		<section class="top">
			<nav class="back">
				<ButtonInk onclick={goToGallery}>
					<IconGallery /> Toutes les photos
					<KeyboardHint shortcut="Escape" />
				</ButtonInk>
			</nav>
			<div class="filename-actions">
				{#if firstImage}
					<h1>
						{firstImage.filename}
						{#if hasConfirmedCrop(fileId)}
							<div class="status" use:tooltip={'Recadrage confirmé'}>
								<IconConfirmedCrop />
							</div>
						{/if}
					</h1>
				{:else}
					<h1>
						<code>Image introuvable</code>
					</h1>
				{/if}
			</div>
		</section>
		<section class="boxes">
			<ul>
				{#each images.filter(({ id }) => id in boundingBoxes) as image, i (image.id)}
					{@const box = boundingBoxes[image.id]}
					{@const { w, h, x, y } = mapValues(
						toPixelCoords(uiState.currentProtocol)(box),
						Math.round
					)}
					<li class:unfocused={focusedImageId && focusedImageId !== image.id}>
						<img src={uiState.getPreviewURL(image.fileId)} alt="" class="thumb" />
						<div class="text">
							<p class="index">Boîte #{i + 1}</p>
							<p class="dimensions">
								<code>{w} × {h}</code>
								<code use:tooltip={'Coordonnées du centre'}>@</code>
								<code>{x}, {y}</code>
							</p>
						</div>
						<div class="actions">
							{#if Object.values(boundingBoxes).length > 1}
								<ButtonIcon
									help="Masquer les autres boîtes"
									onclick={() => (focusedImageId = focusedImageId === image.id ? '' : image.id)}
									crossout={focusedImageId === image.id}
								>
									<IconFocus />
								</ButtonIcon>
							{/if}
							<ButtonIcon
								help="Supprimer cette boîte"
								onclick={async () => {
									if (images.length === 1) {
										await deleteMetadataValue({
											metadataId: uiState.cropMetadataId,
											subjectId: image.id
										});
									} else {
										await idb.tables.Image.remove(image.id);
									}
								}}
							>
								<IconDelete />
							</ButtonIcon>
						</div>
					</li>
				{/each}
			</ul>
		</section>
		<section class="progress">
			{#snippet percent(/** @type {number} */ value)}
				<code>
					{Math.round((value / sortedFileIds.length) * 100)}%
				</code>
			{/snippet}

			<div class="bar">
				<p>
					<IconHasCrop />
					Images avec recadrage
					{@render percent(croppedImagesCount)}
				</p>
				<ProgressBar alwaysActive progress={croppedImagesCount / sortedFileIds.length} />
			</div>
			<div class="bar">
				<p>
					<IconConfirmedCrop />
					Recadrages confirmés
					{@render percent(confirmedCropsCount)}
				</p>
				<ProgressBar alwaysActive progress={confirmedCropsCount / sortedFileIds.length} />
			</div>
		</section>
		<nav>
			<div class="navigation">
				<ButtonIcon
					disabled={!prevFileId}
					help="Image précédente"
					keyboard="ArrowLeft"
					onclick={() => {
						goto(`#/crop/${prevFileId}`);
					}}
				>
					<IconPrev />
				</ButtonIcon>
				<code>
					{sortedFileIds.indexOf(fileId) + 1}⁄{sortedFileIds.length}
				</code>
				<ButtonIcon
					disabled={!nextFileId}
					help="Image suivante"
					keyboard="ArrowRight"
					onclick={() => {
						goto(`#/crop/${nextFileId}`);
					}}
				>
					<IconNext />
				</ButtonIcon>
			</div>
			<div class="continue">
				<span
					class="auto"
					use:tooltip={{
						text: "Passer automatiquement à l'image suivante quand celle-ci est recadrée",
						keyboard: 'A'
					}}
				>
					<Switch
						bind:value={
							() => getSettings().cropAutoNext, (value) => setSetting('cropAutoNext', value)
						}
						label="Auto"
					/>
					Auto
				</span>
				<ButtonSecondary
					onclick={moveToNextUnconfirmed}
					keyboard="Space"
					help="Marquer le recadrage comme confirmé et passer à la prochaine image non confirmée"
				>
					<IconContinue />
					Continuer
				</ButtonSecondary>
			</div>
		</nav>
	</aside>
</div>

<style>
	.layout {
		display: flex;
		height: 100%;
		overflow: hidden;
	}

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
		color: var(--fg-success);
		background-color: var(--bg-neutral);
		border-radius: var(--corner-radius);
		display: flex;
		flex-direction: column;
		transition: opacity 0.2s;
		pointer-events: none;
	}

	.confirmed-overlay:not(.shown) {
		opacity: 0;
	}

	.confirmed-overlay .icon {
		font-size: 2.5em;
		margin-bottom: -1rem;
	}

	.toolbar {
		--width: 2.5em;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.25em;
	}

	.toolbar button {
		font-size: 1.2em;
		width: var(--width);
		height: var(--width);
		display: flex;
		justify-content: center;
		align-items: center;
		border: none;
		background: none;
		cursor: pointer;
		position: relative;
		border-radius: var(--corner-radius);
	}

	.toolbar button.active {
		color: var(--fg-primary);
	}

	.toolbar button::after {
		content: '';
		position: absolute;
		bottom: 5px;
		left: 50%;
		transform: translateX(-50%);
		width: 0;
		height: 3px;
		border-radius: 1000000px;
		background: var(--bg-primary);
		transition: width 0.1s;
	}

	.toolbar button.active::after {
		width: 40%;
	}

	.toolbar button:is(:hover, :focus-visible) {
		color: var(--fg-primary);
		background: var(--bg-primary-translucent);
	}

	.crop-surface {
		overflow: hidden;
		position: relative;
		user-select: none;
		width: 100%;
		--cell-size: calc(100% / 16 - 0.125px);
		background-size: var(--cell-size) var(--cell-size);
		background-image:
			linear-gradient(to right, var(--gray) 1px, transparent 1px),
			linear-gradient(to bottom, var(--gray) 1px, transparent 1px);
	}

	.info {
		padding: 1em;
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2.5em;
		min-width: 450px;
		resize: horizontal;
		/* to make resize work */
		overflow: hidden;
	}

	.info .top {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
	}

	.info .filename-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.info h1 {
		font-size: 1.5em;
		display: flex;
		align-items: center;
		gap: 0.25em;
	}

	.info h1 .status {
		display: flex;
		font-size: 0.8em;
		color: var(--fg-primary);
		align-items: center;
	}

	.boxes {
		overflow-y: auto;
		height: 100%;
	}

	.boxes ul {
		display: flex;
		flex-direction: column;
		gap: 1em;
		list-style: none;
		padding-left: 0;
	}

	.boxes li {
		display: flex;
		gap: 1em;
		align-items: center;
		padding: 0 1em;
	}

	.boxes li.unfocused {
		opacity: 0.5;
	}

	.boxes img {
		--size: 4rem;
		width: var(--size);
		height: var(--size);
		object-fit: cover;
	}

	.boxes .dimensions {
		display: flex;
		gap: 0.75em;
	}

	.boxes .actions {
		margin-left: auto;
	}

	.info .progress {
		display: flex;
		flex-direction: column;
		--inactive-bg: var(--gray);
		gap: 1.25em;
	}

	.info .progress .bar p {
		margin-bottom: 0.25em;
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.info .progress .bar p code {
		color: var(--gay);
		font-size: 0.9em;
		margin-left: auto;
	}

	.info nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.info nav :is(div, span) {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.info nav .navigation {
		gap: 0.25em;
	}

	.info nav .continue {
		gap: 1.5em;
	}

	.info nav .auto {
		gap: 0.25em;
	}

	img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
</style>

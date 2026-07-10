import type { SelectedBox } from './+page.svelte';

import { toTopLeftCoords } from '$lib/BoundingBoxes.svelte.js';
import { defineKeyboardShortcuts } from '$lib/keyboard.svelte.js';
import { toggleSetting } from '$lib/settings.svelte.js';
import { clamp, fromEntries, range, throwError } from '$lib/utils.js';

import {
	currentImages,
	focusedImage,
	boundingBoxes as getBoundingBoxes,
	setFocusedImage,
	zoom,
	zoomSpeed,
} from './+page.svelte';
import {
	canRevertCrop,
	deleteBoundingBox,
	deleteImageFileAndGotoNext,
	onCropChange,
	revertAll,
	revertToInferredCrop,
} from './actions.svelte.js';
import { switchTool, tools } from './Toolbar.svelte';

const boundingBoxes = $derived(getBoundingBoxes());
const images = $derived(currentImages());

export function setupKeyboardShortcuts({
	selectedBox: getSelectedBox,
	showConfirmedOverlay,
}: {
	selectedBox: () => SelectedBox;
	showConfirmedOverlay: () => Promise<void>;
}) {
	const selectedBox = getSelectedBox();

	defineKeyboardShortcuts('cropping', {
		'$mod+Delete': {
			help: 'Supprimer l’image',
			do: deleteImageFileAndGotoNext,
		},
		a: {
			help: 'Activer/désactiver la continuation automatique',
			do: async () => toggleSetting('cropAutoNext'),
		},
		Delete: {
			help: 'Supprimer la boîte sélectionnée',
			when: () => Boolean(selectedBox.imageId),
			async do() {
				if (!selectedBox.imageId) return;
				await deleteBoundingBox(selectedBox.imageId);

				if (selectedBox.manual) {
					selectedBox.imageId = null;
				} else {
					// Select previous box in list
					selectedBox.imageId =
						images.toReversed().find((image) => image.id in boundingBoxes)?.id ?? null;
				}
			},
		},
		f: {
			help: 'Cacher les boîtes non sélectionnées',
			when: () => Boolean(selectedBox),
			do() {
				if (!selectedBox) return;
				if (selectedBox.imageId === focusedImage()?.id) {
					setFocusedImage(null);
				} else if (selectedBox.imageId) {
					setFocusedImage(selectedBox.imageId);
				}
			},
		},
		u: {
			help: "Revenir au recadrage d'origine",
			when: () => canRevertCrop(selectedBox?.imageId),
			do: () => {
				if (!canRevertCrop(selectedBox?.imageId)) return;
				revertToInferredCrop(selectedBox.imageId);
			},
		},
		'$mod+u': {
			help: "Revenir au recadrage d'origine pour toutes les boîtes",
			when: () => Object.keys(boundingBoxes).length > 0,
			do: revertAll,
		},

		'+': {
			help: 'Zoomer',
			do: () => {
				zoom.scale = clamp(1, zoom.scale + 4 * zoomSpeed(), 10);
			},
		},
		'-': {
			help: 'Dézoomer',
			do: () => {
				zoom.scale = clamp(1, zoom.scale - 4 * zoomSpeed(), 10);
			},
		},
		Digit0: {
			help: 'Réinitialiser le zoom',
			do: () => {
				zoom.origin = { x: 0, y: 0 };
				zoom.scale = 1;
			},
		},
		...fromEntries(
			tools.map((tool) => [
				tool.shortcut,
				{
					help: `Choisir l'outil ${tool.name}`,
					do: () => {
						switchTool(tool.name);
					},
				},
			])
		),
		',': {
			help: 'Sélectionner la boîte précédente',
			do: () => {
				const imageIds = Object.keys(boundingBoxes);
				const currentIndex = imageIds.indexOf(selectedBox.imageId ?? '');
				const prevIndex = (currentIndex - 1 + imageIds.length) % imageIds.length;
				selectedBox.imageId = imageIds[prevIndex];
			},
		},
		';': {
			help: 'Sélectionner la boîte suivante',
			do: () => {
				const imageIds = Object.keys(boundingBoxes);
				const currentIndex = imageIds.indexOf(selectedBox.imageId ?? '');
				const nextIndex = (currentIndex + 1) % imageIds.length;
				selectedBox.imageId = imageIds[nextIndex];
			},
		},
		...fromEntries(
			range(1, 10).map((i) => [
				`Digit${i}`,
				{
					help: `Sélectionner la boîte #${i}`,
					when: () => Object.keys(boundingBoxes).length >= i,
					do: () => {
						const imageId = Object.keys(boundingBoxes)[i - 1];
						if (selectedBox.imageId === imageId) {
							selectedBox.imageId = null;
							selectedBox.manual = false;
						} else {
							selectedBox.imageId = imageId;
							selectedBox.manual = true;
						}
					},
				},
			])
		),
		'x b': {
			help: 'Entrer des coordonnées de boîte',
			async do() {
				const [x, y, w, h] = (
					prompt('Coords? (x space y space w space h, ∈ [0, 1])') ??
					throwError('Prompt annulé')
				)
					.split(' ')
					.map(Number.parseFloat);

				await onCropChange({
					imageId: null,
					newBoundingBox: toTopLeftCoords({ x, y, w, h }),
					showConfirmedOverlay,
					selectedBox: getSelectedBox,
				});
			},
		},
	});
}

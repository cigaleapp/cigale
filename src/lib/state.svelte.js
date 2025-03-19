import { base } from '$app/paths';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { imageIdToFileId } from './images';

/**
 * @typedef Keybind
 * @type {object}
 * @property {string} help
 * @property {(e: MouseEvent|KeyboardEvent) => void} do
 * @property {boolean} [hidden=false] hide the keybinding from help
 * @property {(e: MouseEvent|KeyboardEvent) => boolean} [when=() => true] condition to check before executing the keybind
 */

/**
 * @typedef Keymap
 * @type {Record<string, Keybind>}
 */

/**
 * @typedef {object} UIState
 * @property {object} processing état actuel du processus de traitement
 * @property {number} processing.total nombre total d'éléments à traiter
 * @property {number} processing.done éléments traités
 * @property {number} processing.time temps écoulé depuis le début du processus, en
 * @property {number} processing.progress pourcentage entre 0 et 1 de l'avancement du processus
 * @property {'inference'|'preprocessing'|'classification'|'loading'|'postprocessing'|'finished'|'visualizing'|'generating-zip'|''} processing.state état actuel du processus
 * @property {string[]} selection liste des IDs d'images ou observations sélectionnées. Utiliser setSelection pour modifier
 * @property {undefined | ((newSelection: string[]) => void)} setSelection modifier la sélection
 * @property {Map<string, string>} previewURLs url de type blob:// pouvant servir de src à une balise img pour afficher une image. Map d'un ID d'ImageFile à l'URL
 * @property {Map<string, string>} croppedPreviewURLs url de type blob:// pouvant servir de src à une balise img pour afficher l'image, en version croppée. Map d'un ID d'ImageFile à l'URL
 * @property {(image: import('./database').Image | typeof import('./database').Tables.Image.in.infer, url: string, variant?: 'cropped' | 'full') => void} setPreviewURL
 * @property {(image: import('./database').Image | typeof import('./database').Tables.Image.in.infer | undefined, variant?: 'cropped' | 'full') => boolean} hasPreviewURL
 * @property {(image: import('./database').Image | typeof import('./database').Tables.Image.in.infer | undefined, variant?: 'cropped' | 'full') => string | undefined} getPreviewURL
 * @property {Map<string, string>} erroredImages liste des IDs d'images qui ont rencontré une erreur lors du traitement
 * @property {Set<string>} loadingImages liste des IDs d'images en cours de chargement (analyse, écriture en db, etc)
 * @property {Keymap} keybinds liste des raccourcis clavier
 * @property {string} currentProtocol ID du protocole choisi
 */

/**
 * @type {UIState}
 */
export const uiState = $state({
	processing: {
		total: 0,
		done: 0,
		time: 0,
		state: '',
		get progress() {
			return this.total ? this.done / this.total : 0;
		}
	},
	selection: [],
	previewURLs: new SvelteMap(),
	croppedPreviewURLs: new SvelteMap(),
	hasPreviewURL(image, variant = 'full') {
		if (!image) return false;
		return (variant === 'cropped' ? this.croppedPreviewURLs : this.previewURLs).has(
			imageIdToFileId(image.id)
		);
	},
	setPreviewURL(image, url, variant = 'full') {
		(variant === 'cropped' ? this.croppedPreviewURLs : this.previewURLs).set(
			imageIdToFileId(image.id),
			url
		);
	},
	getPreviewURL(image, variant = 'full') {
		if (!image) return undefined;
		return (variant === 'cropped' ? this.croppedPreviewURLs : this.previewURLs).get(
			imageIdToFileId(image.id)
		);
	},
	erroredImages: new SvelteMap(),
	loadingImages: new SvelteSet(),
	keybinds: {},
	// TODO
	currentProtocol: '',
	// needs to be set in AreaObservations.svelte, since it only the component has access to its DragSelect instance
	setSelection: undefined
});

console.info(`Base path is ${base}`);
export const previewingPrNumber = /cigale\/_pullrequests\/pr-(\d+)$/.exec(base)?.[1];

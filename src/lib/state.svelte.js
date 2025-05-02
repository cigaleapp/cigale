import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { tables } from './idb.svelte';
import { getMetadataValue } from './metadata';

/**
 * @import * as DB from './database';
 * @import { TypedMetadataValue } from './metadata';
 */

/**
 * @typedef Keybind
 * @type {object}
 * @property {string} help
 * @property {(e: MouseEvent|KeyboardEvent) => (void | Promise<void>)} do
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
 * @property {string[]} processing.files liste de noms de fichiers en cours d'importations
 * @property {string[]} selection liste des IDs d'images ou observations sélectionnées. Utiliser setSelection pour modifier
 * @property {undefined | ((newSelection: string[]) => void)} setSelection modifier la sélection
 * @property {Map<string, string>} previewURLs url de type blob:// pouvant servir de src à une balise img pour afficher une image. Map d'un ID d'ImageFile à l'URL
 * @property {(imageFileId: string | undefined | null, url: string, variant?: 'cropped' | 'full') => void} setPreviewURL
 * @property {(imageFileId: string | undefined | null, variant?: 'cropped' | 'full') => boolean} hasPreviewURL
 * @property {(imageFileId: string | undefined | null, variant?: 'cropped' | 'full') => string | undefined} getPreviewURL
 * @property {Map<string, string>} erroredImages liste des IDs d'images qui ont rencontré une erreur lors du traitement
 * @property {Set<string>} loadingImages liste d'IDs d'images ou de ImageFiles en cours de chargement (analyse, écriture en db, etc)
 * @property {Keymap} keybinds liste des raccourcis clavier
 * @property {string} classificationMetadataId ID de la métadonnée à utiliser pour la classification
 * @property {string} cropMetadataId ID de la métadonnée à utiliser pour le recadrage
 * @property {string} currentProtocolId ID du protocole choisi
 * @property {string | ''} imageOpenedInCropper ID de l'image qu'on est en train de recadrer, ou '' si on est dans la gallerie
 * @property {string | ''} imagePreviouslyOpenedInCropper ID de l'image qu'on était en train de recadrer avant de changer d'image ou de revenir à la gallerie
 * @property {DB.Protocol | undefined} currentProtocol protocole choisi
 * @property {(image: DB.Image) => TypedMetadataValue<'boundingbox'>|undefined} cropMetadataValueOf} récupérer la valeur de la métadonnée de recadrage d'une image, pour le protocole actuel
 */

/**
 * @type {UIState}
 */
export const uiState = $state({
	processing: {
		files: [],
		total: 0,
		done: 0,
		time: 0,
		state: '',
		get progress() {
			return this.total ? this.done / this.total : 0;
		}
	},
	selection: [],
	imageOpenedInCropper: '',
	imagePreviouslyOpenedInCropper: '',
	previewURLs: new SvelteMap(),
	hasPreviewURL(imageFileId) {
		if (!imageFileId) return false;
		return this.previewURLs.has(imageFileId);
	},
	setPreviewURL(imageFileId, url) {
		console.log('setPreviewURL', { imageFileId, url });
		if (!imageFileId) return;
		this.previewURLs.set(imageFileId, url);
	},
	getPreviewURL(imageFileId) {
		if (!imageFileId) return undefined;
		return this.previewURLs.get(imageFileId);
	},
	erroredImages: new SvelteMap(),
	loadingImages: new SvelteSet(),
	keybinds: {},
	get classificationMetadataId() {
		return (
			tables.Metadata.state.find(
				(m) =>
					this.currentProtocol?.metadata.includes(m.id) &&
					'taxonomic' in m &&
					m.taxonomic.clade === 'species'
			)?.id ?? 'species'
		);
	},
	get cropMetadataId() {
		return (
			tables.Metadata.state.find(
				(m) =>
					this.currentProtocol?.metadata.includes(m.id) &&
					this.currentProtocol?.crop?.metadata === m.id
			)?.id ?? 'crop'
		);
	},
	/**
	 * Get the bounding box metadata value of an image
	 */
	cropMetadataValueOf(image) {
		return getMetadataValue(image, 'boundingbox', this.cropMetadataId);
	},
	get currentProtocol() {
		return tables.Protocol.state.find((p) => p.id === this.currentProtocolId);
	},
	_currentProtocolId: '',
	get currentProtocolId() {
		return this._currentProtocolId || localStorage.getItem('currentProtocolId') || '';
	},
	set currentProtocolId(id) {
		localStorage.setItem('currentProtocolId', id);
		this._currentProtocolId = id;
	},
	// needs to be set in AreaObservations.svelte, since it only the component has access to its DragSelect instance
	setSelection: undefined
});

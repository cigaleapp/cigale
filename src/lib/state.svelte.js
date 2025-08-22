import { MetadataInferOptionsNeural } from '$lib/schemas/metadata.js';
import { match } from 'arktype';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { tables } from './idb.svelte';
import { getMetadataValue } from './metadata';
import { getSetting, getSettings, setSetting } from './settings.svelte';

/**
 * @import * as DB from './database';
 * @import { TypedMetadataValue } from './metadata';
 * @import { ZoomState } from './DraggableBoundingBox.svelte.js';
 */

/**
 * @typedef Keybind
 * @type {object}
 * @property {string} help
 * @property {(e: MouseEvent|KeyboardEvent) => unknown} do
 * @property {boolean} [hidden=false] hide the keybinding from help
 * @property {(e: MouseEvent|KeyboardEvent) => boolean} [when=() => true] condition to check before executing the keybind
 * @property {boolean} [allowInModals=false] allow the keybind to be active even when a modal is open
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
 * @property {() => void} processing.reset réinitialiser l'état de traitement
 * @property {(id: string) => void} processing.removeFile supprimer un fichier de la liste des fichiers en cours de traitement
 * @property {'inference'|'preprocessing'|'classification'|'loading'|'postprocessing'|'finished'|'visualizing'|'generating-zip'|''} processing.state état actuel du processus
 * @property {Array<{name: string; id: string}>} processing.files liste de noms de fichiers en cours d'importations, qui n'ont pas encore de ImageFile en base de données
 * @property {string[]} selection liste des IDs d'images ou observations sélectionnées. Utiliser setSelection pour modifier
 * @property {undefined | ((newSelection: string[]) => void)} setSelection modifier la sélection
 * @property {Map<string, string>} previewURLs url de type blob:// pouvant servir de src à une balise img pour afficher une image. Map d'un ID d'ImageFile à l'URL
 * @property {(imageFileId: string | undefined | null, url: string, variant?: 'cropped' | 'full') => void} setPreviewURL
 * @property {(imageFileId: string | undefined | null, variant?: 'cropped' | 'full') => boolean} hasPreviewURL
 * @property {(imageFileId: string | undefined | null, variant?: 'cropped' | 'full') => string | undefined} getPreviewURL
 * @property {Map<string, string>} erroredImages liste des IDs d'images qui ont rencontré une erreur lors du traitement
 * @property {Set<string>} loadingImages liste d'IDs d'images ou de ImageFiles en cours de chargement (analyse, écriture en db, etc)
 * @property {Set<string>} queuedImages liste d'IDs d'images ou de ImageFiles en attente de traitement
 * @property {Keymap} keybinds liste des raccourcis clavier
 * @property {Map<string, ZoomState>} cropperZoomStates états de zoom pour les différentes images, dans /crop/[image]. Les clés sont les IDs d'ImageFile
 * @property {number} selectedClassificationModel index du modèle de classification sélectionné dans la liste des modèles de classification du protocole sélectionné. -1 pour désactiver l'inférence
 * @property {number} selectedCropModel index du modèle de recadrage sélectionné dans la liste des modèles de recadrage du protocole sélectionné. -1 pour désactiver l'inférence
 * @property {(indices: { classification?: number | null, crop?: number | null }) => Promise<void>} setModelSelections changer les modèles sélectionnés pour le protocole courant
 * @property {typeof import('$lib/schemas/metadata.js').MetadataInferOptionsNeural.infer['neural']} classificationModels liste des modèles de classification disponibles pour le protocole sélectionné
 * @property {NonNullable<typeof import('$lib/schemas/protocols.js').Protocol.infer['crop']['infer']>} cropModels liste des modèles de recadrage disponibles pour le protocole sélectionné
 * @property {boolean} cropInferenceAvailable true si le protocole sélectionné a un modèle de recadrage (qui n'a pas été désactivé)
 * @property {boolean} classificationInferenceAvailable true si le protocole sélectionné a un modèle de classification (qui n'a pas été désactivé)
 * @property {string|undefined} classificationMetadataId ID de la métadonnée à utiliser pour la classification
 * @property {string} cropMetadataId ID de la métadonnée à utiliser pour le recadrage
 * @property {string} cropConfirmationMetadataId ID de la métadonnée à utiliser pour déterminer si le recadrage a été confirmé
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
		},
		/**
		 *
		 * @param {string} id
		 */
		removeFile(id) {
			const idx = this.files.findIndex((f) => f.id === id);
			if (idx === -1) return;
			this.files.splice(idx, 1);
		},
		reset() {
			this.files = [];
			this.total = 0;
			this.done = 0;
			this.time = 0;
			this.state = '';
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
	queuedImages: new SvelteSet(),
	keybinds: {},
	cropperZoomStates: new SvelteMap(),
	get classificationModels() {
		return (
			tables.Metadata.state.find((m) => m.id === this.classificationMetadataId)?.infer?.neural ?? []
		);
	},
	get cropModels() {
		return this.currentProtocol?.crop?.infer ?? [];
	},
	get cropInferenceAvailable() {
		return this.cropModels.length > 0 && this.selectedCropModel !== -1;
	},
	get classificationInferenceAvailable() {
		return this.classificationModels.length > 0 && this.selectedClassificationModel !== -1;
	},
	get selectedClassificationModel() {
		const metadataId = this.classificationMetadataId;
		if (!metadataId) return -1;
		return getSettings().protocolModelSelections[this.currentProtocolId]?.[metadataId] ?? 0;
	},
	async setModelSelections({ classification = null, crop = null }) {
		if (classification === null && crop === null) return; // no change

		const metadataIds = {
			classification: this.classificationMetadataId,
			crop: this.cropMetadataId
		};

		if (!metadataIds.classification || !metadataIds.crop) return;

		const current = await getSetting('protocolModelSelections');

		/**
		 * @type {Record<string, number>}
		 */
		const changes = {};

		if (classification !== null && classification !== this.selectedClassificationModel) {
			changes[metadataIds.classification] = classification;
		}
		if (crop !== null && crop !== this.selectedCropModel) {
			changes[metadataIds.crop] = crop;
		}

		if (Object.keys(changes).length === 0) {
			return; // no change
		}

		await setSetting('protocolModelSelections', {
			...current,
			[this.currentProtocolId]: {
				...current[this.currentProtocolId],
				...changes
			}
		});
	},
	get selectedCropModel() {
		const metadataId = this.cropMetadataId;
		if (!metadataId) return -1;
		return getSettings().protocolModelSelections[this.currentProtocolId]?.[metadataId] ?? 0;
	},
	get classificationMetadataId() {
		const isCandidate = match
			.case(
				{
					id: 'string',
					type: '"enum"',
					infer: MetadataInferOptionsNeural
				},
				({ id }) => this.currentProtocol?.metadata.includes(id)
			)
			.default(() => false);

		return tables.Metadata.state.find((m) => isCandidate(m))?.id;
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
	get cropConfirmationMetadataId() {
		return (
			tables.Metadata.state.find(
				(m) =>
					this.currentProtocol?.metadata.includes(m.id) &&
					this.currentProtocol?.crop?.confirmationMetadata === m.id
			)?.id ?? ''
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

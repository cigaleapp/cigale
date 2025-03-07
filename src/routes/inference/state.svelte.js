/**
 * @typedef {object} UIState
 * @property {object} processing état actuel du processus de traitement
 * @property {number} processing.total nombre total d'éléments à traiter
 * @property {number} processing.done éléments traités
 * @property {number} processing.time temps écoulé depuis le début du processus, en
 * @property {number} processing.progress pourcentage entre 0 et 1 de l'avancement du processus
 * @property {'inference'|'preprocessing'|'classification'|'loading'|'postprocessing'|'finished'|'visualizing'|''} processing.state état actuel du processus
 * @property {string[]} selection liste des IDs d'images ou observations sélectionnées
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
	selection: []
});

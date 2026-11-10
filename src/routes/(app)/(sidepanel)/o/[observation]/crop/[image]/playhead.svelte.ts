import { page } from '$app/state';
import { tables } from '$lib/idb.svelte.js';

export const playhead = $state({
	/** Playhead position in milliseconds */
	position: 0,
	get positionNormalized() {
		const file = tables.AudioFile.getFromState(page.params.image);
		if (!file) return 0;
		return this.position / file.dimensions.duration;
	},
});

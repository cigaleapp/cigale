import { page } from '$app/state';
import { tables } from '$lib/idb.svelte.js';

export const playhead = $state({
	// XXX: DONT MERGE
	// put back at zero
	/** Playhead position in milliseconds */
	position: 20_000,
	get positionNormalized() {
		const file = tables.AudioFile.getFromState(page.params.image);
		if (!file) return 0;
		return this.position / file.dimensions.duration;
	},
});

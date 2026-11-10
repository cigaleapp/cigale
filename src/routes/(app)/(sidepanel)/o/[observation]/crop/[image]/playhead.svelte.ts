import { page } from '$app/state';
import { tables } from '$lib/idb.svelte.js';

class Playhead {
	seeking = $state(false);
	/** Playhead position in milliseconds */
	position = $state(0);

	#duration = $derived(tables.AudioFile.getFromState(page.params.image)?.dimensions.duration);

	set positionNormalized(value: number) {
		if (!this.#duration) return;
		this.position = value * this.#duration;
	}

	get positionNormalized() {
		if (!this.#duration) return 0;
		return this.position / this.#duration;
	}
}

export const playhead = new Playhead();

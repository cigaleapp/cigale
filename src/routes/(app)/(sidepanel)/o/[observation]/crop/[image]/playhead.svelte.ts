import { page } from '$app/state';
import { tables } from '$lib/idb.svelte.js';

class Playhead {
	seeking = $state(false);
	/** Playhead position in milliseconds */
	position = $state(0);

	#duration = $derived(tables.AudioFile.getFromState(page.params.image)?.dimensions.duration);
	#player = $state<HTMLAudioElement>();

	bindPlayer(player: HTMLAudioElement) {
		this.#player = player;
	}

	seek(normalized: number) {
		if (!this.#player) throw new Error('No player bound to playhead');
		if (!this.#duration) throw new Error('No duration available for playhead');
		this.position = normalized * this.#duration;
		console.log(`Seeking to ${this.position}ms (${normalized * 100}%)`);
		this.#player.currentTime = this.position / 1e3;
	}

	get positionNormalized() {
		if (!this.#duration) return 0;
		return this.position / this.#duration;
	}
}

export const playhead = new Playhead();

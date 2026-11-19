import { afterDelay } from '#lib/utils.js';

export class FloatingMessage {
	text = $state('');
	fadeout = $state<number>();

	set(category: string, message: string) {
		if (!message || !category) return;

		if (this.fadeout) {
			clearTimeout(this.fadeout);
		}

		this.text = `${category}: ${message}`;
		this.fadeout = afterDelay('3s', () => {
			this.text = '';
		});
	}

	/**
	 * Sets a floating message but prevents it from being removed after a timemout
	 */
	freeze(category: string, message: string) {
		this.set(category, message);
		if (this.fadeout) clearTimeout(this.fadeout);
	}

	clear() {
		if (this.fadeout) clearTimeout(this.fadeout);
		this.text = '';
	}
}

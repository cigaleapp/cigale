import { iterateDOMList } from '../utils.js';

export class Fingers {
	/**
	 * Store touches that are occurring
	 * resets when count == 0
	 *
	 * Used to detect pinches etc
	 */
	touches = $state<Array<{ pointerId?: number; clientX: number; clientY: number }>>([]);

	get count() {
		return this.touches.length;
	}

	/**
	 * Drop the event from {@link Fingers.touch} by matching the pointerId
	 */
	#removeTouch(event: Event & { pointerId: number }) {
		const i = this.touches.findIndex((touch) => touch.pointerId === event.pointerId);

		if (i === -1) return;

		this.touches.splice(i, 1);
	}

	#supportsTouchEvents() {
		return 'ontouchstart' in this.inside;
	}

	#handle(event: Event) {
		if (this.#supportsTouchEvents()) {
			if (event instanceof TouchEvent) {
				this.touches = [...iterateDOMList(event.touches)];
			}

			// Mouse support too, cuz touch{start,end} only works
			// for touchscreens obviously
			if (event instanceof MouseEvent) {
				switch (event.type as `mouse${'up' | 'down'}`) {
					case 'mousedown': {
						this.touches = [event];
						break;
					}
					case 'mouseup': {
						this.touches = [];
					}
				}
			}
		} else {
			// Do dumb manual tracking too cuz TouchEvent is not supported
			// on Safari yet
			// See https://developer.mozilla.org/en-US/docs/Web/API/Element/touchstart_event#browser_compatibility
			if (event instanceof PointerEvent) {
				switch (event.type as `pointer${'up' | 'down'}`) {
					case 'pointerdown': {
						this.touches.push(event);
						break;
					}
					case 'pointerup': {
						this.#removeTouch(event);
						break;
					}
				}
			}
		}
	}

	constructor(public inside: HTMLElement = document.body) {
		$effect(() => {
			if (this.#supportsTouchEvents()) {
				// Touchscreens
				inside.addEventListener('touchstart', (e) => this.#handle(e));
				inside.addEventListener('touchend', (e) => this.#handle(e));
				// Mouses
				inside.addEventListener('mousedown', (e) => this.#handle(e));
				inside.addEventListener('mouseup', (e) => this.#handle(e));
			} else {
				// Safari
				inside.addEventListener('pointerdown', (e) => this.#handle(e));
				inside.addEventListener('pointerup', (e) => this.#handle(e));
			}
		});

		// Pretty much sure that something
		// has gone wrong in the finger count tracking
		$effect(() => {
			if (this.count < 0 || this.count > 4) {
				console.warn(
					`[touch::Fingers] Something has gone wrong with the finger count tracking! reset to 0 from ${this.count}`
				);
				this.touches = [];
			}
		});
	}

	/**
	 * Useful if a handler further down from {@link inside}
	 * will stop propagation of a pointer event.
	 * In that case, {@link Fingers}' own handlers wont be reached
	 * so we have to manually react
	 */
	register(e: Event) {
		this.#handle(e);
	}

	reset() {
		this.touches = [];
	}

	get any() {
		return this.count > 0;
	}

	get single() {
		return this.count === 1;
	}

	get multiple() {
		return this.count > 1;
	}
}

import { SvelteMap } from 'svelte/reactivity';

import { avg, iterateDOMList } from '$lib/utils.js';

export type ClientPoint = { clientX: number; clientY: number };

type PanEvent =
	| {
			kind: 'panend';
			source: TouchEvent;
	  }
	| {
			kind: 'panstart';
			source: TouchEvent;
			origin: ClientPoint;
	  }
	| {
			kind: 'panmove';
			source: TouchEvent;

			/** Center of the {@link starts} points */
			origin: ClientPoint;
			/** Center of the {@link ends} points */
			destination: ClientPoint;

			dx: number;
			dy: number;
	  };

export type PinchEvent = {
	source: TouchEvent;

	/** Center of the {@link starts} points */
	origin: ClientPoint;

	/** Euclidian distance of the movement of two points */
	distance: number;
};

type DoubleTapEvent = {
	fingercount: number;
	source: TouchEvent;
};

export class Gestures {
	#panning = false;

	/**
	 * Key is the Touch's identifier
	 * Touches when the touch event started
	 */
	#startingTouches = new SvelteMap<number, Touch>();

	/**
	 * Each tap is an array of touches
	 */
	#taps = [] as Touch[][];

	#handle = (event: TouchEvent) => {
		/** Length of the vector between the two points */
		const distance = (...[p1, p2]: ClientPoint[]) =>
			Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);

		/** Ratio of distance to diagonal of screen */
		const reldistance = (...[p1, p2]: ClientPoint[]) =>
			distance(p1, p2) / Math.hypot(screen.width, screen.height);

		/** Center of the given points */
		const center = (points: ClientPoint[]) => ({
			clientX: avg(points.map((p) => p.clientX)),
			clientY: avg(points.map((p) => p.clientY)),
		});

		if (event.type === 'touchstart') {
			this.#startingTouches = new SvelteMap(
				[...iterateDOMList(event.touches)].map((touch) => [touch.identifier, touch])
			);
		}

		if (event.type === 'touchend') {
			// If we still have some fingers touching, this isnt really a end of touch, bail
			if (event.touches.length > 0) {
				return;
			}

			if (this.#panning) {
				this.handlers?.onpan?.({
					kind: 'panend',
					source: event,
				});
			} else {
				// No panning = no touchmove = its a tap
				this.#taps.push([...this.#startingTouches.values()]);

				// Handle double taps
				if (this.#taps.length >= 2) {
					const [first, second] = this.#taps;

					if (reldistance(center(first), center(second)) < 0.1) {
						this.handlers?.ondoubletap?.({
							fingercount: Math.min(...this.#taps.map((tap) => tap.length)),
							source: event,
						});
					}

					this.#taps = [];
				}
			}

			this.#startingTouches.clear();
		}

		if (event.type === 'touchmove' && event.touches.length === 2) {
			const start = [...this.#startingTouches.values()];
			const end = [...iterateDOMList(event.touches)];

			// Ratio of distances between centers (the center moved, so more pan-like)
			// and the distances of starts and ends (the pinch distance)
			const eccentricity =
				distance(center(start), center(end)) /
				Math.abs(distance(...end) - distance(...start));

			// Might be 1 in theory, idk, but 2 seems good empirically
			if (eccentricity > 1) {
				if (!this.#panning) {
					this.handlers.onpan?.({
						kind: 'panstart',
						source: event,
						origin: center(start),
					});
				}

				this.#panning = true;
				this.handlers.onpan?.({
					kind: 'panmove',
					source: event,
					origin: center(start),
					destination: center(end),
					dx: center(end).clientX - center(start).clientX,
					dy: center(end).clientY - center(start).clientY,
				});
			} else {
				this.#panning = false;
				this.handlers.onpan?.({
					kind: 'panend',
					source: event,
				});

				// TODO: batch sends on the handler to improve performance
				// it's sent too often in small increments, it can make zooming
				// laggy... but it's not that bad tbh
				this.handlers.onpinch?.({
					source: event,
					origin: center(start),
					distance: distance(...end) - distance(...start),
				});
			}
		}
	};

	constructor(
		public inside: HTMLElement,
		public handlers: {
			onpinch?: (event: PinchEvent) => void;
			onpan?: (event: PanEvent) => void;
			ondoubletap?: (event: DoubleTapEvent) => void;
		}
	) {
		// https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events/Pinch_zoom_gestures

		$effect(() => {
			const handler = this.#handle;

			this.inside.addEventListener('touchstart', handler);
			this.inside.addEventListener('touchend', handler);
			this.inside.addEventListener('touchmove', handler);

			// prevent default for two-finger-tap if we have a ondoubletap handler set
			const preventDefault = (e: Event) => e.preventDefault();

			if (this.handlers.ondoubletap) {
				this.inside.addEventListener('contextmenu', preventDefault);
			}

			return () => {
				this.inside.removeEventListener('touchstart', handler);
				this.inside.removeEventListener('touchend', handler);
				this.inside.removeEventListener('touchmove', handler);
				this.inside.removeEventListener('contextmenu', preventDefault);
			};
		});
	}
}

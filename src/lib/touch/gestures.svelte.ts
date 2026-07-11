import { avg, iterateDOMList } from '$lib/utils.js';
import { SvelteMap } from 'svelte/reactivity';

type ClientPoint = { clientX: number; clientY: number };

type PanEvent = {
	source: TouchEvent;
	starts: Touch[];
	ends: Touch[];

	/** First event, sent on pointerdown instead of pointermove. dx & dy are zero. */
	starting: boolean;

	/** Center of the {@link starts} points */
	origin: ClientPoint;
	/** Center of the {@link ends} points */
	destination: ClientPoint;

	dx: number;
	dy: number;
};

type PinchEvent = {
	source: TouchEvent;
	starts: Touch[];
	ends: Touch[];

	/** Center of the {@link starts} points */
	origin: ClientPoint;

	/** Euclidian distance of the movement of two points */
	distance: number;

	/**
	 * If the distance within the fingers is growing.
	 * Note that if the distance didnt change,
	 * both `growing` and `shrinking` are false */
	growing: boolean;

	/**
	 * If the distance within the fingers is shrinking.
	 * Note that if the distance didnt change,
	 * both `growing` and `shrinking` are false */
	shrinking: boolean;
};

type DoubleTapEvent = {
	touches: Touch[];
	fingercount: number;
	source: TouchEvent;
};

export class Gestures {
	/**
	 * Key is the Touch's identifier
	 * Touches when the touch event started
	 */
	#startingTouches = new SvelteMap<number, Touch>();

	#handle = (event: TouchEvent) => {
		/** Length of the vector between the two points */
		const distance = (...[p1, p2]: ClientPoint[]) =>
			Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);

		/** Center of the two given points */
		const center = (...points: ClientPoint[]) => ({
			clientX: avg(points.map((p) => p.clientX)),
			clientY: avg(points.map((p) => p.clientY)),
		});

		if (event.type === 'touchstart') {
			this.#startingTouches = new SvelteMap(
				[...iterateDOMList(event.touches)].map((touch) => [touch.identifier, touch])
			);

			void this.handlers.onpan?.({
				source: event,
				starting: true,
				starts: [...this.#startingTouches.values()],
				ends: [...this.#startingTouches.values()],
				origin: center(...this.#startingTouches.values()),
				destination: center(...this.#startingTouches.values()),
				dx: 0,
				dy: 0,
			});
		}

		if (event.type === 'touchend') {
			this.#startingTouches.clear();
		}

		if (event.type === 'touchmove' && event.touches.length === 2) {
			const [s1, s2] = [...this.#startingTouches.values()];
			const [e1, e2] = [...iterateDOMList(event.touches)];

			// Ratio of distances between centers (the center moved, so more pan-like)
			// and the distances of starts and ends (the pinch distance)
			const eccentricity =
				distance(center(s1, s2), center(e1, e2)) /
				Math.abs(distance(e1, e2) - distance(s1, s2));

			// Might be 1 in theory, idk, but 2 seems good empirically
			if (eccentricity > 2) {
				void this.handlers.onpan?.({
					starting: false,
					starts: [s1, s2],
					ends: [e1, e2],
					origin: center(s1, s2),
					destination: center(e1, e2),
					source: event,
					dx: center(e1, e2).clientX - center(s1, s2).clientX,
					dy: center(e1, e2).clientY - center(s1, s2).clientY,
				});
			} else {
				// TODO: batch sends on the handler to improve performance
				// it's sent too often in small increments, it can make zooming
				// laggy... but it's not that bad tbh
				void this.handlers.onpinch?.({
					starts: [s1, s2],
					ends: [e1, e2],
					source: event,
					origin: center(s1, s2),
					distance: distance(e1, e2) - distance(s1, s2),
					get growing() {
						return this.distance > 0;
					},
					get shrinking() {
						return this.distance < 0;
					},
				});
			}
		}
	};

	constructor(
		public inside: HTMLElement,
		public handlers: {
			onpinch?: (event: PinchEvent) => Promise<void> | void;
			onpan?: (event: PanEvent) => Promise<void> | void;
			ondoubletap?: (event: DoubleTapEvent) => Promise<void> | void;
		}
	) {
		// https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events/Pinch_zoom_gestures

		$effect(() => {
			const handler = this.#handle;

			this.inside.addEventListener('touchstart', handler);
			this.inside.addEventListener('touchend', handler);
			this.inside.addEventListener('touchmove', handler);

			return () => {
				this.inside.removeEventListener('touchstart', handler);
				this.inside.removeEventListener('touchend', handler);
				this.inside.removeEventListener('touchmove', handler);
			};
		});
	}
}

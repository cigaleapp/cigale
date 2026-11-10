import type { ClientPoint, PinchEvent } from '$lib/touch/gestures.svelte.js';

import { sign, switchValue } from '$lib/utils.js';

const INITIAL_STATE = {
	origin: { x: 0, y: 0 },
	scale: 1,
	panning: false,
	panStart: { x: 0, y: 0, zoomOrigin: { x: 0, y: 0 } },
};

export type ZoomState = typeof INITIAL_STATE;

/**
 * Represents the zoom state of the image.
 * x & y coordinates are in pixels of the resized, post-object-fit but pre-zoom image
 */
export class Zoom {
	zoomlock: 'x' | 'y' | undefined = undefined;
	origin = $state({ x: 0, y: 0 });
	scale = $state(1);
	panning = $state(false);
	panStart = $state({
		x: 0,
		y: 0,
		zoomOrigin: {
			x: 0,
			y: 0,
		},
	});

	constructor(state?: ZoomState, options?: { zoomlock?: 'x' | 'y' }) {
		if (state) this.restore(state);
		this.zoomlock = options?.zoomlock;
	}

	lock(axis: 'x' | 'y') {
		this.zoomlock = axis;
	}

	releaseLock() {
		this.zoomlock = undefined;
	}

	cssTransforms(): string {
		let out = '';

		if (this.zoomlock !== 'x') {
			out += `scaleX(${this.scale}) `;
			out += `translateX(${this.origin.x}px) `;
		}

		if (this.zoomlock !== 'y') {
			out += `scaleY(${this.scale}) `;
			out += `translateY(${this.origin.y}px) `;
		}

		return out;
	}

	capture(): ZoomState {
		return {
			origin: $state.snapshot(this.origin),
			scale: $state.snapshot(this.scale),
			panning: $state.snapshot(this.panning),
			panStart: $state.snapshot(this.panStart),
		};
	}

	restore(state: ZoomState) {
		this.origin = state.origin;
		this.scale = state.scale;
		this.panning = state.panning;
		this.panStart = state.panStart;
	}

	reset() {
		this.origin = structuredClone(INITIAL_STATE.origin);
		this.scale = structuredClone(INITIAL_STATE.scale);
		this.panning = structuredClone(INITIAL_STATE.panning);
		this.panStart = structuredClone(INITIAL_STATE.panStart);
	}

	update(
		element: HTMLImageElement | null,
		data:
			| { via: 'pinch'; event: PinchEvent }
			| { via: 'wheel'; event: WheelEvent }
			| { via: 'keyboard'; key: '+' | '-' }
	) {
		// Most logic is thanks to https://stackoverflow.com/a/70251437
		const bounds = element?.getBoundingClientRect();

		let direction = 0;
		let speed = 0;
		let center = { clientX: 0, clientY: 0 };

		switch (data.via) {
			case 'pinch': {
				center = data.event.origin;
				speed = Math.abs(data.event.distance) / 2e3;
				direction = sign(data.event.distance);
				break;
			}
			case 'wheel': {
				center = data.event;
				speed = this.scale * 0.1;
				direction = sign(-data.event.deltaY);
				break;
			}
			case 'keyboard': {
				// No cursor position: zoom around the middle of the image
				if (bounds) {
					center = {
						clientX: bounds.x + bounds.width / 2,
						clientY: bounds.y + bounds.height / 2,
					};
				}
				speed = this.scale * 0.2;
				direction = switchValue(data.key, {
					'+': 1,
					'-': -1,
				});
				break;
			}
		}

		const previous = this.scale;
		const scale = Math.min(10, Math.max(1, previous + direction * 2 * speed));

		if (scale <= 1) {
			this.scale = 1;
			this.origin = { x: 0, y: 0 };
			return;
		}

		if (scale === previous) return;

		if (!element || !bounds) {
			this.scale = scale;
			return;
		}

		// Transform-origin of the element in its own (untransformed) pixels
		const [originX, originY] = getComputedStyle(element)
			.transformOrigin.split(' ')
			.map(parseFloat);
		const tx = Number.isFinite(originX) ? originX : element.offsetWidth / 2;
		const ty = Number.isFinite(originY) ? originY : element.offsetHeight / 2;

		// The fixed point of the transform, in client coordinates.
		// bounds.x = anchor - s * (tx + o) + ... solved for anchor:
		const anchorX = bounds.x + previous * tx - previous * this.origin.x;
		const anchorY = bounds.y + previous * ty - previous * this.origin.y;

		const k = 1 / scale - 1 / previous;

		this.scale = scale;
		if (this.zoomlock !== 'x') this.origin.x += (center.clientX - anchorX) * k;
		if (this.zoomlock !== 'y') this.origin.y += (center.clientY - anchorY) * k;
	}

	startPanning(at: ClientPoint) {
		this.panning = true;
		this.panStart = {
			x: at.clientX,
			y: at.clientY,
			zoomOrigin: $state.snapshot(this.origin),
		};
	}

	stopPanning() {
		this.panning = false;
	}

	/**
	 * Does nothing if {@link this.panning} is false
	 */
	pan(to: ClientPoint) {
		if (!this.panning) return;

		if (this.zoomlock !== 'x') {
			this.origin.x = this.panStart.zoomOrigin.x + (to.clientX - this.panStart.x);
		}

		if (this.zoomlock !== 'y') {
			this.origin.y = this.panStart.zoomOrigin.y + (to.clientY - this.panStart.y);
		}
	}
}

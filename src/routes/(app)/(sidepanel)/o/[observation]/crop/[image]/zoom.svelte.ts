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

	constructor(state?: ZoomState) {
		if (state) this.restore(state);
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
		const imageBounds = element?.getBoundingClientRect();
		const imageOffsets = element
			? {
					height: element.offsetHeight,
					width: element.offsetWidth,
				}
			: undefined;

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
				speed = this.scale * 0.2;
				direction = switchValue(data.key, {
					'+': 1,
					'-': -1,
				});

				break;
			}
		}

		const scale = this.scale + direction * 2 * speed;

		if (scale > 10) {
			this.scale = 10;
			return;
		}

		if (scale < 1) {
			this.scale = 1;
			this.origin = { x: 0, y: 0 };
			return;
		}

		if (!imageBounds || !imageOffsets) {
			this.scale = scale;
			return;
		}

		const dx =
			direction *
			speed *
			(imageOffsets.width - ((center.clientX - imageBounds.x) / scale) * 2);

		const dy =
			direction *
			speed *
			(imageOffsets.height - ((center.clientY - imageBounds.y) / scale) * 2);

		this.scale = scale;
		this.origin.x += dx;
		this.origin.y += dy;
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
		this.origin.x = this.panStart.zoomOrigin.x + (to.clientX - this.panStart.x);
		this.origin.y = this.panStart.zoomOrigin.y + (to.clientY - this.panStart.y);
	}
}

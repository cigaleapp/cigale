import type { ZoomState } from './zoom.svelte';
import type { PinchEvent } from '$lib/touch/gestures.svelte.js';

import { beforeEach, describe, expect, it } from 'vitest';

import { Zoom } from './zoom.svelte';

describe('Zoom', () => {
	let zoom: Zoom;

	beforeEach(() => {
		zoom = new Zoom();
	});

	describe('initialization', () => {
		it('should initialize with default state', () => {
			expect(zoom.origin).toEqual({ x: 0, y: 0 });
			expect(zoom.scale).toBe(1);
			expect(zoom.panning).toBe(false);
			expect(zoom.panStart).toEqual({
				x: 0,
				y: 0,
				zoomOrigin: { x: 0, y: 0 },
			});
		});

		it('should initialize with provided state', () => {
			const initialState: ZoomState = {
				origin: { x: 10, y: 20 },
				scale: 2,
				panning: false,
				panStart: {
					x: 5,
					y: 5,
					zoomOrigin: { x: 10, y: 20 },
				},
			};

			const zoomWithState = new Zoom(initialState);

			expect(zoomWithState.origin).toEqual({ x: 10, y: 20 });
			expect(zoomWithState.scale).toBe(2);
			expect(zoomWithState.panStart).toEqual(initialState.panStart);
		});
	});

	describe('capture()', () => {
		it('should capture current state', () => {
			zoom.origin = { x: 15, y: 25 };
			zoom.scale = 3;
			zoom.panning = true;

			const captured = zoom.capture();

			expect(captured.origin).toEqual({ x: 15, y: 25 });
			expect(captured.scale).toBe(3);
			expect(captured.panning).toBe(true);
		});

		it('should capture state as a snapshot', () => {
			zoom.origin = { x: 10, y: 20 };
			const captured = zoom.capture();

			// Modify original
			zoom.origin = { x: 100, y: 200 };

			// Captured should not be affected
			expect(captured.origin).toEqual({ x: 10, y: 20 });
		});
	});

	describe('restore()', () => {
		it('should restore state from provided snapshot', () => {
			const state: ZoomState = {
				origin: { x: 30, y: 40 },
				scale: 4,
				panning: true,
				panStart: {
					x: 10,
					y: 10,
					zoomOrigin: { x: 30, y: 40 },
				},
			};

			zoom.restore(state);

			expect(zoom.origin).toEqual({ x: 30, y: 40 });
			expect(zoom.scale).toBe(4);
			expect(zoom.panning).toBe(true);
			expect(zoom.panStart).toEqual(state.panStart);
		});
	});

	describe('reset()', () => {
		it('should reset state to initial values', () => {
			zoom.origin = { x: 50, y: 60 };
			zoom.scale = 5;
			zoom.panning = true;

			zoom.reset();

			expect(zoom.origin).toEqual({ x: 0, y: 0 });
			expect(zoom.scale).toBe(1);
			expect(zoom.panning).toBe(false);
			expect(zoom.panStart).toEqual({
				x: 0,
				y: 0,
				zoomOrigin: { x: 0, y: 0 },
			});
		});
	});

	describe('update()', () => {
		const mockElement = {
			getBoundingClientRect: () => ({
				x: 0,
				y: 0,
				width: 400,
				height: 300,
				top: 0,
				left: 0,
				bottom: 300,
				right: 400,
				toJSON: () => ({}),
			}),
			offsetHeight: 300,
			offsetWidth: 400,
		} as HTMLImageElement;

		describe('wheel event', () => {
			it('should zoom in on wheel up (negative deltaY)', () => {
				const initialScale = zoom.scale;
				zoom.update(mockElement, {
					via: 'wheel',
					event: {
						deltaY: -100,
						clientX: 200,
						clientY: 150,
					} as WheelEvent,
				});

				expect(zoom.scale).toBeGreaterThan(initialScale);
			});

			it('should zoom out on wheel down (positive deltaY)', () => {
				zoom.scale = 2;
				const initialScale = zoom.scale;
				zoom.update(mockElement, {
					via: 'wheel',
					event: {
						deltaY: 100,
						clientX: 200,
						clientY: 150,
					} as WheelEvent,
				});

				expect(zoom.scale).toBeLessThan(initialScale);
			});

			it('should not zoom below scale 1', () => {
				zoom.scale = 1;
				zoom.update(mockElement, {
					via: 'wheel',
					event: {
						deltaY: 100,
						clientX: 200,
						clientY: 150,
					} as WheelEvent,
				});

				expect(zoom.scale).toBe(1);
				expect(zoom.origin).toEqual({ x: 0, y: 0 });
			});

			it('should not zoom beyond scale 10', () => {
				zoom.scale = 10;
				const initialScale = zoom.scale;
				zoom.update(mockElement, {
					via: 'wheel',
					event: {
						deltaY: -100,
						clientX: 200,
						clientY: 150,
					} as WheelEvent,
				});

				expect(zoom.scale).toBe(initialScale);
			});
		});

		describe('pinch event', () => {
			it('should zoom in on positive distance', () => {
				const initialScale = zoom.scale;
				const pinchEvent: PinchEvent = {
					distance: 100,
					origin: { clientX: 200, clientY: 150 },
				};
				zoom.update(mockElement, { via: 'pinch', event: pinchEvent });

				expect(zoom.scale).toBeGreaterThan(initialScale);
			});

			it('should zoom out on negative distance', () => {
				zoom.scale = 2;
				const initialScale = zoom.scale;
				const pinchEvent: PinchEvent = {
					distance: -100,
					origin: { clientX: 200, clientY: 150 },
				};
				zoom.update(mockElement, { via: 'pinch', event: pinchEvent });

				expect(zoom.scale).toBeLessThan(initialScale);
			});
		});

		describe('keyboard event', () => {
			it('should zoom in with "+" key', () => {
				const initialScale = zoom.scale;
				zoom.update(mockElement, { via: 'keyboard', key: '+' });

				expect(zoom.scale).toBeGreaterThan(initialScale);
			});

			it('should zoom out with "-" key', () => {
				zoom.scale = 2;
				const initialScale = zoom.scale;
				zoom.update(mockElement, { via: 'keyboard', key: '-' });

				expect(zoom.scale).toBeLessThan(initialScale);
			});
		});

		describe('without element', () => {
			it('should update scale without element bounds', () => {
				const initialScale = zoom.scale;
				zoom.update(null, {
					via: 'wheel',
					event: {
						deltaY: -100,
						clientX: 200,
						clientY: 150,
					} as WheelEvent,
				});

				expect(zoom.scale).toBeGreaterThan(initialScale);
				expect(zoom.origin).toEqual({ x: 0, y: 0 });
			});
		});
	});

	describe('panning', () => {
		describe('startPanning()', () => {
			it('should set panning flag and record start position', () => {
				zoom.origin = { x: 10, y: 20 };
				zoom.scale = 2;

				zoom.startPanning({ clientX: 100, clientY: 200 });

				expect(zoom.panning).toBe(true);
				expect(zoom.panStart.x).toBe(100);
				expect(zoom.panStart.y).toBe(200);
				expect(zoom.panStart.zoomOrigin).toEqual({ x: 10, y: 20 });
			});
		});

		describe('stopPanning()', () => {
			it('should clear panning flag', () => {
				zoom.panning = true;
				zoom.stopPanning();

				expect(zoom.panning).toBe(false);
			});
		});

		describe('pan()', () => {
			it('should move origin when panning is active', () => {
				zoom.origin = { x: 0, y: 0 };
				zoom.startPanning({ clientX: 50, clientY: 50 });

				zoom.pan({ clientX: 100, clientY: 100 });

				expect(zoom.origin).toEqual({ x: 50, y: 50 });
			});

			it('should not move origin when panning is inactive', () => {
				zoom.origin = { x: 0, y: 0 };
				zoom.panning = false;

				zoom.pan({ clientX: 100, clientY: 100 });

				expect(zoom.origin).toEqual({ x: 0, y: 0 });
			});

			it('should handle multiple pan movements', () => {
				zoom.origin = { x: 0, y: 0 };
				zoom.startPanning({ clientX: 0, clientY: 0 });

				zoom.pan({ clientX: 50, clientY: 50 });
				expect(zoom.origin).toEqual({ x: 50, y: 50 });

				// Move from 50,50 to 100,100 (starting from original panStart)
				zoom.pan({ clientX: 100, clientY: 100 });
				expect(zoom.origin).toEqual({ x: 100, y: 100 });
			});
		});
	});

	describe('state management', () => {
		it('should support save and restore workflow', () => {
			zoom.origin = { x: 20, y: 30 };
			zoom.scale = 3;

			const savedState = zoom.capture();

			zoom.reset();
			expect(zoom.origin).toEqual({ x: 0, y: 0 });
			expect(zoom.scale).toBe(1);

			zoom.restore(savedState);
			expect(zoom.origin).toEqual({ x: 20, y: 30 });
			expect(zoom.scale).toBe(3);
		});
	});
});

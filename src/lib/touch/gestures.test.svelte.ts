import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Gestures } from './gestures.svelte.js';

type TouchPoint = Pick<Touch, 'identifier' | 'clientX' | 'clientY'>;

function createTouch(identifier: number, clientX: number, clientY: number): TouchPoint {
	return { identifier, clientX, clientY };
}

function createTouchList(touches: TouchPoint[]) {
	return {
		length: touches.length,
		item(index: number) {
			return touches[index] ?? null;
		},
	};
}

function dispatchTouchEvent(node: HTMLElement, type: string, touches: TouchPoint[]) {
	const event = new Event(type, { bubbles: true, cancelable: true });
	Object.defineProperty(event, 'touches', {
		value: createTouchList(touches),
	});
	node.dispatchEvent(event);
	return event as TouchEvent;
}

beforeEach(() => {
	vi.restoreAllMocks();
});

describe('Gestures', () => {
	it('emits a starting pan event on touchstart', async () => {
		const inside = document.createElement('div');
		const onpan = vi.fn();
		let gestures!: Gestures;
		const cleanup = $effect.root(() => {
			gestures = new Gestures(inside, { onpan });
		});
		await Promise.resolve();

		const touch = createTouch(1, 100, 200);
		const source = dispatchTouchEvent(inside, 'touchstart', [touch]);

		expect(gestures).toBeDefined();
		expect(onpan).toHaveBeenCalledTimes(1);
		expect(onpan).toHaveBeenCalledWith(
			expect.objectContaining({
				source,
				starting: true,
				starts: [touch],
				ends: [touch],
				origin: { clientX: 100, clientY: 200 },
				destination: { clientX: 100, clientY: 200 },
				dx: 0,
				dy: 0,
			})
		);

		cleanup();
	});

	it('classifies a two-finger move with a moving center as pan', async () => {
		const inside = document.createElement('div');
		const onpan = vi.fn();
		const onpinch = vi.fn();
		const cleanup = $effect.root(() => {
			new Gestures(inside, { onpan, onpinch });
		});
		await Promise.resolve();

		const startA = createTouch(1, 0, 0);
		const startB = createTouch(2, 0, 10);
		dispatchTouchEvent(inside, 'touchstart', [startA, startB]);

		const endA = createTouch(1, 20, 0);
		const endB = createTouch(2, 20, 10);
		dispatchTouchEvent(inside, 'touchmove', [endA, endB]);

		expect(onpan).toHaveBeenCalledTimes(2);
		expect(onpinch).not.toHaveBeenCalled();

		const moveEvent = onpan.mock.calls.at(1)?.[0];
		expect(moveEvent).toEqual(
			expect.objectContaining({
				starting: false,
				starts: [startA, startB],
				ends: [endA, endB],
				origin: { clientX: 0, clientY: 5 },
				destination: { clientX: 20, clientY: 5 },
				dx: 20,
				dy: 0,
			})
		);

		cleanup();
	});

	it('classifies a two-finger move with changing distance as pinch', async () => {
		const inside = document.createElement('div');
		const onpan = vi.fn();
		const onpinch = vi.fn();
		const cleanup = $effect.root(() => {
			new Gestures(inside, { onpan, onpinch });
		});
		await Promise.resolve();

		const startA = createTouch(1, 0, 0);
		const startB = createTouch(2, 0, 20);
		dispatchTouchEvent(inside, 'touchstart', [startA, startB]);

		const endA = createTouch(1, 0, 0);
		const endB = createTouch(2, 0, 10);
		dispatchTouchEvent(inside, 'touchmove', [endA, endB]);

		expect(onpan).toHaveBeenCalledTimes(1);
		expect(onpinch).toHaveBeenCalledTimes(1);

		const pinchEvent = onpinch.mock.calls[0]?.[0];
		expect(pinchEvent).toEqual(
			expect.objectContaining({
				source: expect.any(Event),
				starts: [startA, startB],
				ends: [endA, endB],
				origin: { clientX: 0, clientY: 10 },
				distance: -10,
				growing: false,
				shrinking: true,
			})
		);

		cleanup();
	});

	it('removes touch listeners when disposed', async () => {
		const inside = document.createElement('div');
		const addSpy = vi.spyOn(inside, 'addEventListener');
		const removeSpy = vi.spyOn(inside, 'removeEventListener');
		const cleanup = $effect.root(() => {
			new Gestures(inside, {});
		});
		await Promise.resolve();

		expect(addSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
		expect(addSpy).toHaveBeenCalledWith('touchend', expect.any(Function));
		expect(addSpy).toHaveBeenCalledWith('touchmove', expect.any(Function));

		cleanup();

		expect(removeSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
		expect(removeSpy).toHaveBeenCalledWith('touchend', expect.any(Function));
		expect(removeSpy).toHaveBeenCalledWith('touchmove', expect.any(Function));
	});
});
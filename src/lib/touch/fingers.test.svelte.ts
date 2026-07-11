import { beforeAll, describe, expect, it, vi } from 'vitest';

import { Fingers } from './fingers.svelte.js';

beforeAll(() => {
	if (!globalThis.PointerEvent) {
		class MockPointerEvent extends MouseEvent {
			pointerId: number;

			constructor(type: string, init: PointerEventInit = {}) {
				super(type, init);
				this.pointerId = init.pointerId ?? 0;
			}
		}

		vi.stubGlobal('PointerEvent', MockPointerEvent);
	}
});

describe('Fingers', () => {
	it('tracks pointer events when touch events are not supported', () => {
		const inside = { addEventListener: vi.fn() } as unknown as HTMLElement;
		let fingers!: Fingers;
		const cleanup = $effect.root(() => {
			fingers = new Fingers(inside);
		});

		fingers.register(new PointerEvent('pointerdown', { pointerId: 11, clientX: 1, clientY: 2 }));
		fingers.register(new PointerEvent('pointerdown', { pointerId: 22, clientX: 3, clientY: 4 }));

		expect(fingers.count).toBe(2);
		expect(fingers.multiple).toBe(true);

		fingers.register(new PointerEvent('pointerup', { pointerId: 11 }));
		expect(fingers.count).toBe(1);
		expect(fingers.single).toBe(true);
		expect(fingers.touches.at(0)?.pointerId).toBe(22);

		fingers.register(new PointerEvent('pointerup', { pointerId: 999 }));
		expect(fingers.count).toBe(1);
		cleanup();
	});

	it('uses mouse events when touch support is available', () => {
		const inside = document.createElement('div');
		Object.defineProperty(inside, 'ontouchstart', { value: null, configurable: true });
		let fingers!: Fingers;
		const cleanup = $effect.root(() => {
			fingers = new Fingers(inside);
		});

		fingers.register(new MouseEvent('mousedown', { clientX: 10, clientY: 20 }));
		expect(fingers.any).toBe(true);
		expect(fingers.single).toBe(true);
		expect(fingers.touches).toEqual([expect.objectContaining({ clientX: 10, clientY: 20 })]);

		fingers.register(new MouseEvent('mouseup'));
		expect(fingers.any).toBe(false);
		expect(fingers.count).toBe(0);
		cleanup();
	});

	it('can be reset manually', () => {
		let fingers!: Fingers;
		const cleanup = $effect.root(() => {
			fingers = new Fingers({ addEventListener: vi.fn() } as unknown as HTMLElement);
		});
		fingers.register(new PointerEvent('pointerdown', { pointerId: 1 }));
		expect(fingers.count).toBe(1);

		fingers.reset();
		expect(fingers.count).toBe(0);
		expect(fingers.multiple).toBe(false);
		cleanup();
	});
});

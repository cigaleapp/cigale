import type { MaybeArray } from '$lib/utils.js';
import type { Attachment } from 'svelte/attachments';

import { ensureArray, overrideStyle, switchValue } from '$lib/utils.js';

type Axis = 'horizontal' | 'vertical';
type Direction = 'up' | 'left' | 'right' | 'down';

/**
 * Calls the callback when an upward swipe is detected on the attached node.
 */
export function onswipe(
	/** Swipe directions to react to */
	direction: MaybeArray<Direction | 'horizontal' | 'vertical' | 'any'>,
	callback: (data: {
		/** The HTML element onSwipe has been attached to */
		element: HTMLElement;
		/** The direction of the swipe */
		direction: Direction;
		/** horizontal if direction is left or right, vertical otherwise */
		axis: Axis;
		/** deltaX (positive if right) or deltaY (positive if down) */
		distance: number;
	}) => void,
	{
		minDistance = {},
	}: {
		/** Use a number directly to specify the same value on both axes. Minimum distance to accept the swipe. If the number is <1, it's interpreted as a %age of the elements width/height (depending on the swiped direction's axis), if it's >=1 it's interpreted as a pixel length. Defaults to 30 on each axis. */
		minDistance?: number | Partial<Record<Axis, number>>;
	} = {}
): Attachment<HTMLElement> {
	const thresholds = {
		vertical: typeof minDistance === 'number' ? minDistance : (minDistance.vertical ?? 30),
		horizontal: typeof minDistance === 'number' ? minDistance : (minDistance.horizontal ?? 30),
	};

	const acceptedDirections = new Set<Direction>(
		ensureArray(direction)
			.map((dir) =>
				switchValue(dir, {
					up: ['up'],
					down: ['down'],
					left: ['left'],
					right: ['right'],
					horizontal: ['left', 'right'],
					vertical: ['up', 'down'],
					any: ['up', 'down', 'left', 'right'],
				})
			)
			.flat()
	);

	return (element) => {
		const cleanupOverscrollOverride = overrideStyle(
			'body, html',
			'overscroll-behavior-x',
			'none'
		);

		const { width, height } = element.getBoundingClientRect();
		if (thresholds.horizontal < 1) thresholds.horizontal *= width;
		if (thresholds.vertical < 1) thresholds.horizontal *= height;

		let touchStartX: number | undefined;
		let touchStartY: number | undefined;

		const onTouchStart = (event: TouchEvent) => {
			const touch = event.touches[0];
			if (!touch) return;

			touchStartX = touch.clientX;
			touchStartY = touch.clientY;
		};

		const onTouchEnd = (event: TouchEvent) => {
			if (touchStartX === undefined || touchStartY === undefined) return;

			const touch = event.changedTouches[0];
			if (!touch) return;

			const deltaX = touch.clientX - touchStartX;
			const deltaY = touch.clientY - touchStartY;

			touchStartX = undefined;
			touchStartY = undefined;

			const mostlyVertical = Math.abs(deltaY) > Math.abs(deltaX);
			const mostlyHorizontal = Math.abs(deltaX) > Math.abs(deltaY);

			const axis = mostlyVertical ? 'vertical' : mostlyHorizontal ? 'horizontal' : undefined;

			if (!axis) return;

			const threshold = thresholds[axis];

			const distance = switchValue(axis, {
				vertical: deltaY,
				horizontal: deltaX,
			});

			const direction = switchValue(axis, {
				vertical: distance > 0 ? 'down' : 'up',
				horizontal: distance > 0 ? 'right' : 'left',
			});

			if (Math.abs(distance) < threshold) {
				console.debug(
					`[onSwipe] ignored swipe ${direction} because of distance threshold: |${distance}| < ${threshold}`,
					minDistance
				);
				return;
			}

			if (!acceptedDirections.has(direction)) return;

			callback({ element, direction, axis, distance });
		};

		const onTouchCancel = () => {
			touchStartX = undefined;
			touchStartY = undefined;
		};

		element.addEventListener('touchstart', onTouchStart, { passive: true });
		element.addEventListener('touchend', onTouchEnd, { passive: true });
		element.addEventListener('touchcancel', onTouchCancel, { passive: true });

		return () => {
			element.removeEventListener('touchstart', onTouchStart);
			element.removeEventListener('touchend', onTouchEnd);
			element.removeEventListener('touchcancel', onTouchCancel);
			cleanupOverscrollOverride();
		};
	};
}

if (import.meta.vitest) {
	const { describe, it, expect, vi } = import.meta.vitest;

	describe('onswipe', () => {
		it('should call callback on upward swipe', () => {
			const callback = vi.fn();
			const node = document.createElement('div');
			const detach = onswipe('up', callback)(node);

			// Simulate touch events
			const touchStartEvent = new TouchEvent('touchstart', {
				touches: [{ identifier: 0, target: node, clientX: 100, clientY: 100 }],
			});
			const touchEndEvent = new TouchEvent('touchend', {
				changedTouches: [{ identifier: 0, target: node, clientX: 100, clientY: 50 }],
			});

			node.dispatchEvent(touchStartEvent);
			node.dispatchEvent(touchEndEvent);

			expect(callback).toHaveBeenCalled();

			detach();
		});
	});
}

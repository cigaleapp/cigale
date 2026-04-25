import type { Attachment } from 'svelte/attachments';

/**
 * Calls the callback when an upward swipe is detected on the attached node.
 */
export function onSwipe(
	// TODO: other directions
	direction: 'up',
	callback: () => void,
	{ minDistance = 30 }: { minDistance?: number } = {}
): Attachment<HTMLElement> {
	if (direction !== 'up') {
		throw new Error(`Unsupported swipe direction: ${direction}`);
	}

	return (node) => {
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
			const isSwipeUp = deltaY < -minDistance;
			if (mostlyVertical && isSwipeUp) {
				callback();
			}
		};

		const onTouchCancel = () => {
			touchStartX = undefined;
			touchStartY = undefined;
		};

		node.addEventListener('touchstart', onTouchStart, { passive: true });
		node.addEventListener('touchend', onTouchEnd, { passive: true });
		node.addEventListener('touchcancel', onTouchCancel, { passive: true });

		return () => {
			node.removeEventListener('touchstart', onTouchStart);
			node.removeEventListener('touchend', onTouchEnd);
			node.removeEventListener('touchcancel', onTouchCancel);
		};
	};
}

if (import.meta.vitest) {
	const { describe, it, expect, vi } = import.meta.vitest;

	describe('onSwipe', () => {
		it('should call callback on upward swipe', () => {
			const callback = vi.fn();
			const node = document.createElement('div');
			const detach = onSwipe('up', callback)(node);

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

export function onLongPress(timeout: number, callback: () => void): Attachment<HTMLElement> {
	return (node) => {
		let pressTimer: ReturnType<typeof setTimeout> | null = null;

		const ondown = () => {
			pressTimer = setTimeout(() => {
				callback();
			}, timeout);
		};

		const onup = () => {
			if (pressTimer) {
				clearTimeout(pressTimer);
				pressTimer = null;
			}
		};

		// node.addEventListener('mousedown', onMouseDown);
		// node.addEventListener('mouseup', onMouseUp);
		// node.addEventListener('mouseleave', onMouseUp);
		node.addEventListener('pointerdown', ondown);
		node.addEventListener('pointerup', onup);
		node.addEventListener('pointerleave', onup);

		return () => {
			// node.removeEventListener('mousedown', onMouseDown);
			// node.removeEventListener('mouseup', onMouseUp);
			// node.removeEventListener('mouseleave', onMouseUp);
			node.removeEventListener('pointerdown', ondown);
			node.removeEventListener('pointerup', onup);
			node.removeEventListener('pointerleave', onup);
		};
	};
}

if (import.meta.vitest) {
	const { describe, it, expect, vi } = import.meta.vitest;

	describe('onLongPress', () => {
		it('should call callback after long press', async () => {
			const callback = vi.fn();
			const node = document.createElement('div');
			const detach = onLongPress(500, callback)(node);

			node.dispatchEvent(new PointerEvent('pointerdown'));
			await new Promise((r) => setTimeout(r, 600)); // Wait longer than the timeout
			node.dispatchEvent(new PointerEvent('pointerup'));

			expect(callback).toHaveBeenCalled();

			detach();
		});

		it('should not call callback if press is released early', async () => {
			const callback = vi.fn();
			const node = document.createElement('div');
			const detach = onLongPress(500, callback)(node);

			node.dispatchEvent(new PointerEvent('pointerdown'));
			await new Promise((r) => setTimeout(r, 300)); // Wait less than the timeout
			node.dispatchEvent(new PointerEvent('pointerup'));

			expect(callback).not.toHaveBeenCalled();

			detach();
		});
	});
}

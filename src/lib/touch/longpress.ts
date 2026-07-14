import type { Attachment } from 'svelte/attachments';

export function onlongpress(
	timeout: number,
	callback: (e: PointerEvent) => void
): Attachment<HTMLElement> {
	return (node) => {
		let pressTimer: number | NodeJS.Timeout | null = null;
		let event: PointerEvent | null = null;

		const ondown = () => {
			pressTimer = setTimeout(() => {
				if (event) callback(event);
			}, timeout);
		};

		const onup = (e: PointerEvent) => {
			if (pressTimer) {
				clearTimeout(pressTimer);
				pressTimer = null;
				event = null;
			}

			event = e;
		};

		node.addEventListener('pointerdown', ondown);
		node.addEventListener('pointerup', onup);
		node.addEventListener('pointerleave', onup);

		return () => {
			node.removeEventListener('pointerdown', ondown);
			node.removeEventListener('pointerup', onup);
			node.removeEventListener('pointerleave', onup);
		};
	};
}

if (import.meta.vitest) {
	const { describe, it, expect, vi } = import.meta.vitest;

	describe('onlongpress', () => {
		it('should call callback after long press', async () => {
			const callback = vi.fn();
			const node = document.createElement('div');
			const detach = onlongpress(500, callback)(node);

			node.dispatchEvent(new PointerEvent('pointerdown'));
			await new Promise((r) => setTimeout(r, 600)); // Wait longer than the timeout
			node.dispatchEvent(new PointerEvent('pointerup'));

			expect(callback).toHaveBeenCalled();

			detach?.();
		});

		it('should not call callback if press is released early', async () => {
			const callback = vi.fn();
			const node = document.createElement('div');
			const detach = onlongpress(500, callback)(node);

			node.dispatchEvent(new PointerEvent('pointerdown'));
			await new Promise((r) => setTimeout(r, 300)); // Wait less than the timeout
			node.dispatchEvent(new PointerEvent('pointerup'));

			expect(callback).not.toHaveBeenCalled();

			detach?.();
		});
	});
}

import type { Attachment } from 'svelte/attachments';

export function scrollController(scroll: { y: number }): Attachment {
	return (node) => {
		if (!(node instanceof HTMLElement)) return;
		return new ScrollController(node, scroll).start();
	};
}

class ScrollController {
	mouseWheelActive = $state(false);

	constructor(
		public scrollable: HTMLElement,
		public scroll: { y: number }
	) {}

	/**
	 * Returns a cleanup function
	 */
	start() {
		// console.debug(
		// 	'[scroll controller] starting with scroll position',
		// 	this.scroll.y,
		// 	'on',
		// 	this.scrollable
		// );

		const cleanup = $effect.root(() => {
			if (this.scroll.y === this.scrollable.scrollTop) return;
			if (!this.scrollable.scrollHeight) return;
			// TODO figure out a better way to ensure the scroll happens when the container is ready
			requestAnimationFrame(() => {
				if (!this.scrollable) return;
				if (this.mouseWheelActive) return;
				console.debug('[scroll controller] syncing scroll position to', this.scroll.y);
				this.scrollable.scrollTo({
					top: this.scroll.y,
				});
			});
		});

		const onscroll = () => {
			this.scroll.y = this.scrollable.scrollTop;
		};

		const onmousewheel = () => {
			this.mouseWheelActive = true;
			setTimeout(() => {
				this.mouseWheelActive = false;
			}, 500);
		};

		this.scrollable.addEventListener('scroll', onscroll);
		this.scrollable.addEventListener('mousewheel', onmousewheel, { passive: true });

		return () => {
			cleanup();
			this.scrollable?.removeEventListener('scroll', onscroll);
			this.scrollable?.removeEventListener('mousewheel', onmousewheel);
		};
	}
}

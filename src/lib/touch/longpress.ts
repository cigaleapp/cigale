import type { Attachment } from 'svelte/attachments';

import { clicked } from 'clicked';

export function onlongpress(
	timeout: number,
	callbacks: {
		long: (e: MouseEvent | TouchEvent) => void;
		short?: (e: MouseEvent | TouchEvent) => void;
	}
): Attachment<HTMLElement> {
	return (node) => {
		const c = clicked(
			node,
			({ event, type }) => {
				if (type === 'long-clicked') callbacks.long(event);
				if (type === 'clicked') callbacks.short?.(event);
			},
			{
				clicked: true,
				longClicked: true,
				longClickedTime: timeout,
			}
		);

		return () => c.destroy();
	};
}

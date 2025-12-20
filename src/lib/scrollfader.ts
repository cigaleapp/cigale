import type { Attachment } from 'svelte/attachments';

/**
 * Indicates that a container is scrollable by fading out content at the bottom, unless there's nothing more to scroll.
 * Height of the fade is 200px.
 * Fade effect is achieved using CSS mask-image and a custom property (--fade) to control the opacity of the fade.
 * --fade is updated on scroll and corresponds to how far the user is from the bottom of the scrollable content, with 0 meaning at the bottom and 1 meaning 200px or more from the bottom.
 * @see https://github.com/harshmandan/svelte-overflow-fade/blob/0f8104c9f1ad29b8d3817e18dd016ad8a7ac09b2/src/lib/index.ts#L212
 * @param element the scrollable container to apply the fade to
 */
export const scrollfader: Attachment<HTMLElement> = (element) => {
	// TODO configurable / percentage of element clientHeight ?
	const height = 200;

	setupFadeProperty();

	const gradient = `linear-gradient(to bottom, 
			black calc(100% - ${height}px),
			rgba(0, 0, 0, calc(1 - var(--fade)))
		)`;

	element.style.maskImage = gradient;
	element.style.webkitMaskImage = gradient;
	element.style.transition = '--fade 0.1s ease';

	const onscroll = ({ target: scrollable }: Pick<Event, 'target'>) => {
		if (!(scrollable instanceof HTMLElement)) return;
		const scrollTop = scrollable.scrollTop;
		const scrollHeight = scrollable.scrollHeight;
		const clientHeight = scrollable.clientHeight;

		// --fade is 0 when at bottom, 1 when >= 200px remains from bottom
		const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
		const fadeValue = Math.min(distanceFromBottom / height, 1);
		element.style.setProperty('--fade', fadeValue.toString());
	};

	onscroll({ target: element });

	const observer = new MutationObserver(() => {
		onscroll({ target: element });
	});

	observer.observe(element, {
		attributes: true,
		childList: true,
		subtree: true,
		characterData: true
	});

	element.addEventListener('scroll', onscroll);

	return () => {
		element.removeEventListener('scroll', onscroll);
		observer.disconnect();
	};
};

function setupFadeProperty() {
	let styleElement = document.querySelector(
		'style[data-overflow-fade-styles]'
	) as HTMLStyleElement;
	const styleContent = `
		@property --fade {
			syntax: '<number>';
			initial-value: 0;
			inherits: false;
		}
	`;

	if (!styleElement) {
		styleElement = document.createElement('style');
		styleElement.setAttribute('data-overflow-fade-styles', '');
		styleElement.textContent = styleContent;
		document.head.appendChild(styleElement);
	} else {
		// Replace content to ensure it's correct
		styleElement.textContent = styleContent;
	}
}

if (import.meta.vitest) {
	const { describe, test, expect } = import.meta.vitest;

	describe('scrollfader attachment', () => {
		test('should set up the CSS properties correctly', () => {
			const div = document.createElement('div');
			div.style.height = '300px';
			div.style.overflowY = 'scroll';
			div.innerHTML = '<div style="height:1000px;"></div>';
			document.body.appendChild(div);

			const detach = scrollfader(div);

			expect(div.style.maskImage).toContain('linear-gradient');
			expect(div.style.webkitMaskImage).toContain('linear-gradient');
			expect(div.style.transition).toBe('--fade 0.1s ease');
			expect(div.style.getPropertyValue('--fade')).toBeDefined();

			detach?.();
			document.body.removeChild(div);
		});

		test('should update --fade on scroll', () => {
			const div = document.createElement('div');
			div.style.height = '300px';
			div.style.overflowY = 'scroll';
			div.innerHTML = '<div style="height:1000px;"></div>';
			document.body.appendChild(div);

			const detach = scrollfader(div);

			// Scroll to bottom
			div.scrollTop = div.scrollHeight - div.clientHeight;
			div.dispatchEvent(new Event('scroll'));
			expect(div.style.getPropertyValue('--fade')).toBe('0');

			// Scroll up 100px
			div.scrollTop -= 100;
			div.dispatchEvent(new Event('scroll'));
			expect(parseFloat(div.style.getPropertyValue('--fade'))).toBeGreaterThan(0);

			detach?.();
			document.body.removeChild(div);
		});
	});
}

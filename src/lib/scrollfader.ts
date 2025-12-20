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

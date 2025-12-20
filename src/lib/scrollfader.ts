import type { Attachment } from 'svelte/attachments';

export const scrollfader: Attachment<HTMLElement> = (element) => {
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

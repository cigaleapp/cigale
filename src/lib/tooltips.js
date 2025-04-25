import tippy from 'sveltejs-tippy';
import { displayPattern } from './KeyboardHint.svelte';
import xss from 'xss';

/**
 * @typedef {{text: string; keyboard?: string|undefined; delay?: number|undefined}} TooltipParameters
 */

/** @param {string | [string, number] | TooltipParameters | undefined} parameters */
function props(parameters) {
	const base = { arrow: svgArrow };
	let content = '';
	let delay = 50;
	if (!parameters) {
		return {
			...base,
			content: '',
			delay: [delay, 0]
		};
	}

	if (typeof parameters === 'string') content = parameters;
	else if (Array.isArray(parameters)) [content, delay] = parameters;
	else {
		return {
			...base,
			...parameters,
			delay: [delay, 0],
			allowHTML: Boolean(parameters.keyboard),
			content:
				xss(parameters.text) +
				// XXX: needs :global styling from KeyboardHint.svelte
				(parameters.keyboard
					? ' <kbd class=hint>' +
						displayPattern(parameters.keyboard)
							.entries()
							.map(([i, part]) =>
								i % 2 === 0 ? `<kbd>${part}</kbd>` : `<span class=separator>${part}</span>`
							)
							.toArray()
							.join('') +
						'</kbd>'
					: '')
		};
	}

	return { ...base, content, delay: [delay, 0] };
}

/**
 * Create a tooltip
 * @param {HTMLElement & {_tippy?: {destroy: () => void; setProps: (props: unknown) => void}}} node
 * @param {string | [string, number] | TooltipParameters | undefined} parameters text or [text, delay] or tippy.js options
 */
export function tooltip(node, parameters) {
	const properties = props(parameters);
	tippy(node, properties);
	if (properties.content.length <= 0) node._tippy?.destroy();

	return {
		/** @param {string | [string, number] | TooltipParameters | undefined} parameters */
		update(parameters) {
			const properties = props(parameters);
			if (!node._tippy) tippy(node, properties);
			if (properties.content.length <= 0) node._tippy?.destroy();
			node._tippy?.setProps(properties);
		},
		destroy() {
			node._tippy?.destroy();
		}
	};
}

const svgArrow =
	'<svg width="16" height="6" xmlns="http://www.w3.org/2000/svg"><path d="M0 6s1.796-.013 4.67-3.615C5.851.9 6.93.006 8 0c1.07-.006 2.148.887 3.343 2.385C14.233 6.005 16 6 16 6H0z"></svg>';

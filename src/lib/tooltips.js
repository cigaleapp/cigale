import tippy from 'sveltejs-tippy';

/** @param {string | [string, number] | object | undefined} parameters */
function props(parameters) {
	let content = '';
	let delay = 50;
	if (!parameters) {
		return {
			content: '',
			delay: [delay, 0]
		};
	}

	if (typeof parameters === 'string') content = parameters;
	else if (Array.isArray(parameters)) [content, delay] = parameters;
	else return { content: '', delay: [delay, 0], ...parameters };

	return { content, delay: [delay, 0] };
}

/**
 * Create a tooltip
 * @param {HTMLElement & {_tippy?: {destroy: () => void; setProps: (props: unknown) => void}}} node
 * @param {string | [string, number] | object | undefined} parameters text or [text, delay] or tippy.js options
 */
export function tooltip(node, parameters) {
	const properties = props(parameters);
	tippy(node, properties);
	if (properties.content.length <= 0) node._tippy?.destroy();

	return {
		/** @param {string | [string, number] | object | undefined} parameters */
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

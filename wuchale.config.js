import { adapter as svelte } from '@wuchale/svelte';
import { adapter as js } from 'wuchale/adapter-vanilla';
import { defineConfig } from 'wuchale';

export default defineConfig({
	sourceLocale: 'fr',
	otherLocales: ['en'],
	adapters: {
		main: svelte({
			heuristic(msg, { call, scope }) {
				const startsWithUpperLetter =
					msg[0] === msg[0].toUpperCase() && msg[0].toLowerCase() !== msg[0].toUpperCase();

				const isKeyboardShortcutExpression =
					/^(Shift|Ctrl|Alt)\+\S+$/.test(msg) ||
					/^Digit[\d#]$/.test(msg) ||
					/^Arrow(Left|Right|Up|Down)$/.test(msg) ||
					['Space', 'Enter', 'Escape', 'Tab', 'Backspace', 'Delete'].includes(msg) ||
					/^[A-Z]$/.test(msg);

				if (msg.startsWith('Arrow')) console.log(msg);
				if (isKeyboardShortcutExpression) {
					return false;
				}

				if (startsWithUpperLetter && scope === 'script') {
					return ['defineKeyboardShortcuts', 'seo'].includes(call);
				}
			}
		}),
		js: js({
			files: ['src/**/+{page,layout}.{js,ts}', 'src/**/+{page,layout}.server.{js,ts}']
		})
	}
});

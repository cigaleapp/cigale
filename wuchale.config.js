import { adapter as svelte } from '@wuchale/svelte';
import { defineConfig } from 'wuchale';
import { adapter as js } from 'wuchale/adapter-vanilla';

import { Tables } from './src/lib/database.js';

export default defineConfig({
	locales: ['fr', 'en'],
	// Translations are refreshed via a workflow,
	// see file://./.github/workflows/i18n.yml
	dev: false,
	adapters: {
		main: svelte({
			sourceLocale: 'fr',
			loader: 'sveltekit',
			files: ['src/**/*.svelte'],
			heuristic({ body, path }, file) {
				const [msg] = Array.isArray(body) ? body : [body];

				// Routes only load translations inside the (app) group
				if (file.includes('/routes/') && !file.includes('/(app)/')) return false;
				if (file.includes('/_playground/')) return false;

				// Table names
				if (Object.keys(Tables).includes(msg)) return false;

				// Probably math variables, see ModelOutputShapeDiagram.svelte
				if (msg.length === 1) return false;

				const functioncall = path.find((scope) => scope.type === 'call');

				if (functioncall && /^toasts\.(info|warn|error|success)$/.test(functioncall.name))
					return true;

				const startsWithUpperLetter =
					msg[0] === msg[0].toUpperCase() &&
					msg[0].toLowerCase() !== msg[0].toUpperCase();

				const isKeyboardShortcutExpression =
					/^(Shift|Ctrl|Alt)\+\S+$/.test(msg) ||
					/^Digit[\d#]$/.test(msg) ||
					/^Arrow(Left|Right|Up|Down)$/.test(msg) ||
					['Space', 'Enter', 'Escape', 'Tab', 'Backspace', 'Delete'].includes(msg) ||
					/^[A-Z]$/.test(msg);

				if (isKeyboardShortcutExpression) {
					return false;
				}

				if (startsWithUpperLetter) {
					const functions = [
						'defineKeyboardShortcuts',
						'seo',
						'$derived.by',
						'$derived',
						'$effect',
					];

					// Markup (template) strings are UI labels → translate.
					// Script strings are usually identifiers → only translate inside
					// the special functions above.
					const inMarkup = path.some(
						(scope) => scope.type === 'element' || scope.type === 'attribute'
					);
					if (inMarkup) return true;

					return path.some(
						(scope) => scope.type === 'call' && functions.includes(scope.name)
					);
				}
			},
		}),
		js: js({
			sourceLocale: 'fr',
			loader: 'vite',
			files: [
				'src/**/+{page,layout}.{js,ts}',
				'src/**/+{page,layout}.server.{js,ts}',
				'src/lib/**.{js,ts}',
			],
			heuristic({ body }, file) {
				const [msg] = Array.isArray(body) ? body : [body];

				// Strings in test files
				if (file.endsWith('.test.js') || file.endsWith('.test.svelte.js')) return false;
				if (file.endsWith('.test.ts') || file.endsWith('.test.svelte.ts')) return false;

				// Probably keyboard shortcuts
				if (msg.length === 1) return false;

				// Microdiff action types
				if (['CREATE', 'REMOVE', 'CHANGE'].includes(msg)) return false;

				// EXIF IFDs
				if (['GPSInfo', 'Iop', 'MpfInfo'].includes(msg)) return false;

				// Log messages for ProcessingQueue
				if (file === 'src/lib/queue.svelte.js') {
					return false;
				}

				// Headers.get
				// TODO: figure out if using a condition based on funcName/call etc is possible?
				if (msg === 'Content-Type') return false;

				// EXIF fields in exif.js
				if (file === 'src/lib/exif.js') {
					return false;
				}

				// Table names
				if (Object.keys(Tables).includes(msg)) return false;
			},
		}),
	},
});

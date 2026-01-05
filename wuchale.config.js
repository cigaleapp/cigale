import { adapter as svelte } from '@wuchale/svelte';
import { defineConfig } from 'wuchale';
import { adapter as js } from 'wuchale/adapter-vanilla';

import { Tables } from './src/lib/database.js';

export default defineConfig({
	locales: ['fr', 'en'],
	// Translations are refreshed via a workflow,
	// see file://./.github/workflows/i18n.yml
	hmr: Boolean(process.env.CI),
	adapters: {
		main: svelte({
			sourceLocale: 'fr',
			loader: 'sveltekit',
			heuristic({ msgStr: [msg], details: { file, scope, call } }) {
				if (file.includes('/_playground/')) return false;

				// Table names
				if (scope === 'script' && Object.keys(Tables).includes(msg)) return false;

				// Probably math variables, see ModelOutputShapeDiagram.svelte
				if (msg.length === 1) return false;

				if (/^toasts\.(info|warn|error|success)$/.test(call)) return true;

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

				if (startsWithUpperLetter && scope === 'script') {
					return [
						'defineKeyboardShortcuts',
						'seo',
						'$derived.by',
						'$derived',
						'$effect'
					].includes(call);
				}
			}
		}),
		js: js({
			sourceLocale: 'fr',
			loader: 'vite',
			files: [
				'src/**/+{page,layout}.{js,ts}',
				'src/**/+{page,layout}.server.{js,ts}',
				'src/lib/**.js'
			],
			heuristic({ msgStr: [msg], details: { file, funcName, call } }) {
				// Strings in test files
				if (file.endsWith('.test.js') || file.endsWith('.test.svelte.js')) return false;

				// Probably keyboard shortcuts
				if (msg.length === 1) return false;

				// Microdiff action types
				if (['CREATE', 'REMOVE', 'CHANGE'].includes(msg)) return false;

				// Log messages for ProcessingQueue
				if (file === 'src/lib/queue.svelte.js') {
					if (call === '[MemberExpression].log') return false;
					if (call === '[MemberExpression].logWarning') return false;
				}

				// EXIF fields in exif.js
				if (file === 'src/lib/exif.js' && funcName === 'addExifMetadata') {
					return false;
				}

				// Table names
				if (Object.keys(Tables).includes(msg)) return false;
			}
		})
	}
});

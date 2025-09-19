/// <reference types="vitest" />
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { sveltekit } from '@sveltejs/kit/vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { execSync } from 'node:child_process';
import icons from 'unplugin-icons/vite';
import crossOriginIsolation from 'vite-plugin-cross-origin-isolation';
import { analyzer } from 'vite-bundle-analyzer';
import { defineConfig } from 'vitest/config';

const analyzerMode =
	/**
	 * @type {"json" | "server" | "static" | "disabled"}
	 */
	(process.env.BUNDLE_ANALYZER ?? 'disabled');

export default defineConfig({
	test: {
		environment: 'jsdom',
		include: ['src/lib/**/*.{test,spec}{.svelte,}.{js,ts}'],
		exclude: ['src/lib/paraglide/**'],
		includeSource: ['src/lib/**/*{.svelte,}.{js,ts}', 'scripts/generate-json-schemas.js'],
		reporters: process.env.GITHUB_ACTIONS ? ['dot', 'github-actions', 'html'] : ['default'],
		globalSetup: './vitest-timezone.js',
		setupFiles: ['./vitest-setup.js'],
		coverage: {
			reporter: ['json-summary', 'json', 'html'],
			reportOnFailure: true,
			include: ['src/lib/**/*{.svelte,}.{js,ts}'],
			exclude: ['src/lib/paraglide/**']
		}
	},
	server: {
		fs: {
			allow: ['./bun.lock']
		}
	},
	define: {
		'import.meta.vitest': 'undefined',
		'import.meta.env.buildCommit': JSON.stringify(execSync('git rev-parse HEAD').toString().trim()),
		'import.meta.env.previewingPrNumber': process.env.PR_NUMBER ?? 'null'
	},
	worker: {
		format: 'es',
		plugins: () => [svelte()]
	},
	resolve: process.env.VITEST
		? {
				conditions: ['browser']
			}
		: {},
	plugins: [
		analyzer(analyzerMode === 'disabled' ? { enabled: false } : { analyzerMode }),
		icons({
			compiler: 'svelte',
			defaultClass: 'icon'
		}),
		sveltekit(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			strategy: ['localStorage', 'preferredLanguage', 'baseLocale']
		}),
		crossOriginIsolation()
	],
	optimizeDeps: {
		exclude: ['onnxruntime-web', 'turbo_exif', 'fetch-progress']
	},
	assetsInclude: ['**/*.wasm']
});

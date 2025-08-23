import { paraglideVitePlugin } from '@inlang/paraglide-js';
/// <reference types="vitest" />
import { sveltekit } from '@sveltejs/kit/vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { execSync } from 'node:child_process';
import icons from 'unplugin-icons/vite';
import crossOriginIsolation from 'vite-plugin-cross-origin-isolation';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'jsdom',
		include: ['src/**/*.{test,spec}{.svelte,}.{js,ts}'],
		includeSource: ['src/**/*.{js,ts}', 'scripts/generate-json-schemas.js'],
		reporters: process.env.GITHUB_ACTIONS ? ['dot', 'github-actions', 'html'] : ['default'],
		globalSetup: './vitest-timezone.js',
		coverage: {
			reporter: ['json-summary', 'json', 'html'],
			reportOnFailure: true
		}
	},
	server: {
		fs: {
			allow: ['./package-lock.json']
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

/// <reference types="vitest" />
import { sveltekit } from '@sveltejs/kit/vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import {wuchale} from '@wuchale/vite-plugin';
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
		includeSource: ['src/lib/**/*{.svelte,}.{js,ts}', 'scripts/generate-json-schemas.js'],
		reporters: process.env.GITHUB_ACTIONS ? ['dot', 'github-actions', 'html'] : ['default'],
		globalSetup: './vitest-timezone.js',
		setupFiles: ['./vitest-setup.js'],
		coverage: {
			reporter: ['json-summary', 'json', 'html'],
			reportOnFailure: true,
			include: ['src/lib/**/*{.svelte,}.{js,ts}']
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
	assetsInclude: ['**/*.wasm'],
	optimizeDeps: {
		exclude: ['onnxruntime-web', 'turbo_exif', 'fetch-progress']
	},
	build: {
		minify: process.env.MINIFICATION !== 'off'
	},
	plugins: [
		analyzer(analyzerMode === 'disabled' ? { enabled: false } : { analyzerMode }),
		icons({
			compiler: 'svelte',
			defaultClass: 'icon'
		}),
		wuchale(),
		sveltekit(),
		crossOriginIsolation()
	]
});

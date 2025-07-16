/// <reference types="vitest" />
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import icons from 'unplugin-icons/vite';
import crossOriginIsolation from 'vite-plugin-cross-origin-isolation';

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
		'import.meta.vitest': 'undefined'
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
		crossOriginIsolation()
	],
	optimizeDeps: {
		exclude: ['onnxruntime-web', 'turbo_exif', 'fetch-progress']
	},
	assetsInclude: ['**/*.wasm'],
 build: { outDir: process.env.ELECTRON_BUILD ? '.vite/build' : undefined }
});

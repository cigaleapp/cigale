/// <reference types="vitest" />
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import icons from 'unplugin-icons/vite';
import crossOriginIsolation from 'vite-plugin-cross-origin-isolation';

export default defineConfig({
	test: {
		environment: 'jsdom',
		include: ['src/**/*.{test,spec}.{js,ts}'],
		reporters: process.env.GITHUB_ACTIONS ? ['dot', 'github-actions', 'html'] : ['html'],
		coverage: {
			reporter: ['json-summary', 'json', 'html'],
			reportOnFailure: true
		}
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
		exclude: ['onnxruntime-web', 'turbo_exif']
	},
	assetsInclude: ['**/*.wasm']
});

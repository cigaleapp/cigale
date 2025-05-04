/// <reference types="vitest" />
import { sveltekit } from '@sveltejs/kit/vite';
import istanbul from 'vite-plugin-istanbul';
import { defineConfig } from 'vitest/config';
import icons from 'unplugin-icons/vite';
import crossOriginIsolation from 'vite-plugin-cross-origin-isolation';

export default defineConfig({
	test: {
		environment: 'jsdom',
		include: ['src/**/*.{test,spec}.{js,ts}'],
		includeSource: ['src/**/*.{js,ts,svelte}'],
		reporters: process.env.GITHUB_ACTIONS ? ['dot', 'github-actions', 'html'] : ['default'],
		globalSetup: './vitest-timezone.js',
		coverage: {
			reporter: ['json-summary', 'json', 'html'],
			reportOnFailure: true
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
		crossOriginIsolation(),
		istanbul({
			include: 'src/*',
			exclude: ['node_modules', 'tests/'],
			extension: ['.ts', '.js', '.svelte'],
			requireEnv: false,
			forceBuildInstrument: process.env.PLAYWRIGHT_TEST_COVERAGE === '1'
		})
	],
	optimizeDeps: {
		exclude: ['onnxruntime-web', 'turbo_exif']
	},
	assetsInclude: ['**/*.wasm']
});

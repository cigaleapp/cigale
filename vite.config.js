/// <reference types="vitest" />
import { execSync } from 'node:child_process';
import { sveltekit } from '@sveltejs/kit/vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { wuchale } from '@wuchale/vite-plugin';
import arkenv from 'arkenv';
import { type } from 'arktype';
import postcssPresetEnv from 'postcss-preset-env';
import icons from 'unplugin-icons/vite';
import { analyzer } from 'vite-bundle-analyzer';
import crossOriginIsolation from 'vite-plugin-cross-origin-isolation';
import { defineConfig } from 'vitest/config';

const env = arkenv({
	GITHUB_ACTIONS: 'boolean = false',
	BUNDLE_ANALYZER: type.enumerated('json', 'server', 'static', 'disabled').default('disabled'),
	VITEST: 'boolean = false',
	DEBUG: 'boolean = false'
});

const prNumber = process.env.PR_NUMBER ? parseInt(process.env.PR_NUMBER, 10) : undefined;

export default defineConfig({
	test: {
		environment: 'jsdom',
		include: ['src/lib/**/*.test{.svelte,}.{js,ts}', 'src/routes/**/utils.js'],
		includeSource: [
			'src/lib/**/*{.svelte,}.{js,ts}',
			'scripts/generate-json-schemas.js',
			'src/routes/**/utils.js'
		],
		reporters: env.GITHUB_ACTIONS ? ['dot', 'github-actions', 'html'] : ['default'],
		globalSetup: './vitest-timezone.js',
		setupFiles: ['./vitest-setup.js'],
		coverage: {
			reporter: ['json-summary', 'json', 'html'],
			reportOnFailure: true,
			include: ['src/lib/**/*{.svelte,}.{js,ts}', 'src/routes/**/utils.js']
		}
	},
	server: {
		fs: {
			allow: ['./bun.lock']
		}
	},
	define: {
		'import.meta.vitest': 'undefined',
		'import.meta.env.buildCommit': JSON.stringify(
			execSync('git rev-parse HEAD').toString().trim()
		),
		'import.meta.env.previewingPrNumber': prNumber ?? 'null'
	},
	worker: {
		format: 'es',
		plugins: () => [svelte()]
	},
	resolve: env.VITEST ? { conditions: ['browser'] } : {},
	assetsInclude: ['**/*.wasm'],
	optimizeDeps: {
		exclude: ['onnxruntime-web', 'turbo_exif', 'fetch-progress']
	},
	build: {
		minify: !env.DEBUG,
		sourcemap: env.DEBUG ? 'inline' : false
	},
	css: {
		postcss: {
			plugins: [postcssPresetEnv({ browsers: 'baseline widely available, >1%' })]
		}
	},
	plugins: [
		analyzer(
			env.BUNDLE_ANALYZER === 'disabled'
				? { enabled: false }
				: { analyzerMode: env.BUNDLE_ANALYZER }
		),
		icons({
			compiler: 'svelte',
			defaultClass: 'icon'
		}),
		// FIXME Wuchale doesnt play well with Vitest for now
		env.VITEST ? undefined : wuchale(),
		sveltekit(),
		crossOriginIsolation()
	]
});

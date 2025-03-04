import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import icons from 'unplugin-icons/vite';
import crossOriginIsolation from 'vite-plugin-cross-origin-isolation'

export default defineConfig({
	plugins: [
		icons({
			compiler: 'svelte',
			defaultClass: 'icon'
		}),
		sveltekit()
	],
		// This is a known issue when using WebAssembly with Vite
	// Need to specify `optimizeDeps.exclude` to NPM packages that uses WebAssembly
	// See: https://github.com/vitejs/vite/issues/8427
	optimizeDeps: {
		exclude: ['onnxruntime-web']
	},

	assetsInclude: ['**/*.wasm']
});


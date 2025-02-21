import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
		// This is a known issue when using WebAssembly with Vite
	// Need to specify `optimizeDeps.exclude` to NPM packages that uses WebAssembly
	// See: https://github.com/vitejs/vite/issues/8427
	optimizeDeps: {
		exclude: ['onnxruntime-web']
	},

	assetsInclude: ['**/*.wasm']
});

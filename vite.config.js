import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import icons from 'unplugin-icons/vite';
import crossOriginIsolation from 'vite-plugin-cross-origin-isolation';

export default defineConfig({
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

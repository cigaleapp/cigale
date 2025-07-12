import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
	build: {
		outDir: '.vite/build',
		lib: {
			formats: ['es'],
			entry: 'src/electron/preload.js',
			fileName: 'preload'
		}
	}
});

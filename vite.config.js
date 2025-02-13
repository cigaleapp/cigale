import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import icons from 'unplugin-icons/vite';

// feur

export default defineConfig({
	plugins: [
		icons({
			compiler: 'svelte',
			defaultClass: 'icon'
		}),
		sveltekit()
	]
});

import { mdsvex } from 'mdsvex';
import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			pages: 'public',
			assets: 'public'
		})
	},

	preprocess: [mdsvex()],
	extensions: ['.svelte', '.svx']
};

export default config;

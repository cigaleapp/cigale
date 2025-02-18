import adapter from '@sveltejs/adapter-static';
import { mdsvex } from 'mdsvex';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			pages: 'public',
			assets: 'public',
			strict: false,
			fallback: '404.html'
		}),
		router: {
			type: 'hash'
		},
		paths: {
			base: process.env.ENVIRONMENT_URL ? new URL(process.env.ENVIRONMENT_URL).pathname.replace(/\/index\.html$/, '') : ''
		},
	},

	preprocess: [mdsvex()],
	extensions: ['.svelte', '.svx']
};

export default config;

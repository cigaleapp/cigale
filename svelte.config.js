import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		version: {
			name: process.env.BUILD_COMMIT || 'dev'
		},
		adapter: adapter({
			pages: process.env.ELECTRON_BUILD ? '.vite/build' : 'public',
			strict: false,
			fallback: '404.html'
		}),
		router: {
			type: 'hash'
		},
		paths: {
			base:
				process.env.BASE_PATH ||
				(process.env.ENVIRONMENT_URL
					? new URL(process.env.ENVIRONMENT_URL).pathname.replace(/\/index\.html$/, '')
					: '')
		}
	},

	extensions: ['.svelte', '.svx']
};

export default config;

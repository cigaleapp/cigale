import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		version: {
			name: process.env.BUILD_COMMIT || 'dev'
		},
		adapter: adapter({
			pages: process.env.ELECTRON_BUILD ? '.vite/build/sveltekit' : 'public',
			fallback: process.env.GITHUB_ACTIONS ? '404.html' : 'index.html'
		}),
		alias: {
			$worker: 'src/worker',
			$locales: 'src/locales',
			$routes: 'src/routes'
		},
		paths: {
			base:
				process.env.BASE_PATH ||
				(process.env.ENVIRONMENT_URL
					? new URL(process.env.ENVIRONMENT_URL).pathname.replace(/\/index\.html$/, '')
					: '')
		}
	},

	vitePlugin: {
		inspector: true
	},

	extensions: ['.svelte', '.svx']
};

export default config;

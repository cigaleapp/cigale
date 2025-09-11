import { download, constructURL } from 'google-fonts-helper';

import path from 'node:path';
const here = import.meta.dirname;

await download(
	constructURL({
		display: 'swap',
		families: {
			'Host Grotesk': {
				wght: '300..800',
				ital: '300..800'
			},
			'Fragment Mono': {
				ital: true
			}
		}
	}),
	{
		outputDir: path.join(here, '../static'),
		fontsDir: 'fonts',
		stylePath: 'fonts.css',
		fontsPath: '/fonts'
	}
).execute();

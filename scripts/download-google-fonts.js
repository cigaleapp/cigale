import path from 'node:path';
import { constructURL, download } from 'google-fonts-helper';

const here = import.meta.dirname;

const url = constructURL({
	display: 'swap',
	families: {
		'Host Grotesk': {
			wght: '300..800',
			ital: '300..800'
		},
		'Martian Mono': {
			wght: '200..800'
		}
	}
})
	// See https://github.com/datalogix/google-fonts-helper/issues/79
	.replace(':ital@1', ':ital@0;1');

console.info('Downloading', url);

await download(url, {
	outputDir: path.join(here, '../static'),
	fontsDir: 'fonts',
	stylePath: 'fonts.css',
	fontsPath: `${process.env.BASE_PATH ?? ''}/fonts`
}).execute();

import path from 'node:path';
import { exit } from 'node:process';

import { constructURL, download } from 'google-fonts-helper';

const root = path.resolve(import.meta.dir, '..');
const staticDir = path.join(root, 'static');
const fontsCSS = path.join(staticDir, 'fonts.css');

if (await Bun.file(fontsCSS).exists()) {
	console.info(`Skipping fonts download: ${path.relative(root, fontsCSS)} already exists`);
	exit(0);
}

const url = constructURL({
	display: 'swap',
	families: {
		'Host Grotesk': {
			wght: '300..800',
			ital: '300..800',
		},
		'Martian Mono': {
			wght: '200..800',
		},
	},
})
	// See https://github.com/datalogix/google-fonts-helper/issues/79
	.replace(':ital@1', ':ital@0;1');

console.info('Downloading', url);

await download(url, {
	outputDir: staticDir,
	fontsDir: 'fonts',
	stylePath: path.basename(fontsCSS),
	fontsPath: `${process.env.BASE_PATH ?? ''}/fonts`,
}).execute();

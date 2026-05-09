import { mkdirSync } from 'node:fs';

const prNumber = process.env.PR_NUMBER;
const assetsDir = './capacitor-assets';

mkdirSync(assetsDir, {
	recursive: true,
});

const scenario = prNumber
	? 'preview'
	: process.env.FLAVOR === 'nightly'
		? 'nightly'
		: process.env.CI
			? 'production'
			: 'local';

const badge = {
	preview: {
		text: `#${prNumber}`,
		fill: await getCSSVariable('fg-primary', 'light'),
		color: '#FFFFFF',
	},
	nightly: {
		text: 'Dev',
		fill: await getCSSVariable('fg-warning', 'dark'),
		color: '#000000',
	},
	local: {
		text: 'Local',
		fill: await getCSSVariable('fg-error', 'light'),
		color: '#FFFFFF',
	},
};

console.info(`Generating logo assets for ${scenario} scenario...`);

let svg: string;
if (scenario === 'production') {
	svg = await Bun.file('./static/logo.svg').text();
} else {
	const logoPRPreviewSVG = await Bun.file('./static/logo-pr-preview.svg').text();
	const fontsCSS = await Bun.file('./static/fonts.css').text();

	svg = logoPRPreviewSVG
		// Contents of fonts.css
		// XXX: the & in the URL comment fucks up XML parsing lol
		.replace('FONTS_CSS', fontsCSS.replaceAll('&', '_'))
		// Text of badge
		.replace('PILLTXT', badge[scenario].text)
		// Background color of badge
		.replace('#FF0000', badge[scenario].fill)
		// Text color of badge
		.replace('#00FF00', badge[scenario].color);
}

await Bun.file(`${assetsDir}/logo.svg`).write(svg);

const cmd = [
	'bun',
	'capacitor-assets',
	'generate',

	'--androidProject',
	'./android',
	'--assetPath',
	assetsDir,
	'--iconBackgroundColor',
	// await getCSSVariable('bg-primary', 'light'),
	'#CAFFFB',
	'--iconBackgroundColorDark',
	await getCSSVariable('bg-primary', 'dark'),
	'--splashBackgroundColor',
	// await getCSSVariable('bg-primary', 'light'),
	'#CAFFFB',
	'--splashBackgroundColorDark',
	await getCSSVariable('bg-primary', 'dark'),
	'--logoSplashScale',
	'0.2',
];

console.info(`$ ${cmd.join(' ')}`);

await Bun.spawn(cmd, {
	onExit(_, code) {
		if (code !== 0) {
			throw new Error(`capacitor-assets exited with code ${code}`);
		}
	},
}).exited;

async function getCSSVariable(name: string, variant: 'light' | 'dark'): Promise<string> {
	const file = await Bun.file('src/routes/style.css').text();
	const regex = new RegExp(
		`--${name}:\\s*light-dark\\((#[a-fA-F0-9]{6}),\\s*(#[0-9a-fA-F]{6})\\);`
	);

	const match = file.match(regex);
	if (!match) {
		throw new Error(`Variable --${name} not found in style.css: searched for regex ${regex}`);
	}

	switch (variant) {
		case 'light':
			return match[1];

		case 'dark':
			return match[2];

		default:
			throw new Error(`Invalid variant: ${variant}`);
	}
}

export {};

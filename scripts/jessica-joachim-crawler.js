import { execa } from 'execa';
import { JSDOM } from 'jsdom';
import { marked } from 'marked';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import Turndown from 'turndown';
import getCurrentLine from 'get-current-line';
import { default as taxonomy } from '../static/taxonomy.json' with { type: 'json' };
import { writeFileSync } from 'node:fs';

// ANSI control sequences
const cc = {
	clearline: '\x1b[2K',
	red: '\x1b[31m',
	reset: '\x1b[0m',
	dim: '\x1b[2m',
	blue: '\x1b[34m',
	bold: '\x1b[1m',
	yellow: '\x1b[33m'
};

const _tdown = new Turndown();
/** @param {string} html  */
function htmlToMarkdown(html) {
	return _tdown.turndown(html);
}

function markdownToHtml(markdown) {
	return marked.parse(markdown);
}

/** @type {Array<{ name: string; url: string; found: Array<{ name: string; url: string }> }>}  */
const reportTable = [];

function renderReportTable() {
	return `Recherche effectuée | Résultats\n-----------------|------------------\n${reportTable.map(({ name, url, found }) => `[${name}](${url}) | ${found.map(({ name, url }) => `[${name}](${url})`).join(', ')}`).join('\n')}`;
}

const classmapping = await fetch('https://cigaleapp.github.io/models/class_mapping.txt')
	.then((r) => r.text())
	.then((text) =>
		Object.fromEntries(
			text
				.split('\n')
				.filter((x) => x.trim())
				.map((line, i) => [line, i])
		)
	);

const here = path.dirname(new URL(import.meta.url).pathname).replace('/C:/', 'C:/');
console.log({ here });

/** @param {string} id */
const namespaced = (id) => `io.github.cigaleapp.arthropods.transects__${id}`;

/** @param {string} clade  */
const cladeEnumOption = (clade) => ({
	key: clade.toLowerCase(),
	label: clade,
	learnMore: `https://en.wikipedia.org/wiki/${clade.replaceAll(' ', '_')}`,
	description: ''
});

const cladeMetadata = (clade, label, parent) => ({
	type: 'enum',
	options: Object.keys(parent).map(cladeEnumOption),
	label,
	required: false,
	description: '',
	mergeMethod: 'average',
	taxonomic: {
		clade,
		parent: Object.fromEntries(
			Object.entries(parent).map(([k, v]) => [k.toLowerCase(), v.toLowerCase()])
		)
	}
});

/**
 * @type {typeof import('../src/lib/protocols').ExportedProtocol.inferIn}
 */
const protocol = {
	$schema: 'https://cigaleapp.github.io/cigale/protocol.schema.json',
	id: 'io.github.cigaleapp.arthropods.transects',
	name: "Transect d'arthropodes",
	source: `https://github.com/cigaleapp/cigale/tree/${await execa`git rev-parse HEAD`.then((result) => result.stdout)}/scripts/jessica-joachim-crawler.js#L${getCurrentLine().line}`,
	description:
		'Protocole de transect pour l’identification des arthropodes. Descriptions et photos des espèces de Jessica Joachim, cf https://jessica-joachim.com/identification',
	authors: [
		{
			name: 'Jessica Joachim (photos et descriptions des espèces)',
			email: 'tifaeriis@gmail.com'
		}
	],
	metadataOrder: [
		namespaced('species'),
		namespaced('genus'),
		namespaced('family'),
		namespaced('order'),
		namespaced('shoot_date'),
		namespaced('shoot_location'),
		namespaced('class'),
		namespaced('phylum'),
		namespaced('kingdom'),
		namespaced('crop')
	],
	metadata: {
		[namespaced('kingdom')]: {
			...cladeMetadata('kingdom', 'Règne', {}),
			options: [cladeEnumOption('Animalia')]
		},
		[namespaced('phylum')]: cladeMetadata('phylum', 'Phylum', taxonomy.phyla),
		[namespaced('class')]: cladeMetadata('class', 'Classe', taxonomy.classes),
		[namespaced('order')]: cladeMetadata('order', 'Ordre', taxonomy.orders),
		[namespaced('family')]: cladeMetadata('family', 'Famille', taxonomy.families),
		[namespaced('genus')]: cladeMetadata('genus', 'Genre', taxonomy.genera),
		[namespaced('shoot_date')]: {
			type: 'date',
			label: 'Date',
			description: 'Moment où la photo a été prise',
			required: false,
			mergeMethod: 'average',
			infer: { exif: 'DateTimeOriginal' }
		},
		[namespaced('shoot_location')]: {
			type: 'location',
			label: 'Localisation',
			description: 'Endroit où la photo a été prise',
			required: false,
			mergeMethod: 'average',
			infer: { latitude: { exif: 'GPSLatitude' }, longitude: { exif: 'GPSLongitude' } }
		},
		[namespaced('crop')]: {
			type: 'boundingbox',
			label: '',
			description: '',
			required: true,
			mergeMethod: 'average'
		},
		[namespaced('species')]: {
			type: 'enum',
			label: 'Espèce',
			description: '',
			required: true,
			mergeMethod: 'max',
			options: [],
			taxonomic: {
				clade: 'species',
				parent: {}
			},
			infer: {
				neural: {
					model: 'https://cigaleapp.github.io/models/model_classif.onnx',
					metadata: namespaced('species'),
					input: {
						height: 224,
						width: 224,
						disposition: 'CHW',
						normalized: true
					}
				}
			}
		}
	},
	crop: {
		metadata: namespaced('crop'),
		infer: {
			model: 'https://cigaleapp.github.io/models/arthropod_detector_yolo11n_conf0.437.onnx',
			input: {
				height: 640,
				width: 640,
				disposition: '1CHW',
				normalized: true
			},
			output: {
				normalized: true,
				shape: ['sx', 'sy', 'ex', 'ey', 'score', '_']
			}
		}
	},
	exports: {
		images: {
			cropped:
				'Cropped/{{ fallback image.protocolMetadata.species.valueLabel "(Unknown)" }}_{{ sequence }}.{{ extension image.filename }}',
			original:
				'Original/{{ fallback image.protocolMetadata.species.valueLabel "(Unknown)" }}_{{ sequence }}.{{ extension image.filename }}'
		},
		metadata: {
			json: 'analysis.json',
			csv: 'metadata.csv'
		}
	}
};

const total = Object.keys(classmapping).length;
let done = 0;

for (const [name, index] of Object.entries(classmapping)) {
	const progressHeader = `[${cc.blue}${done}/${total}${cc.reset}]`;
	const progressHeaderLength = `[${done}/${total}]`.length;
	const searchedName = name.trim().toLowerCase();
	const searchurl = `https://jessica-joachim.com/?s=${encodeURIComponent(searchedName).replaceAll('%20', '+')}`;
	// Do a search
	const searchPage = await fetch(searchurl)
		.then((r) => r.text())
		.then((text) => new JSDOM(text).window.document);

	let speciesPageUrl = [...searchPage.querySelectorAll('a')].find(
		(a) => a.textContent.trim().toLowerCase() === searchedName
	)?.href;
	if (!speciesPageUrl) {
		// Try <gender name> sp. instead of matching full binomial species name
		const [genus] = searchedName.split(' ');
		speciesPageUrl = [...searchPage.querySelectorAll('a')].find(
			(a) => a.textContent.trim().toLowerCase() === `${genus} sp`
		)?.href;

		if (speciesPageUrl) {
			console.error(
				`${cc.clearline}\r${progressHeader} ${cc.yellow}Using ${genus} sp. instead of ${name}${cc.reset}`
			);
		}
	}
	if (!speciesPageUrl) {
		let linksFound = [...searchPage.querySelector('main').querySelectorAll('a')]
			.filter((a) => a.textContent.trim())
			.filter((a) => !a.textContent.includes('Lire la suite'))
			.filter((a) => !a.textContent.endsWith(' commentaires'));
		// Uniquify by URL
		const uniqueLinks = new Map(linksFound.map((a) => [a.href, a]));
		linksFound = [...uniqueLinks.values()];
		console.error(
			`${cc.clearline}\r${progressHeader} ${cc.red}${name}: not found (out of ${linksFound.length} links)${cc.reset}`
		);
		if (linksFound.length) {
			console.error(`Links found on ${cc.dim}${cc.blue}${searchurl}${cc.reset}`);
			for (const link of linksFound) {
				console.error(
					`${' '.repeat(progressHeaderLength)} ${cc.dim}${cc.bold}·${cc.reset} ${cc.bold}${cc.blue}${link.textContent}${cc.reset} ${cc.dim}${link.href}${cc.reset}`
				);
			}
		}
		protocol.metadata[namespaced('species')].options.push(
			/** @satisfies {import('../src/lib/database').MetadataEnumVariant} */ ({
				key: index.toString(),
				label: name,
				description: ''
			})
		);

		protocol.metadata[namespaced('species')].taxonomic.parent[index.toString()] =
			taxonomy.species[name]?.toLowerCase() ?? '';

		protocol.metadata[namespaced('species')].options.sort(
			(a, b) => parseFloat(a.key) - parseFloat(b.key)
		);
		reportTable.push({
			name,
			url: searchurl,
			found: linksFound.map((a) => ({ name: a.textContent, url: a.href }))
		});
		continue;
	}
	await fetch(speciesPageUrl)
		.then((r) => r.text())
		.then((content) => parseAndAddToProtocol(content, speciesPageUrl, name, index));
}

if (reportTable.length) {
	await writeFile(path.join(here, 'jessica-joachim-crawler-report.md'), renderReportTable());
	console.error(
		`\n${cc.bold}${cc.blue}Report written to ${here}/jessica-joachim-crawler-report.md${cc.reset}`
	);
}

/**
 *
 * @param {string} pageContent
 * @param {string} url
 * @param {string} name
 * @param {number} classmappingIndex
 */
async function parseAndAddToProtocol(pageContent, url, name, classmappingIndex) {
	const dom = new JSDOM(pageContent);
	const main = dom.window.document.querySelector('main');
	if (!main) return;
	// const text = main.textContent;
	const markdown = htmlToMarkdown(main.innerHTML).replaceAll('\u00a0', ' ');

	// console.log(`Adding ${name} to the species, from ${file}`);
	let identificationHints = '';
	try {
		identificationHints = markdown.split('**Identification** : ')[1]?.split('**')[0];
	} catch {
		// eslint-disable no-empty
	}

	if (!identificationHints) {
		try {
			identificationHints = markdown.split('#### Identification')[1]?.split('####')[0];
		} catch {
			// eslint-disable no-empty
		}
	}
	const cleaneddom = new JSDOM(markdownToHtml(identificationHints || '<body></body>'));

	const text = cleaneddom.window.document.documentElement.textContent
		.replaceAll('\u00a0', ' ')
		.replaceAll('• ', '\r\n• ')
		.trim();
	const images = [...main.querySelectorAll('img')].map(({ src }) => src);

	if (!text) {
		console.error(`\n\x1b[31mNo text found, main page content was:\x1b[0m`);
		console.error(markdown.replaceAll('\n', '\n\t'));
		console.error();
	}
	// Download image since CORP prevents us from using them directly
	let imagepath = '';
	if (images.length) {
		const image = images[0];
		imagepath = path.join(here, '../examples/arthropods.cigaleprotocol.images', `${name}.jpeg`);
		await mkdir(path.dirname(imagepath), { recursive: true });
		// await execa`wget -O ${imagepath} ${image}`;
		await fetch(image)
			.then((r) => r.arrayBuffer())
			.then((buf) => {
				writeFileSync(imagepath, Buffer.from(buf));
			});
		images[0] = imagepath;
	}
	protocol.metadata[namespaced('species')].options.push(
		/** @satisfies {NonNullable<import('../src/lib/database').Metadata['options']>[number]} */ ({
			key: classmappingIndex.toString(),
			label: name,
			description: text,
			learnMore: url,
			...(imagepath
				? {
						image: `https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/${encodeURIComponent(name)}.jpeg`
					}
				: {})
		})
	);
	protocol.metadata[namespaced('species')].taxonomic.parent[classmappingIndex.toString()] =
		taxonomy.species[name]?.toLowerCase() ?? '';
	protocol.metadata[namespaced('species')].options.sort(
		(a, b) => parseFloat(a.key) - parseFloat(b.key)
	);
	done++;
	// Erase previous line, print current progress
	process.stdout.write(
		`${cc.clearline}\r[${cc.blue}${done}/${total}${cc.reset}] Added ${cc.bold}${name}${cc.reset}`
	);

	// writeFile(path.join(here, 'species.json'), JSON.stringify(species, null, 2));
	await mkdir(path.join(here, '../examples'), { recursive: true });
	writeFile(
		path.join(here, '../examples/arthropods.cigaleprotocol.json'),
		JSON.stringify(protocol, null, 2)
	);
}

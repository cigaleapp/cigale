import type { CladedName, Option } from '../lib/modules.js';

import { GoogleDrive } from '../datasources/gdrive.js';
import { Enricher, matchCladedName, NameProvider, OptionExtra } from '../lib/modules.js';

const WEB_ORIGIN = process.env.WEB_ORIGIN ?? 'http://localhost:3000';

if (!process.env.WEB_ORIGIN) {
	console.warn(
		`WEB_ORIGIN env var not set, falling back to http://localhost:3000. THIS WILL NOT WORK IN PROD!`
	);
}

const ASSETS_URL_BASE = `${WEB_ORIGIN}/assets`;

export class GoogleDriveSlides implements NameProvider {
	name = 'gdrive' as const;

	gdrive: GoogleDrive;

	constructor() {
		this.gdrive = new GoogleDrive();
	}

	async *scan() {
		const { files } = await this.gdrive.one('files', {});

		for (const file of files) {
			const name = parseFilename(file.name);
			if (name) yield name;
		}
	}
}

function parseFilename(name: string): CladedName | undefined {
	if (name === 'A-BASE') return undefined;

	if (name.endsWith(' sp')) {
		return { clade: 'genus', name: name.replace(/ sp$/, '').trim() };
	} else {
		return { clade: 'species', name };
	}
}

export class GoogleSlides implements Enricher {
	name = 'gslides' as const;

	gdrive: GoogleDrive;

	chunksize = 1;

	availableTaxons: Array<CladedName> = [];

	constructor() {
		this.gdrive = new GoogleDrive();
	}

	async init() {
		const { files } = await this.gdrive.one('files', {});
		for (const { name } of files) {
			const parsed = parseFilename(name);
			if (!parsed) continue;
			this.availableTaxons.push(parsed);
		}
	}

	available({ clade, name }: Option): boolean {
		return this.availableTaxons.some(matchCladedName({ clade, name }));
	}

	async *enrich(options: Option[]) {
		for (const { id, clade, name } of options) {
			if (!id) continue;
			if (!['species', 'genus'].includes(clade)) continue;

			const data = await this.gdrive.one('slide', { name, clade });
			if (!data) continue;

			yield {
				id,
				priority: 3,
				extra: {
					description: data.description,
					learnMore: data.learnMore,
					images: data.images.map((image) =>
						new URL(
							`${ASSETS_URL_BASE}/${this.name}/${encodeURIComponent(image.filename)}`
						).toString()
					),
				} satisfies OptionExtra,
			};
		}
	}
}

import type { Option } from '../lib/modules.js';

import { JessicaJoachimSite, Page } from '../datasources/jj.js';
import { Enricher, matchCladedName } from '../lib/modules.js';

const IGNORED_PAGES = [
	'https://jessica-joachim.com/?page_id=141560',
	'https://jessica-joachim.com/insectes/hymenopteres/gasteruptiidae/gasteruption-genre/',
];

export class JessicaJoachim implements Enricher {
	name = 'jj' as const;

	jj: JessicaJoachimSite;

	index: Page[] | undefined;

	constructor() {
		this.jj = new JessicaJoachimSite();
	}

	async init() {
		this.index ??= await this.jj.one('index', {}).then((r) => r.pages);
		this.index = this.index!.filter((p) => !IGNORED_PAGES.includes(p.link));
	}

	available(option: Option): boolean {
		return this.index!.some(matchCladedName(option));
	}

	async *enrich(options: Option[]) {
		const lookups = this.index!.filter((page) => options.some(matchCladedName(page)));

		for (let i = 0; i < options.length; i += this.jj.chunksize) {
			const chunk = lookups.slice(i, i + this.jj.chunksize);

			const fiches = await this.jj.many(
				'pages',
				chunk.map((l) => ({ link: l.link }))
			);

			for (const fiche of fiches) {
				if (!fiche) continue;
				const { link, extra } = fiche;
				const page = this.index!.find((page) => page.link === link)!;
				const opt = options.find(matchCladedName(page));
				if (!opt?.id) continue;
				yield { id: opt.id, priority: 10, extra };
			}
		}
	}
}

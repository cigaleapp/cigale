/// <reference types="@types/bun" />

import { unzip as _unzip, UnzipOptions, Unzipped, unzipSync } from 'fflate';

import { EMPTY_EXTRA, Enrich, Option } from './modules.js';

export class IUCN implements Enrich {
	name = 'iucn' as const;

	archiveURL = 'https://hosted-datasets.gbif.org/datasets/iucn/iucn-latest.zip';

	dataset:
		| undefined
		| {
				names: Array<{ id: string; name: string }>;
				statuses: Array<{ id: string; status: string }>;
		  };

	// Archive is still using deprecated term threatStatus instead of more recent iucnRedListCategory
	// see https://gbif.github.io/dwc-api/apidocs/src-html/org/gbif/dwc/terms/IucnTerm.html
	// see https://chatgpt.com/c/6b00a15d-ad60-83eb-b618-f943f0c286f1
	statuses = {
		'Conservation Dependent': 'cd',
		'Critically Endangered': 'cr',
		Extinct: 'ex',
		'Extinct in the wild': 'ew',
		Endangered: 'en',
		Vulnerable: 'vu',
		'Near threatened': 'nt',
		'Least Concern': 'lc',
		'Lower Risk': 'lr',
		'Data deficient': 'dd',
		'Not evaluated': 'ne',
	};

	constructor() {}

	async downloadDataset() {
		const archive = await fetch(this.archiveURL)
			.then((response) => response.arrayBuffer())
			.then((buf) => new Uint8Array(buf));

		const metafile = await unzip(archive, 'meta.xml').then(
			(files) => Bun.XML.parse(files['meta.xml']) as DarwinCoreMetafile
		);

		const filenames = {
			// <core> should have the scientificName dwc term
			name: metafile.archive.core.files.location,
			// find <extension> that has iucn:threatStatus
			status: metafile.archive.extension.find((ext) =>
				ext.field.some((f) => f['@term'] === 'https://iucn.org/terms/threatStatus')
			)!.files.location,
		};

		const data = await unzip(archive, filenames.name, filenames.status).then((files) => ({
			name: files[filenames.name],
			status: files[filenames.status],
		}));

		const process = <C extends string>(
			meta: {
				'@fieldsTerminatedBy': string;
				'@linesTerminatedBy': string;
				'@ignoreHeaderLines': string;
				'@fieldsEnclosedBy': string;
				id?: { '@index': string };
				coreid?: { '@index': string };
				field: Array<{ '@index': string; '@term': string }>;
			},
			raw: Uint8Array,
			/** Terms to keep (values), and how to name them (keys) */
			columns: Record<C, string>
		) =>
			Buffer.from(raw)
				.toString('utf8')
				.split(meta['@linesTerminatedBy'])
				.slice(Number.parseInt(meta['@ignoreHeaderLines']))
				.map((line) =>
					Object.fromEntries(
						line
							.split(meta['@fieldsTerminatedBy'])
							.map((cell, i) => {
								const field = meta.field.find((f) => f['@index'] === i.toString());
								const isID = (meta.id ?? meta.coreid)!['@index'] === i.toString();

								if (!isID && !field) return;
								const term = field?.['@term'].split('/').at(-1) ?? 'id';

								const column = Object.entries(columns).find(([, t]) => t === term);
								if (!column) return;

								const [key] = column;

								return [key, removeOnBothEnds(cell, meta['@fieldsEnclosedBy'])];
							})
							.filter((value) => value !== undefined)
					)
				) as Record<C, string>[];

		this.dataset = {
			names: process(metafile.archive.core, data.name, {
				name: 'scientificName',
				id: 'id',
			}),
			statuses: process(
				metafile.archive.extension.find((ext) => ext.files.location === filenames.status)!,
				data.status,
				{
					status: 'threatStatus',
					id: 'id',
				}
			),
		};
	}

	async enrich(option: Option) {
		if (!this.dataset) await this.downloadDataset();

		const byname = this.dataset!.names.find((o) => o.name === option.name);
		if (!byname) return EMPTY_EXTRA;

		const byid = this.dataset!.statuses.find((o) => o.id === byname.id);
		if (!byid) return EMPTY_EXTRA;

		return {
			priority: 2,
			extra: {
				cascade: {
					conservation_status: this.statuses[byid.status as keyof typeof this.statuses],
				},
			},
		};
	}
}

async function unzip(data: Uint8Array, ...names: string[]) {
	return new Promise<Unzipped>((res, rej) =>
		_unzip(
			data,
			{
				filter: (file) => (names.length > 0 ? names.includes(file.name) : true),
			},
			(err, data) => (err ? rej(err) : res(data))
		)
	);
}

function removeOnBothEnds(subject: string, chars: string) {
	if (!chars) return subject;
	if (subject.startsWith(chars)) subject = subject.slice(chars.length);
	if (subject.endsWith(chars)) subject = subject.slice(0, -chars.length);
	return subject;
}

type DarwinCoreMetafile = {
	archive: {
		'@xmlns': string;
		'@metadata': string;
		core: {
			'@encoding': 'utf-8';
			'@fieldsTerminatedBy': string;
			'@linesTerminatedBy': string;
			'@fieldsEnclosedBy': string;
			'@ignoreHeaderLines': `${number}`;
			'@rowType': string;
			files: {
				location: string;
			};
			id: {
				'@index': `${number}`;
			};
			field: Array<{
				'@index': `${number}`;
				'@term': string;
			}>;
		};
		extension: Array<{
			'@encoding': string;
			'@fieldsTerminatedBy': string;
			'@linesTerminatedBy': string;
			'@fieldsEnclosedBy': string;
			'@ignoreHeaderLines': string;
			'@rowType': string;
			files: {
				location: string;
			};
			coreid: {
				'@index': `${number}`;
			};
			field: Array<{
				'@index': `${number}`;
				'@term': string;
			}>;
		}>;
	};
};

import { unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { nanoid } from 'nanoid';

import { ResultsPaths } from '../filepaths.js';

export class TempFilesFixture {
	private files: Array<{ filename: string; content: string; cleanup: () => void }> = [];
	private directory: string = ResultsPaths.root;

	constructor() {
		this.files = [];
	}

	/**
	 * Set directory where the temporary files will be created. Initially, this is set to {@link ResultsPaths.root}
	 * @param directory
	 */
	at(directory: string) {
		this.directory = directory;
	}

	/**
	 *
	 * @param name name template for the file. the string "XXXX" will be replaced with a random ID
	 * @param content
	 */
	new(name: `${string}XXXX${string}`, content: string) {
		const inside = this.directory; // capture current value, useful esp. for the cleanup function
		const filename = name.replace('XXXX', nanoid());
		writeFileSync(path.join(inside, filename), content);

		const file = {
			filename,
			content,
			toString() {
				return filename;
			},
			cleanup() {
				unlinkSync(path.join(inside, filename));
			}
		};
		this.files.push(file);
		return file;
	}

	cleanup() {
		for (const file of this.files) {
			file.cleanup();
		}

		this.files = [];
	}
}

export async function tempfiles({}, use: (fixture: TempFilesFixture) => Promise<void>) {
	const fixture = new TempFilesFixture();
	await use(fixture);
	fixture.cleanup();
}

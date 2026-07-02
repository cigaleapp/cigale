import type { FixturePaths } from '$e2e/filepaths.js';

import * as fflate from 'fflate';

import { mapValues } from './utils.js';

export type ZipEntry = {
	/** ArrayBuffer content is assumed to be a Uint8Array */
	content: string | Uint8Array | ArrayBuffer;
	mtime?: undefined | Date;
	compression?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
};

/**
 *
 * @param files maps filepaths inside the archive to their contents
 */
export async function createZipArchive(
	files: Record<string, ZipEntry['content'] | ZipEntry>,
	options: { comment?: string } = {}
): Promise<ArrayBuffer> {
	const entries = mapValues(files, (file): fflate.AsyncZippableFile => {
		const content =
			typeof file === 'string' || file instanceof Uint8Array || file instanceof ArrayBuffer
				? file
				: file.content;

		const bytes =
			typeof content === 'string'
				? fflate.strToU8(content)
				: content instanceof ArrayBuffer
					? new Uint8Array(content)
					: content;

		const opts: fflate.AsyncZipOptions = {};
		if (typeof file !== 'string') {
			if ('compression' in file) opts.level = file.compression;
			if ('mtime' in file) opts.mtime = file.mtime;
		}

		return [bytes, opts];
	});

	return new Promise((resolve, reject) => {
		fflate.zip(entries, options, (error, data) => {
			if (error) reject(error);
			else resolve(data.buffer);
		});
	});
}

if (import.meta.vitest) {
	const { readFileSync } = await import('node:fs');

	const { describe, beforeEach, afterEach, test: _test, expect, vi } = import.meta.vitest;

	beforeEach(() => {
		vi.useFakeTimers({ now: new Date(2026, 7, 2) });
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	const test = _test.extend('testWith', async ({ annotate }) => {
		return async (...args: Parameters<typeof createZipArchive>) => {
			const zip = await createZipArchive(...args);

			annotate('created zip file', {
				contentType: 'application/zip',
				body: new Uint8Array(zip),
			});

			expect(zip).toMatchSnapshot();
		};
	});

	describe('createZipArchive', () => {
		test('empty zip', async ({ testWith }) => {
			await testWith({});
		});

		test('one text file', async ({ testWith }) => {
			await testWith({
				'test.txt': 'Hello there :)',
			});
		});

		test('a JPEG file (level set to 0)', async ({ testWith }) => {
			await testWith({
				'test.png': {
					content: readFileSync(
						'tests/fixtures/cyan.jpeg' satisfies FixturePaths.Absolute
					),
					compression: 0,
				},
			});
		});

		test('nested directories', async ({ testWith }) => {
			await testWith({
				'test.txt': 'hello!!',
				'photos/one.png': {
					content: readFileSync(
						'tests/fixtures/debugsquare.png' satisfies FixturePaths.Absolute
					),
					compression: 0,
				},
				'photos/two.jpeg': {
					content: readFileSync(
						'tests/fixtures/cyan.jpeg' satisfies FixturePaths.Absolute
					),
					compression: 0,
				},
				'photos/README': 'Héllo !! Do accents work?',
			});
		});
	});
}

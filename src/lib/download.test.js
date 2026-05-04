import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Helper to reset module registry between tests
const reset = () => vi.resetModules();

describe('download module', () => {
	it('stringifyWithToplevelOrdering', async () => {
		// import without mocking
		const { stringifyWithToplevelOrdering } = await import('./download.js');
		expect(
			stringifyWithToplevelOrdering(
				'json',
				'http://example.com/schema.json',
				{ a: 1, b: 2, c: 3 },
				['a', 'c', 'a', 'b']
			)
		).toMatchInlineSnapshot(`
"{\n  \"$schema\": \"http://example.com/schema.json\",\n  \"a\": 1,\n  \"c\": 3,\n  \"b\": 2\n}"
`);

		expect(
			stringifyWithToplevelOrdering(
				'yaml',
				'http://example.com/schema.json',
				{ a: 1, b: 2, c: 3 },
				['a', 'c', 'a', 'b']
			)
		).toMatchInlineSnapshot(`
			"# yaml-language-server: $schema=http://example.com/schema.json

			a: 1
			c: 3
			b: 2
			"
		`);
	});

	it('downloadAsFile - web (DOM flow)', async () => {
		reset();
		// mock Capacitor to report web
		vi.doMock('@capacitor/core', () => ({
			Capacitor: { isNativePlatform: () => false },
		}));

		const { downloadAsFile } = await import('./download.js');

		// Mock URL.createObjectURL and URL.revokeObjectURL (jsdom doesn't implement these)
		const origCreateObjectURL = URL.createObjectURL;
		const origRevokeObjectURL = URL.revokeObjectURL;
		const mockBlobUrl = 'blob:mock-url';

		URL.createObjectURL = vi.fn(() => mockBlobUrl);
		URL.revokeObjectURL = vi.fn();

		// Spy on click to verify it's called, use real DOM
		const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click');

		await downloadAsFile('hello', 'file.txt', 'text/plain');

		// Verify the anchor element's properties and click
		expect(clickSpy).toHaveBeenCalled();
		expect(URL.createObjectURL).toHaveBeenCalled();
		expect(URL.revokeObjectURL).toHaveBeenCalledWith(mockBlobUrl);

		// restore
		clickSpy.mockRestore();
		URL.createObjectURL = origCreateObjectURL;
		URL.revokeObjectURL = origRevokeObjectURL;
	});

	it('downloadAsFile - native (Capacitor) mocked', async () => {
		reset();

		// Mock Capacitor and native plugins before importing the module
		vi.doMock('@capacitor/core', () => ({
			Capacitor: { isNativePlatform: () => true },
		}));

		vi.doMock('@capacitor/filesystem', () => {
			const Filesystem = {
				checkPermissions: vi.fn().mockResolvedValue({ publicStorage: 'granted' }),
				requestPermissions: vi.fn().mockResolvedValue({}),
				writeFile: vi
					.fn()
					.mockResolvedValue({
						uri: 'content://primary:Documents/cigale%20exports/file.txt',
					}),
			};
			return {
				Directory: { ExternalStorage: 'ExternalStorage' },
				Encoding: { UTF8: 'utf8' },
				Filesystem,
			};
		});

		vi.doMock('@capawesome/capacitor-file-picker', () => ({
			FilePicker: {
				pickDirectory: vi.fn().mockResolvedValue({
					path: 'content://com.android.externalstorage.documents/tree/primary%3ADocuments%2Fcigale%20exports',
				}),
			},
		}));

		const { downloadAsFile } = await import('./download.js');
		const { Filesystem } = await import('@capacitor/filesystem');

		const result = await downloadAsFile('hello', 'file.txt', 'text/plain');
		expect(String(result)).toBe('content://primary:Documents/cigale%20exports/file.txt');
		expect(Filesystem.writeFile).toHaveBeenCalled();
		const calledWith = Filesystem.writeFile.mock.calls[0][0];
		expect(calledWith.path.endsWith('/file.txt')).toBe(true);
	});
});

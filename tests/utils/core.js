import { expect } from '@playwright/test';

/**
 * @import { Page, Locator } from '@playwright/test'
 */

/**
 *
 * @param {Page} page
 * @param {string|RegExp|null} message null to not filter on the message
 * @param {object} options
 * @param {undefined | import('$lib/toasts.svelte').Toast<null>['type']} [options.type]
 */
export function toast(page, message, { type = undefined } = {}) {
	let loc = page.getByTestId('toasts-area');

	if (type) {
		loc = loc.locator(`[data-type=${type}]`);
	}

	if (message) {
		loc = loc.filter({
			hasText: message
		});
	}

	return loc;
}

export const browserConsole = {
	/**
	 * Log messages to the browser console
	 * @param {import('@playwright/test').Page} page
	 * @param {...any} args
	 */
	async log(page, ...args) {
		await page.evaluate(
			// oxlint-disable-next-line no-console
			(args) => console.log(...args),
			args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg))
		);
	}
};

/**
 * @param {Page} page
 * @param {import('@playwright/test').Locator} locator
 */
async function tooltipOf(page, locator) {
	await expect(locator).toHaveAttribute('aria-describedby', /tippy-\d+/, {
		timeout: 1_000
	});

	const tippyId = await locator.getAttribute('aria-describedby');
	return page.locator(`#${tippyId}`);
}

/**
 * Hovers the locator, then asserts that it has a tooltip with content matching `content`.
 * Falls back to the element's data-tooltip-content attribute if the tooltip is not found.
 * @param {Page} page
 * @param {import('@playwright/test').Locator} locator
 * @param {string|RegExp} content
 */
export async function expectTooltipContent(page, locator, content) {
	await locator.hover({
		force: true
	});

	try {
		const tooltip = await tooltipOf(page, locator);
		await expect(tooltip).toHaveText(content);
	} catch {
		await expect(locator).toHaveAttribute('data-tooltip-content', content);
	}
}

/**
 * @template Args
 * @template T
 * @typedef {T | ((args: Args) => T) | ((args: Args) => Promise<T>)} MaybeAsyncFunction
 */

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').BrowserContext} context
 * @param {string | RegExp | ((u: URL) => boolean)} url
 * @param {MaybeAsyncFunction<import('@playwright/test').Route, {json:object}|{body:string|Buffer}>} result
 */
export async function mockUrl(page, context, url, result) {
	await Promise.all(
		// Context: service workers. Page: regular fetch() requests (for browsers that don't support service worker instrumentation)
		[context, page].map(async (target) =>
			target.route(url, async (route) =>
				route.fulfill(typeof result === 'function' ? await result(route) : result)
			)
		)
	);
}

/**
 *
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').BrowserContext} context
 * @param {string} source
 * @param {{json: object} | {body: string | Buffer}} mockedResult
 */
export async function mockProtocolSourceURL(page, context, source, mockedResult) {
	await mockUrl(
		page,
		context,
		(u) => {
			u.searchParams.delete('v');
			return u.toString() === source;
		},
		mockedResult
	);
}

/**
 *
 * @param {Page} page
 * @param {string | {title: string} | {key: `modal_${string}`}} query providing a string is equivalent to providing {title: string}
 */
export function modal(page, query) {
	if (typeof query === 'string') {
		return modal(page, {
			title: query
		});
	}

	if ('key' in query) {
		return page.locator(`dialog[data-key='${query.key}']`);
	}

	return page.getByRole('dialog').filter({
		visible: true,

		has: page.getByRole('banner').getByRole('heading', {
			name: query.title,
			exact: true
		})
	});
}

/**
 * Expects an open deletion confirmation modal, and confirms deletion
 * @param {Page} page
 * @param {object} [opts]
 * @param {string} [opts.type] text to type before hitting confirm button
 * @param {string} [opts.title='Êtes-vous sûr·e?'] title of the modal
 * @param {`modal_${string}`} [opts.modalKey] data-key of the modal to target
 */
export async function confirmDeletionModal(
	page,
	{ type, title = 'Êtes-vous sûr·e?', modalKey } = {}
) {
	const deletionModal = modal(
		page,
		modalKey
			? {
					key: modalKey
				}
			: {
					title
				}
	);

	await expect(deletionModal).toBeVisible();

	if (type) {
		const textbox = deletionModal.getByRole('textbox');
		await textbox.fill(type);
	}

	await deletionModal
		.getByRole('button', {
			name: 'Oui, supprimer'
		})
		.click();
}

/**
 * @param {...string} parts
 */
export function makeRegexpUnion(...parts) {
	return new RegExp(
		parts
			.filter((t) => {
				if (!/^[\p{Letter} …]+$/u.test(t)) {
					throw new Error(
						`The loading text "${t}" contains special characters and cannot be used in a RegExp`
					);
				}

				return true;
			})
			.join('|')
	);
}

/**
 * ⚠️ **Needs a navigation before taking effect**
 * @param {Page} page
 * @param {number} value
 */
export async function setHardwareConcurrency(page, value) {
	await page.addInitScript((value) => {
		const proto = Object.getPrototypeOf(navigator);

		Object.defineProperty(proto, 'hardwareConcurrency', {
			value,
			writable: false
		});
	}, value);
}

/**
 *
 * @param {import('node:stream').Readable} stream
 * @returns
 */
async function readStreamToBuffer(stream) {
	return Buffer.concat(await Array.fromAsync(stream));
}

/**
 * Only one of json, text or buffer should be provided.
 * @typedef {object} ZipFileEntryCheck
 * @property {(text: string) => void | Promise<void>} [text] function to call with the text content of the file
 * @property {(buffer: Buffer) => void | Promise<void>} [buffer] function to call with the buffer content of the file
 * @property {(json: any) => void | Promise<void>} [json] function to call with the parsed JSON content of the file
 * @property {(entry: import('yauzl-promise').Entry) => void | Promise<void>} [entry] function to call with the zip entry itself
 */

/**
 * @template {string} Files
 * Matches the files present in a zip file against an expected list of file names, without regard for order.
 * @param {import('yauzl-promise').ZipFile} zip
 * @param {Array<RegExp|Files>} expectedFiles
 * @param {Partial<Record<Files, ZipFileEntryCheck>>} [checks] additional checks to perform for specific files
 */
export async function expectZipFiles(zip, expectedFiles, checks = {}) {
	const zipFiles = [];

	for await (const file of zip) {
		zipFiles.push(file.filename);

		if (file.filename in checks) {
			// @ts-expect-error
			const { json, text, buffer, entry } = checks[file.filename];

			const buf = await file.openReadStream().then(readStreamToBuffer);

			if (buffer) {
				await buffer(buf);
			} else if (text) {
				await text(buf.toString('utf-8'));
			} else if (json) {
				await json(JSON.parse(buf.toString('utf-8')));
			}

			if (entry) {
				await entry(file);
			}
		}
	}

	expect(zipFiles).toHaveLength(expectedFiles.length);

	for (const expectedFile of expectedFiles) {
		expect(zipFiles).toContainEqual(
			expectedFile instanceof RegExp ? expect.stringMatching(expectedFile) : expectedFile
		);
	}
}

/**
 * @template {string} K
 * @template {any} V
 * @param {Record<K, V>} subject
 * @returns {Array<[K, V]>}
 */
export function entries(subject) {
	// @ts-expect-error
	return Object.entries(subject);
}

/**
 * @param {string} message
 * @returns {never}
 */
export function throwError(message) {
	throw new Error(message);
}

/**
 * Opens a dropdown and chooses an item by its name
 * @param {Page} page
 * @param {string} dropdownTestId
 * @param {[string | RegExp | ((options: Locator) => Locator)] | [string, string]} option can be a single argument, or two strings where the first one is the group (dropdown submenu's label) and the second one the option name
 */
export async function chooseInDropdown(page, dropdownTestId, ...option) {
	const trigger = page.getByTestId(`${dropdownTestId}-open`);
	const options = page.getByTestId(`${dropdownTestId}-options`);
	await trigger.click();
	const [locator, sublocator] = option;

	const item = sublocator
		? options
				.getByRole('group', {
					name: locator.toString()
				})
				.getByRole('menuitemcheckbox', {
					name: sublocator
				})
		: typeof locator === 'function'
			? locator(options)
			: options.getByRole('menuitemcheckbox', {
					name: locator
				});

	await item.click();
	await page.keyboard.press('Escape'); // Close the dropdown
}

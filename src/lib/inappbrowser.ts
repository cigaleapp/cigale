import type { OpenWebViewOptions } from '@capgo/inappbrowser';

import { InAppBrowser } from '@capgo/inappbrowser';

type OpenInAppBrowserOptions = {
	title?: string;
	onUrlChange?: (browser: InAppBrowserInstance, url: string) => Promise<void> | void;
};

/**
 * Attachment that gets the URL to open from the href attribute. Must be set on <a> elements.
 * Also uses the title attribute as the title for the in-app browser, unless explicitly specified.
 * Only on mobile native platforms, it opens a in-app browser instead of navigating. On other platforms, it does nothing.
 */
export function inAppBrowser(options?: OpenInAppBrowserOptions): Attachment {
	return (node: HTMLElement) => {
		if (!Capacitor.isNativePlatform()) {
			return;
		}

		if (!(node instanceof HTMLAnchorElement)) {
			throw new Error('inAppBrowser attachment can only be used on <a> elements');
		}

		node.onclick = (event) => {
			event.preventDefault();

			const url = node.href;
			void openInAppBrowser(url, {
				title: node.title,
				...options,
			}).catch((error) => {
				console.error('Failed to open in-app browser:', error);
			});
		};
	};
}

async function openInAppBrowser(url: string | URL, options?: OpenInAppBrowserOptions) {
	if (!Capacitor.isNativePlatform()) {
		throw new Error('In-app browser is only supported on native platforms');
	}

	const instance = new InAppBrowserInstance();

	await InAppBrowser.addListener('urlChangeEvent', async (event) => {
		if (event.id === instance.id) {
			instance.currentUrl = event.url;
			await options.onUrlChange?.(instance, event.url);
		}
	});

	await instance.open(url, { title: options?.title });
}

class InAppBrowserInstance {
	currentUrl: string | undefined;
	id: string | undefined;

	constructor() {
		this.currentUrl = undefined;
		this.id = undefined;
	}

	async open(url: string | URL, options?: Omit<OpenWebViewOptions, 'url'>) {
		try {
			const webview = await InAppBrowser.openWebView({
				url,
				...options,
			});

			this.id = webview.id;
			this.currentUrl = url;
		} catch (error) {
			console.error('Failed to open URL in in-app browser', error);
		}
	}

	async clearCookies() {
		try {
			await InAppBrowser.clearCookies({ url: this.currentUrl });
		} catch (error) {
			console.error('Failed to clear cookies for in-app browser', error);
		}
	}

	async close() {
		try {
			await InAppBrowser.close({ id: this.id });
		} catch (err) {
			console.error(
				'Failed to close in-app browser, it might have already been closed. Calling .hide',
				err
			);
			await InAppBrowser.hide({ url: this.currentUrl });
		}
	}

	async cookie(key: string) {
		const cookies = await InAppBrowser.getCookies({
			url: this.currentUrl,
			includeHttpOnly: true,
		});

		return cookies[key] ?? null;
	}
}

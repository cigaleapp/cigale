import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockAddListener = vi.fn();
const mockOpenWebView = vi.fn();
const mockClearCookies = vi.fn();
const mockClose = vi.fn();
const mockHide = vi.fn();
const mockGetCookies = vi.fn();
const mockIsNativePlatform = vi.fn();

vi.mock('@capgo/inappbrowser', () => ({
	InAppBrowser: {
		addListener: mockAddListener,
		openWebView: mockOpenWebView,
		clearCookies: mockClearCookies,
		close: mockClose,
		hide: mockHide,
		getCookies: mockGetCookies,
	},
}));

const importModule = async () => import('./inappbrowser.js');

describe('inAppBrowser', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
		vi.stubGlobal('Capacitor', {
			isNativePlatform: mockIsNativePlatform,
		});
		mockIsNativePlatform.mockReturnValue(false);
		mockAddListener.mockResolvedValue(undefined);
		mockOpenWebView.mockResolvedValue({ id: 'browser-1' });
		mockClearCookies.mockResolvedValue(undefined);
		mockClose.mockResolvedValue(undefined);
		mockHide.mockResolvedValue(undefined);
		mockGetCookies.mockResolvedValue({ token: 'cookie-value' });
	});

	it('does nothing on non-native platforms', async () => {
		mockIsNativePlatform.mockReturnValue(false);

		const { inAppBrowser } = await importModule();
		const attachment = inAppBrowser();
		const node = document.createElement('a');

		expect(() => attachment(node)).not.toThrow();
		expect(node.onclick).toBeNull();
		expect(mockAddListener).not.toHaveBeenCalled();
	});

	it('throws on non-anchor elements on native platforms', async () => {
		mockIsNativePlatform.mockReturnValue(true);

		const { inAppBrowser } = await importModule();
		const attachment = inAppBrowser();

		expect(() => attachment(document.createElement('div'))).toThrow(
			'inAppBrowser attachment can only be used on <a> elements'
		);
	});

	it('openInAppBrowser throws on non-native platforms', async () => {
		mockIsNativePlatform.mockReturnValue(false);

		const { openInAppBrowser } = await importModule();

		await expect(openInAppBrowser('https://example.com/article')).rejects.toThrow(
			'In-app browser is only supported on native platforms'
		);
	});

	it('openInAppBrowser opens the webview and forwards matching url changes', async () => {
		mockIsNativePlatform.mockReturnValue(true);

		let listener: ((event: { id?: string; url: string }) => Promise<void> | void) | undefined;
		mockAddListener.mockImplementation(async (_eventName, callback) => {
			listener = callback;
			return { remove: vi.fn() };
		});

		const { openInAppBrowser } = await importModule();
		const onUrlChange = vi.fn();

		await openInAppBrowser('https://example.com/article', {
			title: 'Custom title',
			onUrlChange,
		});

		expect(mockAddListener).toHaveBeenCalledWith('urlChangeEvent', expect.any(Function));
		expect(mockOpenWebView).toHaveBeenCalledWith({
			url: 'https://example.com/article',
			title: 'Custom title',
		});

		await listener?.({ id: 'browser-1', url: 'https://example.com/follow-up' });
		await Promise.resolve();

		expect(onUrlChange).toHaveBeenCalledWith(
			expect.objectContaining({ currentUrl: 'https://example.com/follow-up' }),
			'https://example.com/follow-up'
		);
	});

	it('instance methods are available through onUrlChange', async () => {
		mockIsNativePlatform.mockReturnValue(true);
		mockClose.mockRejectedValueOnce(new Error('already closed'));

		let listener: ((event: { id?: string; url: string }) => Promise<void> | void) | undefined;
		mockAddListener.mockImplementation(async (_eventName, callback) => {
			listener = callback;
			return { remove: vi.fn() };
		});

		type BrowserInstance = {
			currentUrl?: string;
			open: (url: string | URL, options?: { title?: string }) => Promise<void>;
			clearCookies: () => Promise<void>;
			close: () => Promise<void>;
			cookie: (key: string) => Promise<string | null>;
		};

		let browserInstance: BrowserInstance | undefined;
		const { openInAppBrowser } = await importModule();

		await openInAppBrowser('https://example.com/article', {
			onUrlChange(browser) {
				browserInstance = browser as BrowserInstance;
			},
		});

		await listener?.({ id: 'browser-1', url: 'https://example.com/follow-up' });
		await Promise.resolve();

		expect(browserInstance?.currentUrl).toBe('https://example.com/follow-up');

		await browserInstance?.open('https://example.com/next', { title: 'Next title' });
		expect(mockOpenWebView).toHaveBeenLastCalledWith({
			url: 'https://example.com/next',
			title: 'Next title',
		});
		expect(browserInstance?.currentUrl).toBe('https://example.com/next');

		await browserInstance?.clearCookies();
		expect(mockClearCookies).toHaveBeenCalledWith({ url: 'https://example.com/next' });

		expect(await browserInstance?.cookie('token')).toBe('cookie-value');
		expect(mockGetCookies).toHaveBeenCalledWith({
			url: 'https://example.com/next',
			includeHttpOnly: true,
		});

		await browserInstance?.close();
		expect(mockClose).toHaveBeenCalledWith({ id: 'browser-1' });
		expect(mockHide).toHaveBeenCalledWith({ url: 'https://example.com/next' });
	});

	it('opens the in-app browser when an anchor is clicked', async () => {
		mockIsNativePlatform.mockReturnValue(true);

		mockAddListener.mockImplementation(async (_eventName, _callback) => {
			return { remove: vi.fn() };
		});

		const { inAppBrowser } = await importModule();
		const attachment = inAppBrowser({
			title: 'Custom title',
		});
		const anchor = document.createElement('a');
		anchor.href = 'https://example.com/article';
		anchor.title = 'Link title';

		attachment(anchor);
		expect(typeof anchor.onclick).toBe('function');

		anchor.onclick?.(new MouseEvent('click', { bubbles: true, cancelable: true }));
		await Promise.resolve();

		expect(mockAddListener).toHaveBeenCalledWith('urlChangeEvent', expect.any(Function));
		expect(mockOpenWebView).toHaveBeenCalledWith({
			url: 'https://example.com/article',
			title: 'Custom title',
		});
	});

	it('does not react to url changes from another browser instance', async () => {
		mockIsNativePlatform.mockReturnValue(true);

		let listener: ((event: { id?: string; url: string }) => Promise<void> | void) | undefined;
		mockAddListener.mockImplementation(async (_eventName, callback) => {
			listener = callback;
			return { remove: vi.fn() };
		});

		const { inAppBrowser } = await importModule();
		const onUrlChange = vi.fn();
		const attachment = inAppBrowser({ onUrlChange });
		const anchor = document.createElement('a');
		anchor.href = 'https://example.com/article';

		attachment(anchor);
		anchor.onclick?.(new MouseEvent('click', { bubbles: true, cancelable: true }));
		await Promise.resolve();

		await listener?.({ id: 'other-browser', url: 'https://example.com/ignored' });
		await Promise.resolve();

		expect(onUrlChange).not.toHaveBeenCalled();
	});
});

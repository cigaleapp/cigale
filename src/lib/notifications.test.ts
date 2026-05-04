// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockRequestPermissions = vi.fn();
const mockRegisterActionTypes = vi.fn();
const mockAddListener = vi.fn();
const mockSchedule = vi.fn();
const mockCheckPermissions = vi.fn();
const mockGetSettings = vi.fn();
const mockToastError = vi.fn();
const mockToastInfo = vi.fn();
const mockNotificationRequestPermission = vi.fn();
const mockIsNativePlatform = vi.fn();
let notificationMock: ReturnType<typeof createNotificationMock>;

const createNotificationMock = () => {
	const NotificationMock = vi.fn(function (
		this: unknown,
		title: string,
		options?: NotificationOptions
	) {
		return { title, options };
	}) as unknown as typeof Notification;

	NotificationMock.permission = 'default';
	NotificationMock.requestPermission = mockNotificationRequestPermission;
	return NotificationMock;
};

vi.mock('@capacitor/core', () => ({
	Capacitor: {
		isNativePlatform: mockIsNativePlatform,
	},
}));

vi.mock('@capacitor/local-notifications', () => ({
	LocalNotifications: {
		requestPermissions: mockRequestPermissions,
		registerActionTypes: mockRegisterActionTypes,
		addListener: mockAddListener,
		schedule: mockSchedule,
		checkPermissions: mockCheckPermissions,
	},
}));

vi.mock('./settings.svelte.js', () => ({
	getSettings: mockGetSettings,
}));

vi.mock('./toasts.svelte.js', () => ({
	toasts: {
		error: mockToastError,
		info: mockToastInfo,
	},
}));

const importModule = async () => import('./notifications.js');

describe('notifications', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
		mockIsNativePlatform.mockReturnValue(false);
		notificationMock = createNotificationMock();
		vi.stubGlobal('Notification', notificationMock);
		mockRequestPermissions.mockResolvedValue({ display: 'granted' });
		mockRegisterActionTypes.mockResolvedValue(undefined);
		mockAddListener.mockResolvedValue({ remove: vi.fn() });
		mockSchedule.mockResolvedValue(undefined);
		mockCheckPermissions.mockResolvedValue({ display: 'granted' });
		mockGetSettings.mockReturnValue({ notifications: true });
	});

	it('asks for native notification permission and reports denials', async () => {
		mockIsNativePlatform.mockReturnValue(true);
		mockRequestPermissions.mockResolvedValueOnce({ display: 'denied' });

		const { askForNotificationPermission } = await importModule();

		await askForNotificationPermission();

		expect(mockRequestPermissions).toHaveBeenCalledTimes(1);
		expect(mockToastError).toHaveBeenCalledWith('Vous avez refusé les notifications.');
	});

	it('reports native permission request failures without throwing', async () => {
		mockIsNativePlatform.mockReturnValue(true);
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		mockRequestPermissions.mockRejectedValueOnce(new Error('dismissed'));

		const { askForNotificationPermission } = await importModule();

		await expect(askForNotificationPermission()).resolves.toBeUndefined();
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			'Local notification permission request failed',
			expect.any(Error)
		);
		consoleErrorSpy.mockRestore();
	});

	it('asks for browser notification permission when available', async () => {
		const notificationMock = createNotificationMock();
		notificationMock.permission = 'default';
		vi.stubGlobal('Notification', notificationMock);

		const { askForNotificationPermission } = await importModule();

		await askForNotificationPermission();

		expect(mockNotificationRequestPermission).toHaveBeenCalledTimes(1);
		expect(mockToastError).not.toHaveBeenCalled();
	});

	it('reports unsupported browser notifications', async () => {
		Reflect.deleteProperty(window, 'Notification');

		const { askForNotificationPermission } = await importModule();

		await askForNotificationPermission();

		expect(mockToastError).toHaveBeenCalledWith(
			'Votre navigateur ne supporte pas les notifications système.'
		);
	});

	it('sends native notifications and registers action callbacks', async () => {
		mockIsNativePlatform.mockReturnValue(true);
		let listener:
			| ((event: {
					notification?: { actionTypeId?: string };
					actionId: string;
			  }) => Promise<void> | void)
			| undefined;
		mockAddListener.mockImplementation(async (_eventName, callback) => {
			listener = callback;
			return { remove: vi.fn() };
		});
		const actionCallback = vi.fn().mockResolvedValue(undefined);

		const { sendNotification } = await importModule();

		await sendNotification('Export terminé', {
			body: 'Done',
			actionsTypeId: 'export-actions',
			actions: [{ id: 'open', title: 'Ouvrir', callback: actionCallback }],
		});

		expect(mockRegisterActionTypes).toHaveBeenCalledWith({
			types: [
				{
					id: 'export-actions',
					actions: [{ id: 'open', title: 'Ouvrir' }],
				},
			],
		});
		expect(mockSchedule).toHaveBeenCalledWith(
			expect.objectContaining({
				notifications: [
					expect.objectContaining({
						title: 'Export terminé',
						body: 'Done',
						actionTypeId: 'export-actions',
					}),
				],
			})
		);

		await listener?.({
			notification: { actionTypeId: 'export-actions' },
			actionId: 'open',
		});

		expect(actionCallback).toHaveBeenCalledTimes(1);
	});

	it('sends browser notifications when enabled', async () => {
		mockIsNativePlatform.mockReturnValue(false);
		notificationMock.permission = 'granted';
		vi.stubGlobal('Notification', notificationMock);
		mockGetSettings.mockReturnValue({ notifications: true });

		const { sendNotification } = await importModule();

		await sendNotification('Hello', { body: 'World' });

		expect(mockNotificationRequestPermission).not.toHaveBeenCalled();
		expect(notificationMock).toHaveBeenCalledWith('Hello', { body: 'World' });
	});

	it('does not send browser notifications when disabled', async () => {
		mockIsNativePlatform.mockReturnValue(false);
		notificationMock.permission = 'granted';
		vi.stubGlobal('Notification', notificationMock);
		mockGetSettings.mockReturnValue({ notifications: false });

		const { sendNotification } = await importModule();

		await sendNotification('Hello', { body: 'World' });

		expect(notificationMock).not.toHaveBeenCalled();
	});

	it('reports missing browser notification support on send', async () => {
		mockIsNativePlatform.mockReturnValue(false);
		Reflect.deleteProperty(window, 'Notification');

		const { sendNotification } = await importModule();

		await sendNotification('Hello', { body: 'World' });

		expect(mockToastError).toHaveBeenCalledWith(
			'Votre navigateur ne supporte pas les notifications système.'
		);
	});

	it('reports native schedule failures', async () => {
		mockIsNativePlatform.mockReturnValue(true);
		mockSchedule.mockRejectedValueOnce(new Error('boom'));
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		const { sendNotification } = await importModule();

		await sendNotification('Hello', { body: 'World' });

		expect(consoleErrorSpy).toHaveBeenCalledWith(
			'Failed to send local notification',
			expect.any(Error)
		);
		expect(mockToastError).toHaveBeenCalledWith(
			"Impossible d'envoyer la notification système."
		);
		consoleErrorSpy.mockRestore();
	});

	it('checks notification enablement on native and browser platforms', async () => {
		mockIsNativePlatform.mockReturnValue(true);
		mockCheckPermissions.mockResolvedValueOnce({ display: 'granted' });

		const { hasNotificationsEnabled } = await importModule();

		await expect(hasNotificationsEnabled(true)).resolves.toBe(true);
		await expect(hasNotificationsEnabled(false)).resolves.toBe(false);

		mockIsNativePlatform.mockReturnValue(false);
		notificationMock.permission = 'granted';
		vi.stubGlobal('Notification', notificationMock);
		await expect(hasNotificationsEnabled(true)).resolves.toBe(true);
		notificationMock.permission = 'denied';
		await expect(hasNotificationsEnabled(true)).resolves.toBe(false);
	});
});

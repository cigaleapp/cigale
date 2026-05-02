import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

import { getSettings } from './settings.svelte';
import { toasts } from './toasts.svelte';

/**
 * Ask the user for permission to send system notifications
 */
export async function askForNotificationPermission() {
	if (Capacitor.isNativePlatform()) {
		try {
			const status = await LocalNotifications.requestPermissions();
			if (status.display !== 'granted') {
				toasts.error('Vous avez refusé les notifications.');
			}
		} catch (e) {
			console.error('Local notification permission request failed', e);
			// Ignore - user probably dismissed the permission prompt
		}
		return;
	}

	if (!('Notification' in window)) {
		toasts.error('Votre navigateur ne supporte pas les notifications système.');
		return;
	}

	if (Notification.permission === 'default') {
		try {
			await Notification.requestPermission();
		} catch (e) {
			console.error('Notification permission request failed', e);
			// Ignore - user probably dismissed the permission prompt
		}
	} else if (Notification.permission === 'denied') {
		toasts.error(
			'Vous avez refusé les notifications système. Veuillez changer cela dans les paramètres de votre navigateur.'
		);
	}
}

/**
 * Send a system notification if permission was granted
 * @param {string} title
 * @param {NotificationOptions} options
 * @returns
 */
export async function sendNotification(title, options) {
	if (Capacitor.isNativePlatform()) {
		try {
			await LocalNotifications.schedule({
				notifications: [
					{
						title,
						body: options.body ?? '',
						id: Date.now(),
						smallIcon: 'ic_notification',
					},
				],
			});
		} catch (e) {
			console.error('Failed to send local notification', e);
			toasts.error("Impossible d'envoyer la notification système.");
		}
		return;
	}

	if (!('Notification' in window)) {
		toasts.error('Votre navigateur ne supporte pas les notifications système.');
		return;
	}

	const enabled = await hasNotificationsEnabled();

	if (!enabled) return;
	new Notification(title, options);
}

export async function hasNotificationsEnabled() {
	if (Capacitor.isNativePlatform()) {
		return (
			(await LocalNotifications.checkPermissions()) === 'granted' &&
			getSettings().notifications
		);
	}

	if (!('Notification' in window)) return false;
	return Notification.permission === 'granted' && getSettings().notifications;
}

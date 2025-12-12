import { getSettings } from './settings.svelte';
import { toasts } from './toasts.svelte';

/**
 * Ask the user for permission to send system notifications
 */
export async function askForNotificationPermission() {
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
	if (!hasNotificationsEnabled()) return;
	new Notification(title, options);
}

export function hasNotificationsEnabled() {
	return Notification.permission === 'granted' && getSettings().notifications;
}

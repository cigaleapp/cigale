import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { millisecondsToSeconds } from 'date-fns';

import { getSettings } from '$lib/settings.svelte.js';
import { toasts } from '$lib/toasts.svelte.js';

/**
 * Maps actionTypeId to action id to action details (title and callback)
 */
let _notificationActions: Record<
	string,
	Record<string, { title: string; callback: () => Promise<void> }>
> = {};

let _notificationActionsListenerStarted = false;

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
 */
export async function sendNotification(
	title: string,
	{
		actionsTypeId = title,
		actions = [],
		awayOnly = false,
		...options
	}: NotificationOptions & {
		/** Defaults to the title */
		actionsTypeId?: string;
		/** Only supported on native platforms */
		actions?: Array<{ id: string; callback: () => Promise<void>; title: string }>;
		/**
		 * Only send notification if user is not looking at the app
		 * On web platforms, this means {@link Document.hidden} is true
		 */
		awayOnly?: boolean;
	} = {}
) {
	if (awayOnly && !document.hidden) return;

	if (Capacitor.isNativePlatform()) {
		try {
			if (actions.length > 0) {
				for (const { id, ...action } of actions) {
					_notificationActions[actionsTypeId] ??= {};
					_notificationActions[actionsTypeId][id] = action;
				}

				await LocalNotifications.registerActionTypes({
					types: Object.entries(_notificationActions).map(([id, actions]) => ({
						id,
						actions: Object.entries(actions).map(([id, { title }]) => ({ id, title })),
					})),
				});

				if (!_notificationActionsListenerStarted) {
					await LocalNotifications.addListener(
						'localNotificationActionPerformed',
						async (event) => {
							if (!event.notification?.actionTypeId) {
								console.error(
									'Received notification action without actionTypeId, doing nothing',
									event
								);
								return;
							}

							const action =
								_notificationActions[event.notification.actionTypeId]?.[
									event.actionId
								];
							if (!action) {
								console.error(
									`Received notification action with unregistered id ${event.actionId}, doing nothing`,
									{ event, _notificationActions }
								);
								return;
							}

							try {
								await action.callback();
							} catch (e) {
								console.error(
									`Error while executing callback for notification action ${event.actionId}`,
									e
								);
							}

							return {
								async remove() {
									_notificationActionsListenerStarted = false;
									console.info('Local notification actions listener was removed');
								},
							};
						}
					);

					_notificationActionsListenerStarted = true;
					console.info('Started local notification actions listener');
				}
			}

			await LocalNotifications.schedule({
				notifications: [
					{
						title,
						body: options.body ?? '',
						// Needs to be a Java (signed, 32-bit) Int, so max. 2^(32-1)
						id: millisecondsToSeconds(Date.now()),
						// TODO: put an actual icon here
						smallIcon: 'ic_notification',
						actionTypeId: actionsTypeId,
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

	const enabled = await hasNotificationsEnabled(getSettings().notifications);

	if (!enabled) return;
	new Notification(title, options);
}

export async function hasNotificationsEnabled(isSettingOn: boolean | null) {
	if (Capacitor.isNativePlatform()) {
		return isSettingOn && (await LocalNotifications.checkPermissions()).display === 'granted';
	}

	if (!('Notification' in window)) return false;
	return isSettingOn && Notification.permission === 'granted';
}

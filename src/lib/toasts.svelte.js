import { minutesToMilliseconds } from 'date-fns';
import { nanoid } from 'nanoid';

/**
 * @template T
 * @typedef {T | Promise<T>} MaybePromise<T>
 */

/**
 * @template T
 * @typedef {Object} Toast
 * @property {Date} addedAt
 * @property {string} id
 * @property {string} message
 * @property {'info' | 'success' | 'error' | 'warning' | 'debug'} type
 * @property {Object} labels
 * @property {string} [labels.action]
 * @property {string} [labels.close]
 * @property {Object} callbacks
 * @property {(toast: Toast<T>) => MaybePromise<void>} [callbacks.action]
 * @property {(toast: Toast<T>) => MaybePromise<void>} [callbacks.closed]
 * @property {boolean} [showLifetime]
 * @property {number} [lifetime]
 * @property {?T} data
 */

export const MAX_TOASTS_COUNT = 3;

export const TOAST_LIFETIME_MS = 3000;

/**
 * @template T
 * @typedef {Object} ToastOptions
 * @property {T} [data]
 * @property {Toast<T>['labels']} [labels]
 * @property {boolean} [showLifetime]
 * @property {number | 'inferred'} [lifetime]
 * @property {Toast<T>['callbacks']['action']} [action]
 * @property {Toast<T>['callbacks']['closed']} [closed]
 */

export class Toasts {
	/** @type {Toast<any>[]} */
	items = $state([]);

	/**
	 * Adds a toast notification.
	 * @template T
	 * @param {Toast<T>['type']} type
	 * @param {string} message
	 * @param {ToastOptions<T>} [options]
	 * @returns {string | undefined}
	 */
	add(type, message, options) {
		if (!message) return;
		const { labels, data, closed, action, lifetime = 'inferred', ...rest } = options ?? {};
		const callbacks = { closed, action };
		if (Object.values(callbacks).some(Boolean) && !data)
			throw new Error("You must provide data if you're using callbacks");

		const id = nanoid();
		const wordsCount = message.split(' ').length + message.split(' ').length;

		const newToast = {
			addedAt: new Date(),
			id,
			message,
			type,
			labels: labels ?? {},
			// @ts-ignore
			callbacks,
			data: data ?? null,
			lifetime: lifetime === 'inferred' ? 3000 + minutesToMilliseconds(wordsCount / 300) : lifetime,
			...rest
		};

		setTimeout(() => {
			this.remove(id);
		}, newToast.lifetime);

		this.items = [...this.items.slice(0, MAX_TOASTS_COUNT - 1), newToast];
		return id;
	}

	/**
	 * Displays a warning toast.
	 * @template T
	 * @param {string} message
	 * @param {ToastOptions<T>} [options]
	 * @returns {string | undefined}
	 */
	warn(message, options) {
		return this.add('warning', message, options);
	}

	/**
	 * Displays an error toast.
	 * @template T
	 * @param {string} message
	 * @param {ToastOptions<T>} [options]
	 * @returns {string | undefined}
	 */
	error(message, options) {
		return this.add('error', message, {
			...options,
			lifetime: options?.lifetime ?? 'inferred'
		});
	}

	/**
	 * Removes a toast by ID.
	 * @param {string} id
	 * @returns {Promise<void>}
	 */
	async remove(id) {
		const toast = this.items.find((t) => t.id === id);
		if (!toast) return;
		if (toast.callbacks?.closed) await toast.callbacks.closed(toast);
		this.items = this.items.filter((t) => t.id !== id);
	}
}

export const toasts = new Toasts();

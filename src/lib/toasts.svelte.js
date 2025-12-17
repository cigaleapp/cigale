import { minutesToMilliseconds } from 'date-fns';
import { nanoid } from 'nanoid';

import { entries, mapValues } from './utils.js';

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
 * @property {URL | ((toast: Toast<T>) => MaybePromise<void>)} [callbacks.action]
 * @property {(toast: Toast<T>) => MaybePromise<void>} [callbacks.closed]
 * @property {boolean} [showLifetime]
 * @property {number} [lifetime]
 * @property {number|NodeJS.Timeout} [timeoutHandle]
 * @property {?T} data
 */

/**
 * @typedef {object} ToastPool
 * @property {Toast<any>[]} items
 * @property {number} capacity maximum number of toasts to show in this pool
 * @property {number} lifetime default lifetime for toasts in this pool (in ms).
 */

const TOAST_POOLS = /** @type {const} @satisfies {Record<string, Omit<ToastPool, 'items'>>} */ ({
	default: {
		lifetime: 3_000,
		capacity: 3
	},
	exporter: {
		lifetime: Infinity,
		capacity: Infinity
	},
	protocolcreator: {
		lifetime: Infinity,
		capacity: Infinity
	}
});

/**
 * @typedef {keyof typeof TOAST_POOLS} ToastPoolNames
 */

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

/**
 * @template {string} PoolNames
 * @template {{[Name in PoolNames]: ToastPool}} Pools
 */
class Toasts {
	/** @type {Pools} */
	// @ts-expect-error
	pools = $state();

	/** @type {keyof Pools & string} */
	// @ts-expect-error
	currentPoolName = $state();

	/**
	 *
	 * @param { {[Key in PoolNames]: Omit<Pools[Key], 'items'> } } poolsConfig
	 * @param {NoInfer<PoolNames>} initialPool
	 */
	constructor(poolsConfig, initialPool) {
		this.currentPoolName = initialPool;
		// @ts-expect-error
		this.pools = mapValues(poolsConfig, (pool) => ({ items: [], ...pool }));
	}

	get pool() {
		return this.pools[this.currentPoolName];
	}

	/**
	 * Sets the current toast pool. Freezes toasts of the previously active pool, and unfreezes toasts of the newly active pool.
	 * @param {PoolNames} name
	 */
	setCurrentPool(name) {
		this.#ensurePoolName(name);
		this.freeze(this.currentPoolName);
		this.currentPoolName = name;
		this.unfreeze(this.currentPoolName);
	}

	/**
	 * Return the toasts of the given pool, or of the current pool if none is specified.
	 * @param {undefined | (keyof Pools & string)} pool
	 */
	items(pool = undefined) {
		if (pool) this.#ensurePoolName(pool);
		return this.pools[pool ?? this.currentPoolName].items;
	}

	/**
	 *
	 * @param {keyof Pools & string} name
	 */
	#ensurePoolName(name) {
		if (!this.pools[name]) throw new Error(`Toast pool ${name} does not exist`);
	}

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

		/** @type {Toast<typeof data>} */
		const newToast = {
			addedAt: new Date(),
			id,
			message: message.replaceAll('\n', '; '),
			type,
			labels: labels ?? {},
			// @ts-ignore
			callbacks,
			data: data ?? null,
			lifetime: lifetime === 'inferred' ? this.#inferLifetime(message) : lifetime,
			...rest
		};

		if (Number.isFinite(newToast.lifetime)) {
			this.#armTimeout(newToast);
		}

		this.pools[this.currentPoolName].items = [
			...this.items().slice(0, this.pool.capacity - 1),
			newToast
		];
		return id;
	}

	/**
	 *
	 * Shows a toast with an "Undo" button. If the user clicks, calls `undo()`, otherwise calls `commit()` after the toast disappears.
	 * Default lifetime is 4x longer than with toast.add().
	 * @template T
	 * @param {Toast<T>['type']} type
	 * @param {string} message
	 * @param {ToastOptions<T> & { undo: () => void | Promise<void>, commit: () => void | Promise<void> }} options
	 */
	withUndo(type, message, { undo, commit, ...options }) {
		if (!message) return;

		const toasts = this;

		return this.add(type, message, {
			lifetime: 4 * this.#inferLifetime(message),
			data: [],
			...options,
			closed: commit,
			action: (t) => {
				undo();
				toasts.remove(t.id, toasts.currentPoolName, { silent: true });
			},
			labels: {
				action: 'Annuler'
			}
		});
	}

	/**
	 * Displays an info toast.
	 * @template T
	 * @param {string} message
	 * @param {ToastOptions<T>} [options]
	 * @returns {string | undefined}
	 */
	info(message, options) {
		return this.add('info', message, options);
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
	 * @param {any} message
	 * @param {ToastOptions<T>} [options]
	 * @returns {string | undefined}
	 */
	error(message, options) {
		return this.add('error', message?.toString() ?? 'Erreur inattendue', {
			...options,
			lifetime: options?.lifetime ?? 'inferred'
		});
	}

	/**
	 * Displays a success toast.
	 * @template T
	 * @param {string} message
	 * @param {ToastOptions<T>} [options]
	 * @returns {string | undefined}
	 */
	success(message, options) {
		return this.add('success', message, options);
	}

	/**
	 * Removes a toast by ID.
	 * @param {string} id
	 * @param {keyof Pools} [pool] only search in this pool, defaults to all pools
	 * @param {object} [options]
	 * @param {boolean} [options.silent] if true, do not call the `closed` callback
	 * @returns {Promise<void>}
	 */
	async remove(id, pool, { silent = false } = {}) {
		for (const [poolName, { items }] of entries(this.pools)) {
			if (pool && pool !== poolName) continue;

			const toast = items.find((t) => t.id === id);
			if (!toast) return;
			if (!silent) await toast.callbacks.closed?.(toast);

			this.pools[poolName].items = this.items(poolName).filter((t) => t.id !== id);
		}
	}

	/**
	 * @param {keyof Pools & string} pool
	 */
	async clear(pool = this.currentPoolName) {
		const items = this.items(pool);
		await Promise.all(
			items.map((t) => (t.callbacks?.closed ? t.callbacks.closed(t) : Promise.resolve()))
		);
		this.pools[pool].items = [];
	}

	/**
	 * Freeze timeouts for all toasts of pool
	 * @param {keyof Pools & string} pool
	 */
	freeze(pool = this.currentPoolName) {
		for (const toast of this.items(pool).filter((t) => t.timeoutHandle)) {
			clearTimeout(toast.timeoutHandle);
		}
	}

	/**
	 * Restores timeouts for all toasts of pool
	 * @param {keyof Pools & string} pool
	 */
	unfreeze(pool = this.currentPoolName) {
		for (const toast of this.items(pool).filter((t) => t.timeoutHandle)) {
			this.#armTimeout(toast);
		}
	}

	/**
	 *
	 * @param {Toast<any>} toast
	 */
	#armTimeout(toast) {
		toast.timeoutHandle = setTimeout(() => {
			this.remove(toast.id);
		}, toast.lifetime);
	}

	/**
	 * @param {string} message
	 */
	#inferLifetime(message) {
		const wordsCount = message.split(' ').length + message.split(' ').length;
		return this.pool.lifetime + minutesToMilliseconds(wordsCount / 300);
	}
}

export const toasts = new Toasts(TOAST_POOLS, 'default');

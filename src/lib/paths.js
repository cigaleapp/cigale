import * as navigation from '$app/navigation';
import { resolve as _resolve } from '$app/paths';

/**
 * @import { RouteId, Pathname, RouteParams } from '$app/types';
 */

/**
 * @template {RouteId | Pathname} T
 * @typedef { T extends RouteId ? RouteParams<T> extends Record<string, never> ? [route: T] : [route: T, params: RouteParams<T>] : [route: T] } ResolveArgs
 */

/**
 * @template {RouteId | Pathname} T
 * @param {ResolveArgs<T>} args
 */
export function resolve(...args) {
	const [_, hash] = _resolve(...args).split('#', 2);
	return '#' + hash;
}

/**
 * @template {RouteId | Pathname} T
 * @param {ResolveArgs<T>} args
 */
export async function goto(...args) {
	await navigation.goto(resolve(...args));
}

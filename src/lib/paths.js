import * as navigation from '$app/navigation';
import { resolve } from '$app/paths';

/**
 * @import { RouteId, Pathname, RouteParams, ResolvedPathname } from '$app/types';
 */

/**
 * @template {RouteId | Pathname} T
 * @typedef { T extends RouteId ? RouteParams<T> extends Record<string, never> ? [route: T] : [route: T, params: RouteParams<T>] : [route: T] } ResolveArgs
 */

/**
 * @template {RouteId | Pathname} T
 * @param {ResolveArgs<T>} args
 */
export async function goto(...args) {
	await navigation.goto(resolve(...args));
}

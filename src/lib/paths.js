import * as navigation from '$app/navigation';
import { resolve } from '$app/paths';

/**
 * @import { RouteId, Pathname, RouteParams, ResolvedPathname } from '$app/types';
 */

/**
 * @template {RouteId | Pathname} T
 * @typedef { T extends RouteId ? RouteParams<T> extends Record<string, never> ? undefined :   RouteParams<T> : undefined } ParamsArg
 */

/**
 * @template {RouteId | Pathname} T
 * @param {T} path
 * @param {ParamsArg<T>} [params]
 * @param {Parameters<typeof import('$app/navigation').goto>[1]} [options]
 */
export async function goto(path, params, options) {
	// eslint-disable-next-line svelte/no-navigation-without-resolve
	await navigation.goto(href(...[path, params]), options);
}

/**
 * @template {RouteId | Pathname} T
 * @param {T} path
 * @param {ParamsArg<T>} [params]
 * @returns {ResolvedPathname}
 */
export function href(path, params) {
	// @ts-expect-error
	return resolve(...(params ? [path, params] : [path]));
}

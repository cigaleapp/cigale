import type { Pathname, RouteId, RouteParams } from '$app/types';

import * as navigation from '$app/navigation';
import { resolve } from '$app/paths';
import { page } from '$app/state';

type ResolveArgs<T extends RouteId | Pathname> = T extends RouteId
	? RouteParams<T> extends Record<string, never>
		? [route: T]
		: [route: T, params: RouteParams<T>]
	: [route: T];

export async function goto(args: Pathname): Promise<void>
export async function goto<T extends RouteId | Pathname>(...args: ResolveArgs<T>) {
	await navigation.goto(resolve(...args));
}

// TODO: remove at some point
export { resolve };

/**
 * Checks if the given (or current) route is within the specified route (so a prefix check)
 * @param baseRouteId prefix to check for
 * @param routeId route id to check, defaults to the current route
 */
export function routeIsIn(baseRouteId: RouteId, routeId: RouteId | null = page.route.id) {
	if (!routeId) return false;
	return routeId.startsWith(baseRouteId);
}

export function switchRouteId<Cases extends Partial<Record<RouteId, unknown>> & { else: unknown }>(
	cases: Cases
): Cases[keyof Cases] {
	if (!page.route.id) return cases.else;
	return cases[page.route.id] ?? cases.else;
}

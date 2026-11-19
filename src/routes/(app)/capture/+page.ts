import type { ShootingPhase } from './device.svelte.js';

import { redirect } from '@sveltejs/kit';

import { resolve } from '$app/paths';
import { tables } from '$lib/idb.svelte.js';
import { getCurrentSessionId } from '$lib/sessions.js';

export async function load({ parent }) {
	await parent();

	const sessionId = getCurrentSessionId();
	if (!sessionId) redirect(307, resolve('/sessions/'));

	const session = await tables.Session.get(sessionId);
	if (!session) redirect(307, resolve('/sessions/'));

	return {
		deviceInit: {
			sessionId,
			startingShootingPhase: session.captureModeShootingPhase as ShootingPhase,
			startingTimers: session.captureModeSelectedTimer,
		},
	};
}

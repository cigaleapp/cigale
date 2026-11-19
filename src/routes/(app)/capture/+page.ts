import type { ShootingPhase } from './device.svelte.js';

import { redirect } from '@sveltejs/kit';

import { resolve } from '$app/paths';
import { tables } from '$lib/idb.svelte.js';
import { getCurrentSessionId } from '$lib/sessions.js';
import { switchValue } from '$lib/utils.js';

export async function load({ parent }) {
	await parent();

	const sessionId = getCurrentSessionId();
	if (!sessionId) redirect(307, resolve('/sessions/'));

	const session = await tables.Session.get(sessionId);
	if (!session) redirect(307, resolve('/sessions/'));

	const protocol = await tables.Protocol.get(session.protocol);
	if (!protocol) {
		console.error(`session ${sessionId} has invalid protocol ${session.protocol}`);
		redirect(307, resolve('/sessions/'));
	}

	return {
		deviceInit: {
			sessionId,
			startingShootingPhase: session.captureModeShootingPhase as ShootingPhase,
			startingTimers: session.captureModeSelectedTimer,
			startingType:
				session.captureModeSelectedDeviceType ??
				switchValue(protocol.media.types.at(0) ?? 'image', {
					image: 'photo',
					audio: 'sound',
				}),
		},
	};
}

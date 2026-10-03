import type { SendableCorrection } from '@cigale/beamup';

import { http } from 'msw';

class MockState {
	constructor() {}

	corrections: SendableCorrection[] = [];
}

export const state = new MockState();

export const ORIGIN = 'https://beamup.example.com';

const u = <P extends `/${string}`>(path: P) => `${ORIGIN}${path}` as const;

export const handlers = [
	http.post(u('/corrections'), async ({ request }) => {
		const body = (await request.clone().json()) as SendableCorrection[];
		for (const correction of body) {
			state.corrections.push(correction);
		}
	}),
];

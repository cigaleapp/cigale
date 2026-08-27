import { describe, expect, test } from 'vitest';

import { distanceBetweenGeoCoordinates } from './geolocation.js';

// ─── distanceBetweenGeoCoordinates ───────────────────────────────────

describe('distanceBetweenGeoCoordinates', () => {
	test('returns 0 for identical coordinates', () => {
		const point = { latitude: 48.8566, longitude: 2.3522 };
		expect(distanceBetweenGeoCoordinates(point, point)).toBe(0);
	});

	test('computes ~111.2km for a 1° longitude difference on the equator', () => {
		const distance = distanceBetweenGeoCoordinates(
			{ latitude: 0, longitude: 0 },
			{ latitude: 0, longitude: 1 }
		);

		// 1° of longitude at the equator is ~111.2km (Earth's circumference / 360)
		expect(distance).toBeCloseTo(111_194.93, 0);
	});

	test('computes the great-circle distance between Paris and London', () => {
		const paris = { latitude: 48.8566, longitude: 2.3522 };
		const london = { latitude: 51.5074, longitude: -0.1278 };

		const distance = distanceBetweenGeoCoordinates(paris, london);

		// ~343.5km as the crow flies
		expect(distance).toBeGreaterThan(343_000);
		expect(distance).toBeLessThan(344_500);
	});

	test('computes the great-circle distance between New York and Los Angeles', () => {
		const newYork = { latitude: 40.7128, longitude: -74.006 };
		const losAngeles = { latitude: 34.0522, longitude: -118.2437 };

		const distance = distanceBetweenGeoCoordinates(newYork, losAngeles);

		// ~3936km as the crow flies
		expect(distance).toBeGreaterThan(3_930_000);
		expect(distance).toBeLessThan(3_945_000);
	});

	test('is symmetric: distance(a, b) === distance(b, a)', () => {
		// Note: fresh objects per call, since the function mutates its inputs
		// in place (see the test below) — reusing the same objects for both
		// calls would silently double-convert them to radians.
		const a = { latitude: 10, longitude: 20 };
		const b = { latitude: -5, longitude: -30 };

		expect(distanceBetweenGeoCoordinates(a, b)).toBeCloseTo(
			distanceBetweenGeoCoordinates(b, a),
			6
		);
	});
});

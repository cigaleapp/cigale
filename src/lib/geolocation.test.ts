import { describe, expect, test } from 'vitest';

import {
	areaBetweenGeoCoordinates,
	distanceBetweenGeoCoordinates,
	middleOfGeoCoordinates,
} from './geolocation.js';

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

const p = (longitude: number, latitude: number) => ({ longitude, latitude });

describe('middleOfGeoCoordinates', () => {
	test('2 points', () => {
		expect(middleOfGeoCoordinates(p(0, 1), p(1, 0))).toStrictEqual(p(0.5, 0.5));
		expect(middleOfGeoCoordinates(p(0, 1), p(0, 2))).toStrictEqual(p(0, 1.5));
	});

	test('3 points', () => {
		expect(middleOfGeoCoordinates(p(0, 1), p(1, 0), p(2, 2))).toStrictEqual(p(1, 1));
		expect(middleOfGeoCoordinates(p(0, 1), p(0, 2))).toStrictEqual(p(0, 1.5));
	});
});

describe('areaBetweenGeoCoordinates', () => {
	test('less than 3 points', () => {
		expect(areaBetweenGeoCoordinates([])).toBe(0);
		expect(areaBetweenGeoCoordinates([p(0, 0)])).toBe(0);
		expect(areaBetweenGeoCoordinates([p(0, 0), p(0, 0)])).toBe(0);
	});

	test('triangle', () => {
		expect(areaBetweenGeoCoordinates([p(0, 0), p(0, 1), p(1, 1)])).toBeCloseTo(
			6_181_528_030.949073
		);
	});

	test('n-gon', () => {
		expect(
			areaBetweenGeoCoordinates([
				p(1.4448383066965675, 43.60217100864341),
				p(1.4476261190043829, 43.601703139765846),
				p(1.4514607729122702, 43.603276174129206),
				p(1.4469470703627678, 43.60456310440037),
				p(1.4445, 43.6039),
			])
		).toBeCloseTo(108_093.768);
	});
});

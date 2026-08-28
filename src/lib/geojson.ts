// @wc-ignore-file

import { type } from 'arktype';

type Point = { longitude: number; latitude: number };

export const GeoJSONFeatureCollection = type('<Feature>', {
	type: "'FeatureCollection'",
	features: ['Feature', '[]'],
});

const GeoJSONPointFeature = type('<Props>', {
	geometry: {
		type: "'Point'",
		coordinates: ['number', 'number'],
	},
	properties: 'Props',
});

export const GeocodeJSONProperties = type({
	geocoding: {
		name: 'string = ""',
		label: 'string = ""',
		city: 'string = ""',
		postcode: 'string = ""',
		housenumber: 'string = ""',
		street: 'string = ""',
		country: 'string = ""',
	},
});

export const GeocodeJSONPointFeature = GeoJSONPointFeature(GeocodeJSONProperties);

export function geojsonPolygonFeature<T extends Record<string, unknown>>(
	coordinates: Point[][],
	properties?: T
) {
	return {
		type: 'Feature',
		properties: properties ?? {},
		geometry: {
			type: 'Polygon',
			coordinates: coordinates.map((cs) =>
				cs.map(({ longitude, latitude }) => [longitude, latitude])
			),
		},
	} as const;
}

export function geojsonLineStringFeature<T extends Record<string, unknown>>(
	coordinates: Point[],
	properties?: T
) {
	return {
		type: 'Feature',
		properties: properties ?? {},
		geometry: {
			type: 'LineString',
			coordinates: coordinates.map(({ longitude, latitude }) => [longitude, latitude]),
		},
	} as const;
}

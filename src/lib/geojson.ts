

// @wc-ignore-file

import { Type, type } from 'arktype';

type Point = { longitude: number; latitude: number };

export const GeoJSONFeatureCollection = type('<Feature>', {
	type: "'FeatureCollection'",
	features: ['Feature', '[]'],
});

const GeoJSONPointFeature = type('<Props>', {
	type: '"Feature"',
	properties: 'Props',
	geometry: {
		type: "'Point'",
		coordinates: ['number', 'number'],
	},
});

const GeoJSONLineStringFeature = type('<Props>', {
	type: '"Feature"',
	properties: 'Props',
	geometry: {
		type: '"LineString"',
		coordinates: type(['number', 'number']).array(),
	},
});

const GeoJSONPolygonFeature = type('<Props>', {
	type: '"Feature"',
	properties: 'Props',
	geometry: {
		type: '"Polygon"',
		coordinates: type(['number', 'number']).array().array(),
	},
});

export const GeoJSONFeature = (Props: Type) =>
	type.or(
		GeoJSONPointFeature(Props),
		GeoJSONLineStringFeature(Props),
		GeoJSONPolygonFeature(Props)
	);

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

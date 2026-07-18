import { type } from 'arktype';

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

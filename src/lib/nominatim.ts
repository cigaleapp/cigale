import { ArkErrors } from 'arktype';

import {
	GeocodeJSONPointFeature,
	GeocodeJSONProperties,
	GeoJSONFeatureCollection,
} from '$lib/geojson.js';

const NominatimResponseSchemas = {
	Reverse: GeoJSONFeatureCollection(GeocodeJSONPointFeature),
	Forward: GeoJSONFeatureCollection(GeocodeJSONPointFeature),
};

function formatAddress({
	housenumber,
	street,
	city,
	country,
	postcode,
	name,
}: (typeof GeocodeJSONProperties)['infer']['geocoding']) {
	return [[name], [housenumber, street], [postcode, city], [country]]
		.map((fragment) => fragment.join(' ').trim())
		.filter((fragment) => Boolean(fragment))
		.join(', ');
}

/**
 * @see https://nominatim.org/release-docs/develop/api/Reverse/
 * @param param0 coordinates
 */
export async function coordinatesToAddress({
	latitude,
	longitude,
}: {
	latitude: number;
	longitude: number;
}): Promise<string | null> {
	const response = await fetch(
		`https://nominatim.openstreetmap.org/reverse?${new URLSearchParams({
			format: 'geocodejson',
			lon: longitude.toString(),
			lat: latitude.toString(),
			addressdetails: '1',
		})}`
	);

	const data = NominatimResponseSchemas.Reverse(await response.json());
	if (data instanceof ArkErrors) {
		console.warn(
			`Failed to reverse-geocode lon=${longitude}, lat=${latitude} with Nominatim:`,
			response,
			data
		);
		return null;
	}

	const [result] = data.features;

	return formatAddress(result.properties.geocoding);
}

let coordinatesSuggestionAbortController = new AbortController();

/**
 *
 * @see https://nominatim.org/release-docs/develop/api/Search/
 * @yields { label: name of the place, to display, longitude, latitude }
 */
export async function* suggestCoordinates(query: string): AsyncIterable<{
	label: string;
	longitude: number;
	latitude: number;
}> {
	coordinatesSuggestionAbortController.abort('new search started');
	coordinatesSuggestionAbortController = new AbortController();

	const response = await fetch(
		`https://nominatim.openstreetmap.org/search?${new URLSearchParams({
			format: 'geocodejson',
			addressdetails: '1',
			q: query,
			limit: '5',
		})}`,
		{
			signal: coordinatesSuggestionAbortController.signal,
		}
	);

	const data = NominatimResponseSchemas.Forward(await response.json());
	if (data instanceof ArkErrors) {
		console.warn(`Failed to geocoe "${query}" with Nominatim:`, response, data);
		return;
	}

	for (const { geometry, properties } of data.features) {
		const [lon, lat] = geometry.coordinates;

		yield {
			label: formatAddress(properties.geocoding),
			longitude: lon,
			latitude: lat,
		};
	}
}

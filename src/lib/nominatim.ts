import { ArkErrors, type } from 'arktype';

const NominatimResponseSchemas = {
	Reverse: type({
		name: 'string',
		display_name: 'string'
	}),
	Forward: type({
		name: 'string',
		display_name: 'string',
		lat: 'string.numeric.parse',
		lon: 'string.numeric.parse'
	}).array()
};

/**
 * @see https://nominatim.org/release-docs/develop/api/Reverse/
 * @param param0 coordinates
 */
export async function coordinatesToAddress({
	latitude,
	longitude
}: {
	latitude: number;
	longitude: number;
}): Promise<string | null> {
	const response = await fetch(
		`https://nominatim.openstreetmap.org/reverse?${new URLSearchParams({
			format: 'jsonv2',
			lat: latitude.toString(),
			lon: longitude.toString(),
			addressdetails: '0'
		})}`
	);

	const data = NominatimResponseSchemas.Reverse(await response.json());
	if (data instanceof ArkErrors) {
		console.warn(
			`Failed to reverse-geocode lon=${longitude}, lat=${latitude} with Nominatim:`,
			response
		);
		return null;
	}

	return data.display_name;
}

let coordinatesSuggestionAbortController = new AbortController();

/**
 *
 * @see https://nominatim.org/release-docs/develop/api/Search/
 */
export async function suggestCoordinates(query: string): Promise<
	Array<{
		latitude: number;
		longitude: number;
		label: string;
		key: string;
	}>
> {
	coordinatesSuggestionAbortController.abort();
	coordinatesSuggestionAbortController = new AbortController();

	const response = await fetch(
		`https://nominatim.openstreetmap.org/search?${new URLSearchParams({
			format: 'jsonv2',
			q: query,
			limit: '5'
		})}`,
		{
			signal: coordinatesSuggestionAbortController.signal
		}
	);

	const data = NominatimResponseSchemas.Forward(await response.json());
	if (data instanceof ArkErrors) {
		console.warn(`Failed to geocoe "${query}" with Nominatim:`, response);
		return [];
	}

	return data.map(({ display_name, lat, lon }) => ({
		key: `${lon};${lat}`,
		label: display_name,
		latitude: lat,
		longitude: lon
	}));
}

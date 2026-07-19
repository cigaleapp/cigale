<script lang="ts">
	import type { RuntimeValue } from '$lib/schemas/metadata.js';

	import { ArkErrors, type } from 'arktype';
	import { SvelteMap } from 'svelte/reactivity';

	import { coordinatesToAddress, suggestCoordinates } from '$lib/nominatim.js';
	import { orEmpty2 } from '$lib/utils.js';

	import Combobox from './Combobox.svelte';
	import WorldMap from './WorldMap.svelte';

	interface Props {
		value: undefined | RuntimeValue<'location'>;
		// eslint-disable-next-line no-unused-vars
		onblur: (value: undefined | RuntimeValue<'location'>) => void;
	}

	const { value, onblur }: Props = $props();

	type CoordsKey = `${number};${number}`;

	// False positive on function overload signatures
	/* eslint-disable no-unused-vars */

	function coordsToKey(v: RuntimeValue<'location'>): CoordsKey;
	function coordsToKey(v: RuntimeValue<'location'> | undefined): CoordsKey | undefined;
	function coordsToKey(v: typeof value) {
		return v ? `${v.longitude};${v.latitude}` : undefined;
	}

	function keyToCoords(k: CoordsKey): RuntimeValue<'location'>;
	function keyToCoords(k: CoordsKey | undefined) {
		if (!k) return undefined;
		const [longitude, latitude] = k.split(';').map(Number);
		return { longitude, latitude };
	}

	/* eslint-enable no-unused-vars */

	const floatPattern = '(-?\\d+([.,]\\d+)?)' as const;
	const Coords = type(`/^${floatPattern}[,;]\\s*${floatPattern}$/`).pipe((literal) => {
		const [longitude, latitude] = literal.split(/[,;]/).map(Number.parseFloat);

		return { longitude, latitude };
	});

	let reverseGeocodings = new SvelteMap<CoordsKey, string>();
	$effect(() => {
		if (!value) return;
		if (reverseGeocodings.has(coordsToKey(value))) return;

		void coordinatesToAddress(value)
			.then((result) => {
				if (!result) return;
				reverseGeocodings.set(coordsToKey(value), result);
			})
			.catch((error) => {
				console.error('Failed to reverse geocode coordinates', value, error);
				reverseGeocodings.set(coordsToKey(value), 'Unknown');
			});
	});

	function loadItem(from: CoordsKey | { lng: number; lat: number } | RuntimeValue<'location'>) {
		if (typeof from === 'string') {
			const { latitude, longitude } = keyToCoords(from);
			return {
				key: from,
				label: reverseGeocodings.get(from) ?? `${longitude}, ${latitude}`,
			};
		}

		return loadItem(
			coordsToKey({
				longitude: 'longitude' in from ? from.longitude : from.lng,
				latitude: 'latitude' in from ? from.latitude : from.lat,
			})
		);
	}
</script>

<Combobox
	--combobox-option-image-size="3rem"
	--combobox-option-height="4rem"
	value={coordsToKey(value)}
	sorter={() => 0}
	onValueChange={async (val) => onblur(keyToCoords(val))}
	preloadedItems={orEmpty2(value, (coords) => loadItem(coords))}
	{loadItem}
	searcher={async function* search(query: string) {
		const coords = Coords(query);

		if (coords instanceof ArkErrors) {
			for await (const { label, ...coords } of suggestCoordinates(query)) {
				const key = coordsToKey(coords);
				reverseGeocodings.set(key, label);
				yield { label, key };
			}

			return;
		}

		yield loadItem(coords);
	}}
>
	{#snippet details({ label, key }, { select })}
		{const { latitude, longitude } = $derived(keyToCoords(key))}
		<div class="location-combobox-map">
			<WorldMap
				scrollToZoom
				zoom={10}
				markers={[
					{
						latitude,
						longitude,
						key,
						label,
						onMove({ lngLat: [lng, lat] }) {
							select(loadItem({ lng, lat }));
						},
					},
				]}
				onNewMarker={async ({ lngLat }) => {
					select(loadItem(lngLat));
				}}
			/>
		</div>
	{/snippet}
</Combobox>

<style>
	.location-combobox-map {
		height: 100%;
		border-radius: var(--corner-radius);
		overflow: hidden;
	}
</style>

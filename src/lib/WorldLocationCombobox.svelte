<script lang="ts">
	import { ArkErrors, type } from 'arktype';
	import { SvelteMap } from 'svelte/reactivity';

	import { coordinatesToAddress, suggestCoordinates } from '$lib/nominatim.js';

	import Combobox from './Combobox.svelte';
	import WorldMap from './WorldMap.svelte';

	type Point = { longitude: number; latitude: number };

	interface Props {
		points: Point[];
		// eslint-disable-next-line no-unused-vars
		onblur: (points: Point[]) => void;
		multiple?: boolean;
	}

	const { points, onblur, multiple = false }: Props = $props();

	type CoordsKey = `${number};${number}`;

	// False positive on function overload signatures
	/* eslint-disable no-unused-vars */

	function coordsToKey(v: Point): CoordsKey;
	function coordsToKey(v: Point | undefined): CoordsKey | undefined;
	function coordsToKey(v: Point) {
		return v ? `${v.longitude};${v.latitude}` : undefined;
	}

	function keyToCoords(k: CoordsKey): Point;
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
	async function geocode(value: Point) {
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
	}

	$effect(() => {
		for (const point of points) {
			void geocode(point);
		}
	});

	function loadItem(from: CoordsKey | Point | { lng: number; lat: number }) {
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

	function selected(p: { key: string }): boolean {
		return points.map(coordsToKey).includes(p.key);
	}
</script>

<Combobox
	--combobox-option-image-size="3rem"
	--combobox-option-height="4rem"
	value={coordsToKey(points[0])}
	values={points.map(coordsToKey)}
	sorter={(p) => points.map(coordsToKey).indexOf(p)}
	{multiple}
	onValueChange={async (_, vals) => onblur(vals.map(keyToCoords))}
	preloadedItems={points.map(loadItem)}
	loadItem={async (k) => loadItem(k)}
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
	{#snippet details(item, { select, deselect, allItems })}
		<div class="location-combobox-map">
			<WorldMap
				draw={allItems.every(selected) ? 'area' : 'nothing'}
				scrollToZoom
				markers={allItems.map(({ key, label }) => ({
					...keyToCoords(key),
					key,
					label,
					highlighted: allItems.length === 1 ? undefined : key === item.key,
					onDelete() {
						deselect(key);
					},
					onMove({ lngLat: [lng, lat] }) {
						deselect(key);
						select(loadItem({ lng, lat }));
					},
				}))}
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

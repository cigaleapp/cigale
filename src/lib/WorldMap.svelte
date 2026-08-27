<script lang="ts">
	import type { LngLatLike } from 'maplibre-gl';
	import type { ComponentProps } from 'svelte';
	import type { MarkerClickInfo } from 'svelte-maplibre';

	import { cartesianProduct } from 'es-toolkit';
	import {
		DefaultMarker,
		FillLayer,
		GeoJSON,
		LineLayer,
		MapEvents,
		MapLibre,
		Popup,
	} from 'svelte-maplibre';

	import { distanceBetweenGeoCoordinates } from '$lib/geolocation.js';
	import { avg, round } from '$lib/utils.js';
	import { getTheme } from '$routes/+layout.svelte';

	type MapClickEvent = Parameters<NonNullable<ComponentProps<typeof MapEvents>['onclick']>>[0];

	interface Props {
		scrollToZoom?: boolean;
		zoom?: number;
		// eslint-disable-next-line no-unused-vars
		onNewMarker?: (e: MapClickEvent) => void | Promise<void>;
		markers: Array<{
			key: string;
			latitude: number;
			longitude: number;
			label?: string;
			// eslint-disable-next-line no-unused-vars
			onMove?: (info: MarkerClickInfo) => void;
		}>;
	}

	const { markers, onNewMarker, scrollToZoom = false }: Props = $props();

	const latitudes = $derived(markers.map((m) => m.latitude));
	const longitudes = $derived(markers.map((m) => m.longitude));
	const center: LngLatLike = $derived([avg(longitudes, 0), avg(latitudes, 0)]);

	// Expression was determined experimentally
	// with an exponential regression and sampled values
	// Input a desired value in km for the map's scale
	// and get back a zoom level to use in MapLibre[zoom]
	function zoomLevelFromScale(km: number) {
		const a = 4049.319132;
		const b = -0.6850320277;

		return Math.log(km / a) / b;
	}

	const MAP_THEMES = { dark: 'dark-matter', light: 'positron' } as const;
	const theme = getTheme();
</script>

<div class="world-map">
	<MapLibre
		class="maplibre"
		style="https://basemaps.cartocdn.com/gl/{MAP_THEMES[theme.effective]}-gl-style/style.json"
		standardControls
		cooperativeGestures={!scrollToZoom}
		zoom={markers.length === 0
			? 0
			: zoomLevelFromScale(
					markers.length === 1
						? 0.1
						: Math.max(
								...cartesianProduct(markers, markers).map(
									([a, b]) => distanceBetweenGeoCoordinates(a, b) * 1e-3
								)
							) * 0.5
				)}
		{center}
	>
		{#each markers as marker (marker.key)}
			<DefaultMarker
				lngLat={[marker.longitude, marker.latitude]}
				draggable={Boolean(marker.onMove)}
				ondragend={(e) => marker.onMove?.(e)}
			>
				<Popup offset={[0, -10]}>{marker.label ?? ''}</Popup>
			</DefaultMarker>
		{/each}

		{#if onNewMarker}
			<MapEvents onclick={onNewMarker} />
		{/if}

		{#if markers.length >= 3}
			<GeoJSON
				data={{
					type: 'Feature',
					geometry: {
						type: 'Polygon',
						coordinates: [
							markers.map(({ latitude, longitude }) => [longitude, latitude]),
						],
					},
					properties: {},
				}}
			>
				<FillLayer
					paint={{
						'fill-color': '#ff000077',
					}}
				/>
			</GeoJSON>
		{:else if markers.length === 2}
			<GeoJSON
				data={{
					type: 'Feature',
					geometry: {
						type: 'LineString',
						coordinates: markers.map(({ latitude, longitude }) => [
							longitude,
							latitude,
						]),
					},
					properties: {},
				}}
			>
				{let showPopup = $state(false)}

				<LineLayer
					onmouseenter={() => {
						showPopup = true;
					}}
					onmouseleave={() => {
						showPopup = false;
					}}
					paint={{
						'line-width': 3,
						'line-color': '#ff0000',
					}}
				/>

				<Popup
					open={showPopup}
					lngLat={{
						lat: avg(markers.map((m) => m.latitude)),
						lng: avg(markers.map((m) => m.longitude)),
					}}
				>
					<span style:color="black">
						{const meters = round(distanceBetweenGeoCoordinates(...markers), 1)}
						{#if meters > 1e3}
							{round(meters * 1e-3, 2)} km
						{:else}
							{meters} m
						{/if}
					</span>
				</Popup>
			</GeoJSON>
		{/if}
	</MapLibre>
</div>

<style>
	.world-map,
	.world-map :global(.maplibre) {
		width: 100%;
		height: 100%;
	}
</style>

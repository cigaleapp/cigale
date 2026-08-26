<script lang="ts">
	import type { LngLatLike } from 'maplibre-gl';
	import type { ComponentProps } from 'svelte';
	import type { MarkerClickInfo } from 'svelte-maplibre';

	import {
		DefaultMarker,
		FillLayer,
		GeoJSON,
		LineLayer,
		MapEvents,
		MapLibre,
		Popup,
		SymbolLayer,
	} from 'svelte-maplibre';

	import { avg, round } from '$lib/utils.js';
	import { getTheme } from '$routes/+layout.svelte';

	import { distanceBetweenGeoCoordinates } from './geolocation';

	interface Props {
		scrollToZoom?: boolean;
		zoom?: number;
		markers: Array<{
			key: string;
			latitude: number;
			longitude: number;
			label?: string;
			// eslint-disable-next-line no-unused-vars
			onMove?: (info: MarkerClickInfo) => void;
		}>;
		// eslint-disable-next-line no-unused-vars
		onNewMarker?: ComponentProps<typeof MapEvents>['onclick'];
	}

	const { markers, onNewMarker, scrollToZoom = false, zoom = 15 }: Props = $props();

	const latitudes = $derived(markers.map((m) => m.latitude));
	const longitudes = $derived(markers.map((m) => m.longitude));
	const center: LngLatLike = $derived([avg(longitudes, 0), avg(latitudes, 0)]);

	const MAP_THEMES = { dark: 'dark-matter', light: 'positron' } as const;
	const theme = getTheme();
</script>

<div class="world-map">
	<MapLibre
		class="maplibre"
		style="https://basemaps.cartocdn.com/gl/{MAP_THEMES[theme.effective]}-gl-style/style.json"
		standardControls
		cooperativeGestures={!scrollToZoom}
		zoom={markers.length === 0 ? 0 : zoom}
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
				<LineLayer
					paint={{
						'line-width': 3,
						'line-color': '#ff0000',
					}}
				/>

				<Popup
					lngLat={{
						lat: avg(markers.map((m) => m.latitude)),
						lng: avg(markers.map((m) => m.longitude)),
					}}
					open
				>
					{round(distanceBetweenGeoCoordinates(...markers), 1)}m
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

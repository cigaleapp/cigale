<script lang="ts">
	import type { LngLatLike } from 'maplibre-gl';
	import type { ComponentProps } from 'svelte';
	import type { MarkerClickInfo } from 'svelte-maplibre';

	import convert from 'convert';
	import { cartesianProduct } from 'es-toolkit';
	import {
		FillLayer,
		GeoJSON,
		LineLayer,
		MapEvents,
		MapLibre,
		Marker,
		MarkerLayer,
		Popup,
	} from 'svelte-maplibre';

	import IconMapMarker from '~icons/ri/map-pin-2-fill';
	import { resolveColorVariable } from '$lib/css.js';
	import { geojsonLineStringFeature, geojsonPolygonFeature } from '$lib/geojson.js';
	import {
		areaBetweenGeoCoordinates,
		distanceBetweenGeoCoordinates,
		lnglat,
		middleOfGeoCoordinates,
	} from '$lib/geolocation.js';
	import { avg, range, round } from '$lib/utils.js';
	import { getTheme } from '$routes/+layout.svelte';

	type Point = { longitude: number; latitude: number };

	type MapClickEvent = Parameters<NonNullable<ComponentProps<typeof MapEvents>['onclick']>>[0];

	interface Props {
		scrollToZoom?: boolean;
		// eslint-disable-next-line no-unused-vars
		onNewMarker?: (e: MapClickEvent) => void | Promise<void>;
		/**
		 * When there are multiple points, what to draw between them:
		 * - nothing (default)
		 * - segments (connected lines, requires 2 points to show)
		 * - area (a polygon, requires 3 points to show)
		 */
		draw?: 'nothing' | 'segments' | 'area';
		markers: Array<{
			key: string;
			latitude: number;
			longitude: number;
			label?: string;
			highlighted?: boolean | undefined;
			// eslint-disable-next-line no-unused-vars
			onMove?: (info: MarkerClickInfo) => void;
			// eslint-disable-next-line no-unused-vars
			onDelete?: (info: MarkerClickInfo) => void;
		}>;
	}

	const { markers, onNewMarker, scrollToZoom = false, draw = 'nothing' }: Props = $props();

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

	function scaleFromZoomLevel(scale: number) {
		const a = 4049.319132;
		const b = -0.6850320277;

		return a * Math.exp(b * scale);
	}

	const zoom = $derived.by(() => {
		if (markers.length === 0) return 0;
		if (markers.length === 1) return zoomLevelFromScale(0.1);

		const longestSegment = Math.max(
			...cartesianProduct(markers, markers).map(
				([a, b]) => distanceBetweenGeoCoordinates(a, b) * 1e-3
			)
		);

		return zoomLevelFromScale(longestSegment / 2);
	});

	function distanceToClosestMarker(p: Point) {
		return Math.min(...markers.map((m) => distanceBetweenGeoCoordinates(m, p)));
	}

	const MAP_THEMES = { dark: 'dark-matter', light: 'positron' } as const;
	const theme = getTheme();

	const highlightedMarkers = $derived(markers.some((m) => m.highlighted !== undefined));

	const accentColor = $derived(resolveColorVariable(theme, '--fg-primary'));
	const accentColorTranslucent = $derived(accentColor + '55');
</script>

<div class="world-map">
	<MapLibre
		class="maplibre"
		style="https://basemaps.cartocdn.com/gl/{MAP_THEMES[theme.effective]}-gl-style/style.json"
		standardControls
		cooperativeGestures={!scrollToZoom}
		{zoom}
		{center}
	>
		{#each markers as marker (marker.key)}
			<Marker
				lngLat={[marker.longitude, marker.latitude]}
				draggable={Boolean(marker.onMove)}
				ondragend={(e) => marker.onMove?.(e)}
				onclick={(e) => marker.onDelete?.(e)}
			>
				<div
					class="map-marker"
					style:color={highlightedMarkers && !marker.highlighted
						? 'var(--gray)'
						: accentColor}
					style:font-size="1.25rem"
				>
					<IconMapMarker />
				</div>
				<Popup offset={[0, -10]}>{marker.label ?? ''}</Popup>
			</Marker>
		{/each}

		{#if onNewMarker}
			<MapEvents
				onclick={(e) => {
					const MARKER_HITBOX_RADIUS = 0.1; // relative to map scale

					const point = { longitude: e.lngLat.lng, latitude: e.lngLat.lat };
					const scale = scaleFromZoomLevel(zoom) * 1e3;

					// If click is too close to a marker, ignore it
					if (distanceToClosestMarker(point) < MARKER_HITBOX_RADIUS * scale) return;

					onNewMarker(e);
				}}
			/>
		{/if}

		{#if draw === 'area' && markers.length >= 3}
			<!-- Last marker is duplicated so that LineLayer outlines in a closed shape -->
			<GeoJSON data={geojsonPolygonFeature([[...markers, markers.at(0)]])}>
				<FillLayer
					paint={{
						'fill-color': accentColorTranslucent,
					}}
				/>

				<LineLayer
					paint={{
						'line-width': 2,
						'line-color': accentColor,
					}}
				/>

				<Marker
					lngLat={{
						lat: avg(markers.map((m) => m.latitude)),
						lng: avg(markers.map((m) => m.longitude)),
					}}
				>
					{const sqmeters = $derived(areaBetweenGeoCoordinates(markers))}
					{const hectares = $derived(convert(sqmeters, 'square meters').to('hectares'))}

					<span class="text-marker">
						{#if hectares >= 1}
							{round(hectares, 2)} ha
						{:else}
							{round(sqmeters, sqmeters > 1 ? 0 : 2)} m²
						{/if}
					</span>
				</Marker>
			</GeoJSON>
		{/if}

		{#if draw === 'segments' && markers.length >= 2}
			<GeoJSON data={geojsonLineStringFeature(markers)}>
				<LineLayer
					paint={{
						'line-width': 3,
						'line-color': accentColor,
					}}
				/>

				{#each range(1, markers.length) as i (i)}
					{const p1 = $derived(markers[i - 1])}
					{const p2 = $derived(markers[i])}

					<Marker lngLat={lnglat(middleOfGeoCoordinates(p1, p2))}>
						{const meters = round(distanceBetweenGeoCoordinates(p1, p2), 1)}

						<span class="text-marker">
							{#if meters > 1e3}
								{round(meters * 1e-3, 2)} km
							{:else}
								{meters} m
							{/if}</span
						>
					</Marker>
				{/each}
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

	.text-marker {
		background-color: var(--bg-neutral);
		color: var(--fg-neutral);
		padding: 2px;
	}
</style>

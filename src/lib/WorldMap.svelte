<script lang="ts">
	import type { LngLatLike, MapMouseEvent } from 'maplibre-gl';
	import {
		DefaultMarker,
		MapEvents,
		MapLibre,
		Popup,
		type MarkerClickInfo
	} from 'svelte-maplibre';

	import { getTheme } from '$routes/+layout.svelte';

	import { avg } from './utils.js';

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
		onNewMarker?: (info: MapMouseEvent) => void;
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
	</MapLibre>
</div>

<style>
	.world-map,
	.world-map :global(.maplibre) {
		width: 100%;
		height: 100%;
	}
</style>

<script lang="ts">
	import { ArkErrors, type } from 'arktype';
	import { SvelteMap } from 'svelte/reactivity';

	import Combobox from './Combobox.svelte';
	import { coordinatesToAddress, suggestCoordinates } from './nominatim.js';
	import type { RuntimeValue } from './schemas/metadata.js';
	import { orEmpty2 } from './utils.js';
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
		return v ? `${v.latitude};${v.longitude}` : undefined;
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

		void coordinatesToAddress(value)
			.then((result) => {
				if (!result) return;
				reverseGeocodings.set(coordsToKey(value), result);
			})
			.catch((error) => {
				console.error('Failed to reverse geocode coordinates', value, error);
			});
	});
</script>

<Combobox
	type="single"
	value={coordsToKey(value)}
	sorter={() => 0}
	searcher={(label) => label}
	onValueChange={(val) => onblur(keyToCoords(val))}
	suggestions={async (search) => {
		const coords = Coords(search);

		if (coords instanceof ArkErrors) {
			return suggestCoordinates(search);
		}

		return [
			{
				...coords,
				key: coordsToKey(coords),
				label: `Utiliser des coordonnées`
			}
		];
	}}
	items={orEmpty2(value, ({ latitude, longitude }) => {
		const key = coordsToKey({ latitude, longitude });

		return {
			key,
			latitude,
			longitude,
			label: reverseGeocodings.get(key) || `${latitude}, ${longitude}`
		};
	})}
>
	{#snippet listItem({ selected, label, latitude, longitude })}
		<div class="location-suggestion" class:selected>
			<div class="label">{label}</div>
			<div class="coords">{latitude}, {longitude}</div>
		</div>
	{/snippet}
	{#snippet highlight(o)}
		{o.label}
		<div class="location-combobox-map">
			<WorldMap zoom={10} markers={[o]} />
		</div>
	{/snippet}
</Combobox>

<style>
	.location-combobox-map {
		height: 15rem;
		border-radius: var(--corner-radius);
		overflow: hidden;
	}

	.location-suggestion .label {
		overflow-x: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.location-suggestion .coords {
		font-size: 0.8em;
		color: var(--gay);
		font-family: var(--font-mono);
	}
</style>

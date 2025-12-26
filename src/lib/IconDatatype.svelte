<script>
	import IconBoundingbox from '~icons/ri/artboard-2-line';
	import IconCube from '~icons/ri/box-3-line';
	import IconRaw from '~icons/ri/braces-fill';
	import IconDate from '~icons/ri/calendar-line';
	import IconBoolean from '~icons/ri/checkbox-line';
	import IconString from '~icons/ri/font-size';
	import IconLocation from '~icons/ri/map-pin-line';
	import IconEnum from '~icons/ri/menu-search-line';
	import IconInteger from '~icons/ri/number-1';
	import IconFloat from '~icons/ri/ruler-line';

	import { tooltip } from './tooltips.js';

	/**
	 * @type {{ type: import('$lib/database').MetadataType, tooltip?: boolean }}
	 */
	const { type: kind, tooltip: withTooltip = true } = $props();

	const IconComponent = $derived(
		{
			string: IconString,
			boolean: IconBoolean,
			location: IconLocation,
			date: IconDate,
			integer: IconInteger,
			float: IconFloat,
			enum: IconEnum,
			boundingbox: IconBoundingbox,
			raw: IconRaw
		}[kind] ?? IconCube
	);

	const descriptions = {
		string: 'Du texte',
		boolean: 'Vrai ou faux',
		location: 'Une localisation géographique',
		date: 'Une date',
		integer: 'Un nombre entier',
		float: 'Un nombre à virgule',
		enum: "Un choix parmi une liste d'options",
		boundingbox: "Une région d'image",
		raw: 'Données brutes'
	};
</script>

{#if withTooltip}
	<span use:tooltip={descriptions[kind]}>
		<IconComponent />
	</span>
{:else}
	<IconComponent />
{/if}

<script>
	import IconRaw from '~icons/ph/brackets-curly';
	import IconDate from '~icons/ph/calendar-blank';
	import IconBoolean from '~icons/ph/check-square';
	import IconBoundingbox from '~icons/ph/corners-out';
	import IconCube from '~icons/ph/cube';
	import IconEnum from '~icons/ph/list-magnifying-glass';
	import IconLocation from '~icons/ph/map-pin';
	import IconInteger from '~icons/ph/number-one';
	import IconFloat from '~icons/ph/ruler';
	import IconString from '~icons/ph/text-aa';
	import { tooltip } from './tooltips';

	/**
	 * @type {{ type: import('$lib/database').MetadataType }}
	 */
	const { type: kind } = $props();

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

<span use:tooltip={descriptions[kind]}>
	<IconComponent />
</span>

<script>
	import IconCube from '~icons/ph/cube';
	import { tooltip } from './tooltips';

	/**
	 * @type {{ type: import('$lib/database').MetadataType }}
	 */
	const { type: kind } = $props();

	const IconComponent = $derived(
		{
			string: import('~icons/ph/text-aa'),
			boolean: import('~icons/ph/check-square'),
			location: import('~icons/ph/map-pin'),
			date: import('~icons/ph/calendar-blank'),
			integer: import('~icons/ph/number-one'),
			float: import('~icons/ph/ruler'),
			enum: import('~icons/ph/list-magnifying-glass'),
			boundingbox: import('~icons/ph/corners-out'),
			raw: import('~icons/ph/brackets-curly')
		}[kind].then((c) => c.default)
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
	{#await IconComponent}
		<IconCube />
	{:then Icon}
		<Icon />
	{:catch _}
		<IconCube />
	{/await}
</span>

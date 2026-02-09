<script>
	import IconTag from '~icons/ri/price-tag-3-line';
	import IconTechnical from '~icons/ri/settings-line';
	import IconInferred from '~icons/ri/sparkling-line';
	import { tooltip } from '$lib/tooltips.js';

	/**
	 * @typedef {object} Props
	 * @property {Pick<import('$lib/database').Metadata,  'label' | 'infer'>} metadata
	 */

	/**
	 * @type {Props}
	 */
	const { metadata } = $props();
	const { label, infer } = $derived(metadata);
</script>

{#if !label}
	<span use:tooltip={'Métadonnée technique'} style:color="var(--fg-error)">
		<IconTechnical />
	</span>
{/if}
{#if infer && 'neural' in infer}
	<span use:tooltip={'Inférence par réseau neuronal'} style:color="var(--fg-primary)">
		<IconInferred />
	</span>
{:else if infer && ('exif' in infer || ('latitude' in infer && 'exif' in infer.latitude))}
	<span
		use:tooltip={'exif' in infer
			? `Inféré à partir du champ EXIF ${infer.exif}`
			: `Inféré à partir des coordonnées GPS EXIF (latitude: ${infer.latitude.exif}, longitude: ${infer.longitude.exif})`}
		style:color="var(--fg-primary)"
	>
		<IconTag />
	</span>
{/if}

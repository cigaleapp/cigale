<script>
	import { removeNamespaceFromMetadataId } from '$lib/schemas/metadata.js';
	import { tooltip } from '$lib/tooltips.js';
	import IconInferred from '~icons/ph/magic-wand';
	import IconTag from '~icons/ph/tag';
	import IconTechnical from '~icons/ph/wrench';

	/**
	 * @typedef {object} Props
	 * @property {Pick<import('$lib/database').Metadata, 'id' | 'label' | 'infer'>} metadata
	 * @property {Pick<import('$lib/database').Protocol, 'crop'>} protocol
	 */

	/**
	 * @type {Props}
	 */
	const { metadata, protocol } = $props();
	const { label, id, infer } = $derived(metadata);
</script>

{#if !label}
	<span use:tooltip={'Métadonnée technique'} style:color="var(--fg-error)">
		<IconTechnical />
	</span>
{/if}
{#if id === protocol.crop?.metadata || (infer && 'neural' in infer)}
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

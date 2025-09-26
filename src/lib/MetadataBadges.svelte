<script>
	import { m } from '$lib/paraglide/messages.js';
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
	<code>{removeNamespaceFromMetadataId(id)}</code>
	<span use:tooltip={m.technical_metadata_tooltip()} style:color="var(--fg-error)">
		<IconTechnical />
	</span>
{/if}
{#if id === protocol.crop?.metadata || (infer && 'neural' in infer)}
	<span use:tooltip={m.inferred_metadata_tooltip()} style:color="var(--fg-primary)">
		<IconInferred />
	</span>
{:else if infer && ('exif' in infer || ('latitude' in infer && 'exif' in infer.latitude))}
	<span
		use:tooltip={'exif' in infer
			? m.inferred_from_single_exif({ exif: infer.exif })
			: m.inferred_from_two_exif({
					latitude: infer.latitude.exif,
					longitude: infer.longitude.exif
				})}
		style:color="var(--fg-primary)"
	>
		<IconTag />
	</span>
{/if}

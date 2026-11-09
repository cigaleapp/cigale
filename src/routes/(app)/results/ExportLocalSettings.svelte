<script lang="ts">
	import { tick } from 'svelte';

	import IconCroppedOnly from '~icons/ri/crop-line';
	import IconMetadataOnly from '~icons/ri/list-view';
	import IconFullExport from '~icons/ri/multi-image-line';
	import EnumButtons from '$lib/EnumButtons.svelte';
	import Field from '$lib/Field.svelte';
	import InlineTextInput from '$lib/InlineTextInput.svelte';
	import Tooltip from '$lib/Tooltip.svelte';

	import { exporter } from './files.svelte.js';

	exporter.setup();
</script>

<div class="include">
	<Field label="Inclure">
		<EnumButtons
			bind:value={exporter.include}
			cards
			options={[
				{
					key: 'metadataonly',
					label: 'Métadonnées seulement',
					icon: IconMetadataOnly,
				},
				{
					key: 'croppedonly',
					label: 'Métadonnées et images recadrées',
					icon: IconCroppedOnly,
				},
				{
					key: 'full',
					label: 'Tout',
					subtext: 'Permet de ré-importer ultérieurement',
					icon: IconFullExport,
				},
			]}
		/>
	</Field>
</div>

<style>
	.include {
		display: flex;
		flex-direction: column;
		accent-color: var(--fg-primary);
	}
</style>

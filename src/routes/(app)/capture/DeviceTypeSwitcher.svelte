<script lang="ts">
	import type { CaptureDevice } from './device.svelte.js';

	import SegmentedGroup from '$lib/SegmentedGroup.svelte';

	interface Props {
		device: CaptureDevice;
	}

	const { device }: Props = $props();
</script>

<div class="typeswitch">
	<SegmentedGroup
		disabled={device.shooting}
		bind:current={device.selectedType}
		options={['photo', 'sound'] as const}
	>
		{#snippet option_photo()}
			Photo
		{/snippet}
		{#snippet option_sound()}
			Son
		{/snippet}
	</SegmentedGroup>
</div>

<script lang="ts">
	import type { CaptureDevice } from './device.svelte.js';

	import { fade } from 'svelte/transition';

	import IconCamera from '~icons/ri/camera-line';
	import IconWaveform from '~icons/ri/voiceprint-line';
	import SegmentedGroup from '$lib/SegmentedGroup.svelte';

	interface Props {
		device: CaptureDevice;
	}

	const { device }: Props = $props();
</script>

{#if !device.recording}
	<div class="typeswitch" transition:fade={{ duration: 500 }}>
		<SegmentedGroup
			disabled={device.shooting}
			bind:current={() => device.selectedType, (typ) => void device.selectType(typ)}
			options={['photo', 'sound'] as const}
		>
			{#snippet option_photo()}
				<IconCamera />
				Photo
			{/snippet}
			{#snippet option_sound()}
				<IconWaveform />
				Son
			{/snippet}
		</SegmentedGroup>
	</div>
{/if}

<style>
	.typeswitch {
		/* --segmented-group-bg: rgb(0 0 0 / 60%); */
		--segmented-group-bg: rgb(255 255 255 / 75%);
		--segmented-group-unselected-text-color: black;
		--segmented-group-selected-text-color: white;
	}
</style>

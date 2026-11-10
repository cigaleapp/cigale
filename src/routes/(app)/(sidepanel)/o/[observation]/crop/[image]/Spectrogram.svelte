<script lang="ts">
	import type { SelectedBox } from './+page.svelte';
	import type * as DB from '$lib/database.js';

	import { spectrogramBoundingBoxDomains } from '$lib/audio/spectrogram.js';
	import { getSettings } from '$lib/settings.svelte.js';
	import { range, round } from '$lib/utils.js';

	import CropSurface from './CropSurface.svelte';
	import Playhead from './Playhead.svelte';
	import Ruler from './Ruler.svelte';

	interface Props {
		src: string;
		loading: boolean;
		file: DB.AudioFile;
		selectedBox: SelectedBox;
		showConfirmedOverlay: () => Promise<void>;
	}

	let { src, file, loading = $bindable(true), ...rest }: Props = $props();
</script>

<div class="spectrogram">
	<!-- TODO: make MediaArea handle its image element resize instead -->
	{#key getSettings().cropperSidebarCollapsed}
		<CropSurface
			fit="fill"
			zoomlock="y"
			fileId={file.id}
			imageSrc={src}
			bind:imageIsLoading={loading}
			{...rest}
		>
			{#snippet extraMarks()}
				<Playhead headless />
			{/snippet}
		</CropSurface>
	{/key}

	<Ruler domain={file.spectrogram.frequencyRange} />
</div>

<style>
	.spectrogram {
		display: flex;
		height: 100%;
	}
</style>

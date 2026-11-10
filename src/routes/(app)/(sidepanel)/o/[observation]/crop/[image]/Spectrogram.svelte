<script lang="ts">
	import type * as DB from '$lib/database.js';
	import type { SelectedBox } from './+page.svelte';

	import { getSettings } from '$lib/settings.svelte.js';
	import { round } from '$lib/utils.js';
	import { getTheme } from '$routes/+layout.svelte';

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

	const theme = getTheme();
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
			invertColors={theme.effective === 'light'}
			{...rest}
		>
			{#snippet extraMarks()}
				<Playhead headless />
			{/snippet}
		</CropSurface>
	{/key}

	<Ruler
		domain={file.spectrogram.frequencyRange}
		label={(value) => (value > 1e3 ? round(value * 1e-3, 1) + 'k' : round(value, 2))}
	/>
</div>

<style>
	.spectrogram {
		display: flex;
		height: 100%;
	}
</style>

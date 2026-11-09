<script lang="ts">
	import type { SelectedBox } from './+page.svelte';
	import type * as DB from '$lib/database.js';

	import CropSurface from './CropSurface.svelte';
	import { getSettings } from '$lib/settings.svelte.js';

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
		/>
	{/key}

	<div class="frequency-rule"></div>
</div>

<style>
	.spectrogram {
		display: flex;
		height: 100%;
	}
</style>

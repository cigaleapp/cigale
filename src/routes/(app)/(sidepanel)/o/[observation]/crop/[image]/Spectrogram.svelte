<script lang="ts">
	import type { SelectedBox } from './+page.svelte';
	import type * as DB from '#lib/database.js';

	import { paletteSVGFilter } from '#lib/audio/spectrogram.js';
	import { getSettings } from '#lib/settings.svelte.js';
	import { round, switchValue } from '#lib/utils.js';
	import { getTheme } from '#routes/+layout.svelte';

	import CropSurface from './CropSurface.svelte';
	import Playhead from './Playhead.svelte';
	import Ruler from './Ruler.svelte';

	interface Props {
		src: string;
		loading: boolean;
		file: DB.AudioFile;
		selectedBox: SelectedBox;
		showConfirmedOverlay: () => Promise<void>;
		cursor: null | {
			/** in ms */
			time: number;
			/** in Hz */
			frequency: number;
		};
	}

	let { src, file, cursor = $bindable(), loading = $bindable(true), ...rest }: Props = $props();

	const theme = getTheme();

	const [start, stop] = $derived(file.spectrogram.durationRange);
	const [high, low] = $derived(file.spectrogram.frequencyRange);
</script>

<!-- eslint-disable-next-line svelte/no-at-html -->
{@html paletteSVGFilter(
	switchValue(theme.effective, {
		light: 'ylgnbu',
		dark: 'magma',
	})
)}

<div class="spectrogram">
	<!-- TODO: make MediaArea handle its image element resize instead -->
	{#key getSettings().cropperSidebarCollapsed}
		<CropSurface
			fit="fill"
			zoomlock="y"
			fileId={file.id}
			imageSrc={src}
			bind:imageIsLoading={loading}
			bind:cursor={
				() => null,
				(c) => {
					console.log('cur', c);
					if (c === null) {
						cursor = null;
						return;
					}
					cursor = {
						time: start + c.x * (stop - start),
						frequency: low + c.y * (high - low),
					};
				}
			}
			{...rest}
		>
			{#snippet extraMarks()}
				<Playhead headless />
			{/snippet}
		</CropSurface>
	{/key}

	<Ruler
		domain={file.spectrogram.frequencyRange}
		label={(value) => (value > 1e3 ? round(value * 1e-3, 1) + 'k' : round(value, 2).toString())}
	/>
</div>

<style>
	.spectrogram {
		display: flex;
		height: 100%;

		--crop-surface-filter: url(#spectro-palette);
	}
</style>

<script lang="ts">
	import type { SelectedBox } from './+page.svelte';
	import type * as DB from '$lib/database.js';

	import CropSurface from './CropSurface.svelte';

	interface Props {
		src: string;
		loading: boolean;
		file: DB.AudioFile;
		selectedBox: SelectedBox;
		showConfirmedOverlay: () => Promise<void>;
	}

	let { src, file, loading = $bindable(true), ...rest }: Props = $props();
</script>

<CropSurface fit="contain" fileId={file.id} imageSrc={src} bind:imageIsLoading={loading} {...rest} />

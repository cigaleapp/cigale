<script lang="ts">
	import type * as DB from '$lib/database.js';

	import { databaseHandle } from '$lib/idb.svelte.js';
	import { resolveObjectWithBytes } from '$lib/storage/utils.js';
	import { toasts } from '$lib/toasts.svelte.js';

	interface Props {
		file: DB.AudioFile;
		loadingFile: boolean;
	}

	let { file, loadingFile = $bindable(true) }: Props = $props();

	let source = $state<string>();

	async function loadAudio() {
		const resolved = await resolveObjectWithBytes(databaseHandle(), 'AudioFile', file.id);
		if (!resolved) {
			toasts.error(`Fichier ${file.filename} introuvable`);
			return;
		}

		if (source) URL.revokeObjectURL(source);
		source = URL.createObjectURL(new Blob([resolved.bytes]));
		loadingFile = false;
	}
</script>

{#await loadAudio()}
	<audio src={source} controls />
{/await}

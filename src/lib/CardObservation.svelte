<script>
	import { toTopLeftCoords } from './BoundingBoxes.svelte.js';
	import CardMedia from './CardMedia.svelte';
	import { tables } from './idb.svelte.js';
	import { isDebugMode } from './settings.svelte.js';
	import { uiState } from './uistate.svelte.js';
	import { nonnull } from './utils.js';

	/**
	 * @typedef {object} Props
	 * @property {import('$lib/database').Observation} observation
	 * @property {import('$lib/database').Image[]} images the images of the observation
	 * @property {import('$lib/database').Sound[]} sounds the sounds of the observation
	 * @property {boolean} [highlighted] - whether this image is highlighted
	 */

	/** @type { Omit< Partial<import('$lib/CardMedia.svelte').Props>, keyof Props> & Props} */
	const { observation, images, sounds, highlighted = false, ...rest } = $props();

	const errorMessages = $derived(
		images.flatMap(({ metadataErrors, id }) => {
			const otherError = uiState.erroredImages.get(id);
			if (otherError) return [otherError];

			return Object.entries(metadataErrors).flatMap(([metadataId, errors]) => {
				const metadata = tables.Metadata.getFromState(metadataId);
				return errors.map(
					(e) => `${e.kind} sur ${metadata?.label || metadataId}: ${e.message}`
				);
			});
		})
	);

	const status = $derived.by(() => {
		if (images.some(({ id }) => uiState.queuedImages.has(id))) return 'queued';
		if (images.some(({ id }) => uiState.loadingImages.has(id))) return 'loading';
		if (errorMessages.length > 0) return 'errored';
		return 'ok';
	});

	const tooltip = $derived.by(() => {
		if (status === 'errored') {
			return errorMessages.join('\n');
		}

		if (isDebugMode())
			return `${observation.id} @ ${observation.addedAt.toISOString()} [${observation.sessionId}]`;
	});

	const previewImage = $derived(images.at(0) ?? sounds.at(0));

	const audiofile = $derived(
		previewImage?.fileId ? tables.AudioFile.getFromState(previewImage.fileId) : undefined
	);
</script>

<CardMedia
	id={observation.id}
	title={observation.label}
	image={previewImage?.fileId ? uiState.getPreviewURL(previewImage.fileId) : undefined}
	{audiofile}
	dimensions={previewImage?._table === 'Image'
		? previewImage.dimensions
		: audiofile?.spectrogram.imageDimensions}
	type={previewImage?._table === 'Sound' ? 'audio/x-unknown' : 'image/x-unknown'}
	selected={uiState.selection.includes(observation.id)}
	stacksize={observation.images.length + observation.sounds.length}
	boxes="apply-first"
	{tooltip}
	{status}
	{highlighted}
	{...rest}
	boundingBoxes={[...images, ...sounds]
		.map((img) => uiState.cropMetadataValueOf(img)?.value)
		.filter(nonnull)
		.map((box) => toTopLeftCoords(box))}
/>

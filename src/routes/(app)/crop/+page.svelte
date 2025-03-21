<script>
	import AreaObservations from '$lib/AreaObservations.svelte';
	import { toAreaObservationProps } from '$lib/AreaObservations.utils';
	import { toCenteredCoords, toRelativeCoords, toTopLeftCoords } from '$lib/BoundingBoxes.svelte';
	import Cropup from '$lib/Cropup.svelte';
	import { BUILTIN_METADATA_IDS } from '$lib/builtins';
	import * as idb from '$lib/idb.svelte.js';
	import { TARGETHEIGHT, TARGETWIDTH } from '$lib/inference';
	import { deleteMetadataValue, storeMetadataValue } from '$lib/metadata';
	import { uiState } from '$lib/state.svelte';

	let openCropDialog = $state();

	/** ID of the image we're cropping */
	let croppingImage = $state('');
	const currentCropbox = $derived(
		toRelativeCoords(
			toTopLeftCoords(
				// @ts-ignore
				idb.tables.Image.state.find((i) => i.id === croppingImage)?.metadata.crop?.value ?? {
					x: 0,
					y: 0,
					width: TARGETWIDTH,
					height: TARGETHEIGHT
				}
			)
		)
	);

	/**
	 * @param {{x: number, y: number, width: number, height: number}} boundingBoxesout
	 */
	async function onConfirmCrop(boundingBoxesout) {
		const id = croppingImage;
		console.log(boundingBoxesout, 'is cropped! at id : ', id);

		const image = idb.tables.Image.state.find((image) => image.id === id);

		// Get inferred value from alternatives (if non empty), or use the main value otherwise. Inferred value is the initial cropbox value as determined by the neural network.
		// If this is the first time the user is re-cropping the box, this value will be the main values.
		/** @type {undefined | { value: import('$lib/metadata.js').RuntimeValue<'boundingbox'>, confidence: number }} */
		// @ts-expect-error
		let initialCrop = image?.metadata.crop ?? undefined;

		// On subsequent crops, the user's crop will be the main value and the neural network's crop will be in the alternatives.
		if (
			image?.metadata.crop.alternatives &&
			Object.entries(image.metadata.crop.alternatives).length > 0
		) {
			const [stringValue, confidence] = Object.entries(image.metadata.crop.alternatives)[0];
			initialCrop = {
				value: JSON.parse(stringValue),
				confidence
			};
		}

		await idb.openTransaction(['Image', 'Observation'], {}, async (tx) => {
			const image = await tx.objectStore('Image').get(id);
			if (!image) return;
			const speciesMetadataId =
				uiState.currentProtocol?.inference?.classification.metadata ?? BUILTIN_METADATA_IDS.species;
			const species = image.metadata[speciesMetadataId];
			if (species?.confidence && species.confidence < 1) {
				// Species confidence was inferred, we need to remove it so we can infer it again, since it's inferred on the _cropped_ image
				await deleteMetadataValue({
					tx,
					metadataId: speciesMetadataId,
					subjectId: id
				});
			}
			await storeMetadataValue({
				tx,
				metadataId: BUILTIN_METADATA_IDS.crop,
				subjectId: id,
				type: 'boundingbox',
				value: toCenteredCoords(boundingBoxesout),
				confidence: 1,
				// Put the neural-network-inferred (initial) value in the alternatives as a backup
				alternatives: initialCrop ? [initialCrop] : []
			});
		});
	}

	const images = $derived(
		toAreaObservationProps(idb.tables.Image.state, [], {
			isLoaded: (image) => image.bufferExists && uiState.hasPreviewURL(image)
		})
	);
</script>

<Cropup
	key="cropping"
	bind:opener={openCropDialog}
	id={croppingImage}
	boundingBoxes={[currentCropbox]}
	onconfirm={onConfirmCrop}
></Cropup>

<section class="observations">
	<AreaObservations
		{images}
		bind:selection={uiState.selection}
		loadingText="Chargement…"
		oncardclick={(id) => {
			croppingImage = id;
			openCropDialog();
		}}
	/>
</section>

<style>
	.observations {
		padding: 4em;
		display: flex;
		flex-grow: 1;
	}
</style>

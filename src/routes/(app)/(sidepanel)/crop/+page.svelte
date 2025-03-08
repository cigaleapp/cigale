
<script>
	import AreaObservations from '$lib/AreaObservations.svelte';
	import ButtonPrimary from '$lib/ButtonPrimary.svelte';
	import Cropup from '$lib/Cropup.svelte';

	import { storeMetadataValue } from '$lib/metadata';
	import * as idb from '$lib/idb.svelte.js';
	import { toAreaObservationProps } from '$lib/AreaObservations.utils';

	let openFeur = $state();

	/**
	 * @param {Array<{x: number, y: number, width: number, height: number}>} boundingBoxesout
	 * @param {number} id
	 */
	function oncrop (boundingBoxesout,id) { 
		console.log(boundingBoxesout,"is cropped! at id : ",id);
		storeMetadataValue({subjectId:"a", value:boundingBoxesout[0], metadataId:"crop"});

	}


	/*let images = $state(
		img_list.map((image, index) => ({
			index,
			image,
			title: index.toString(),
			stacksize: 1,
			loading: Math.random() > 0.8 ? (Math.random() > 0.3 ? Math.random() : -1) : undefined,
			boundingBoxes: boundingBoxes[index],
			id : index
		}))
	);*/

	let images = $derived( toAreaObservationProps(idb.tables.Image.state, idb.tables.Observation.state));
	
	/**
	 * @type {({x: number, y: number, width: number, height: number}[] | undefined)[]}
	 */
	/**
	 * @type {string[]}
	 */
	let selection = $state([]);

	let img_slectionnedURL = $state();
	let boundingboxeSelectionned = $state();
	let img_selectionned_id = $state();

	$effect(() => {
		
		let img_slectionned = images.filter((image) => selection.includes(image.id));
		img_slectionnedURL = img_slectionned.map((image) => image.image);
		boundingboxeSelectionned = img_slectionned.map((image) => image.boundingBoxes);
		img_selectionned_id = img_slectionned.map((image) => image.id);

		console.log("img_slectionnedid : ");
		console.log(img_selectionned_id);
	
	});


</script>


{#if selection.length > 0 && boundingboxeSelectionned[0]}
	<Cropup
		key="cropping"	
		bind:opener={openFeur}
		image={img_slectionnedURL[0]}
		id = {img_selectionned_id[0]}
		boundingBoxes={boundingboxeSelectionned[0]}
		onconfirm={oncrop}>
	</Cropup>
{/if}


<h1>Classif</h1>
<section class="demo-observations">
	<AreaObservations images={images} bind:selection={selection} loadingText="Analyse…" />
</section>

<ButtonPrimary onclick={openFeur}>Modifier un crop</ButtonPrimary>

<style>
	h1 {
		font-weight: bolder;
	}
</style>

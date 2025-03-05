<script>
	import AreaObservations from '$lib/AreaObservations.svelte';
	import ButtonPrimary from '$lib/ButtonPrimary.svelte';
	import ModalConfirm from '$lib/ModalConfirm.svelte';
	let openFeur = $state();

	/** @type {(x: number, y: number) => [number, number]} */
	const point = (x, y) => [x, y];
	let boundingBoxes = [
		{ topLeft: point(0.1, 0.2), bottomRight: point(0.8, 0.9) },
		{ topLeft: point(0.2, 0.2), bottomRight: point(0.4, 0.4) }
	];
	let images = $state(
		[
			'https://parlonssciences.ca/sites/default/files/2019-11/What_is_an_insect.jpg',
			'https://www.mnhn.fr/system/files/styles/medium/private/2023-05/Phasme.jpg.webp?itok=ShPjddHh',
			'https://c02.purpledshub.com/uploads/sites/62/2023/10/What-are-insects.jpg?w=1029&webp=1',
			'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBOmE9xQpSvkASuRBHnw43Nz6fGcM9P0Ly9Q&s',
			'https://i.imgur.com/oH8fyj6.png',
			'https://www.dgaae.de/files/user-upload/insekt_des_jahres/2024/Stierhornk%C3%A4fer_Schmitt.jpg',
			'https://www.coastalmountains.org/wp-content/uploads/2023/09/bug1.jpg',
			'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSy4ENS-jTKY1misqIH__jY0fl7Z2Z3r0D_uA&s',
			'https://i1.sndcdn.com/artworks-60T5acZkPilLZTnc-qOoVZw-t500x500.jpg',
			'https://www.terro.com/media/Articles/TERRO/How-to-ID-Insects.jpg',
			'https://i.pinimg.com/originals/d4/b6/c4/d4b6c4366f33a5e45694ccfa466c09f8.jpg',
			'https://cdn.pixabay.com/photo/2023/04/25/03/02/butterfly-7949342_640.jpg',
			'https://www.bioexplorer.net/images/1-Blue-Morpho.jpg'
		].map((image, index) => ({
			index,
			image,
			title: `IMG_${Math.ceil(Math.random() * 100000)}.JPEG`,
			stacksize: 1,
			loading: Math.random() > 0.8 ? (Math.random() > 0.3 ? Math.random() : -1) : undefined,
			boundingBoxes: boundingBoxes
		}))
	);
</script>

<ModalConfirm
	key="test"
	title="hmmmm"
	onconfirm={() => console.log('confirm')}
	bind:open={openFeur}>
	<p>hello</p>
</ModalConfirm>


<h1>Classif</h1>
<section class="demo-observations">
	<AreaObservations bind:images loadingText="Analyse…" />
</section>

<ButtonPrimary onclick={openFeur}>Modifier un crop</ButtonPrimary>

<style>
	h1 {
		font-weight: bolder;
	}
</style>

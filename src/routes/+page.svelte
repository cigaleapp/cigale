<script>
	import CardObservation from '$lib/CardObservation.svelte';
	

	const images = [
		'https://parlonssciences.ca/sites/default/files/2019-11/What_is_an_insect.jpg',
		'https://www.mnhn.fr/system/files/styles/medium/private/2023-05/Phasme.jpg.webp?itok=ShPjddHh',
		'https://c02.purpledshub.com/uploads/sites/62/2023/10/What-are-insects.jpg?w=1029&webp=1',
		'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBOmE9xQpSvkASuRBHnw43Nz6fGcM9P0Ly9Q&s',
		'https://www.dgaae.de/files/user-upload/insekt_des_jahres/2024/Stierhornk%C3%A4fer_Schmitt.jpg'
	].map((image) => ({
		image,
		title: `IMG_${Math.ceil(Math.random() * 100000)}.JPEG`,
		stacksize: Math.ceil(Math.random() * 5)
	}));

	/** @type {string[]} */
	let selection = $state([]);
</script>

<h1>Welcome to chocolat</h1>
<input type="file" accept="image/*" bind:files={image_file} />
<p>classse : {classe} with certainty : {certainty}</p>
<canvas id="canvas" bind:this={canva_element}></canvas>

<section class="images">
	{#each images as props}
		<CardObservation
			{...props}
			selected={selection.includes(props.title)}
			onclick={() => {
				if (selection.includes(props.title)) {
					selection = selection.filter((title) => title !== props.title);
				} else {
					selection.push(props.title);
				}
			}}
		/>
	{/each}
</section>

<style>
	section.images {
		display: flex;
		gap: 2em;
	}
</style>

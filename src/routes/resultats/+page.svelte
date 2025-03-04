<script>
	import { onMount } from 'svelte';

	let showDropdown = false;
	let selectedFilter = 'Tri et Filtre';
	const filters = [
		'Classes',
		'Score de prédictions',
		'Observations',
		'A-Z',
		'Région géographiques'
	];

	let images = [];
	let filteredImages = [];
	let selectionMode = false;
	let selectedImages = new Set();

	onMount(() => {
		images = Array.from({ length: 12 }, (_, i) => ({
			id: i,
			label: `classe : ${['chien', 'chat', 'poisson', 'abeille'][i % 4]}`,
			category: ['chien', 'chat', 'poisson', 'abeille'][i % 4],
			score: Math.random() * 100
		}));
		applyFilter();
	});

	$: if (selectedFilter || images) applyFilter();

	function applyFilter() {
		if (selectedFilter === 'Tri et Filtre') {
			filteredImages = [...images];
		} else if (selectedFilter === 'A-Z') {
			filteredImages = [...images].sort((a, b) => a.label.localeCompare(b.label));
		} else if (selectedFilter === 'Score de prédictions') {
			filteredImages = [...images].sort((a, b) => b.score - a.score);
		} else if (selectedFilter === 'Classes') {
			filteredImages = images.filter((img) => img.category === 'chien');
		} else if (selectedFilter === 'Observations') {
			filteredImages = images.filter((_, i) => i % 2 === 0);
		} else if (selectedFilter === 'Région géographiques') {
			filteredImages = images.filter((_, i) => i % 2 !== 0);
		}
	}

	function selectFilter(filter) {
		selectedFilter = filter;
		showDropdown = false;
		applyFilter();
	}

	function toggleSelectionMode() {
		selectionMode = !selectionMode;
		if (!selectionMode) {
			selectedImages.clear();
		}
	}

	function toggleImageSelection(imageId) {
		if (selectionMode) {
			selectedImages.has(imageId) ? selectedImages.delete(imageId) : selectedImages.add(imageId);
			selectedImages = new Set(selectedImages);
		}
	}

	function selectAllImages() {
		selectedImages =
			selectedImages.size === filteredImages.length
				? new Set()
				: new Set(filteredImages.map((img) => img.id));
	}
</script>

<div class="container">
	<!-- Dropdown -->
	<div class="dropdown-container">
		<button class="dropdown-button" onclick={() => (showDropdown = !showDropdown)}>
			{selectedFilter} <span class="arrow">{showDropdown ? '▲' : '▼'}</span>
		</button>
		{#if showDropdown}
			<ul class="dropdown-menu">
				{#each filters as filter, index (index)}
					<li onclick={() => selectFilter(filter)}>
						{filter}
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<!-- Image Grid -->
	<div class="content-container">
		<div class="image-grid">
			{#each filteredImages as image (image.id)}
				<div
					class="image-card {selectedImages.has(image.id) ? 'selected' : ''}"
					onclick={() => toggleImageSelection(image.id)}
				>
					<div class="image-placeholder"></div>
					<p>{image.label} (Score: {image.score.toFixed(1)})</p>
				</div>
			{/each}
		</div>
	</div>

	<!-- Buttons -->
	<div class="button-container">
		<button class="selection-mode" onclick={toggleSelectionMode}>
			{selectionMode ? 'Quitter mode sélection' : 'Mode de sélection'}
		</button>
		<button class="select-all" onclick={selectAllImages} disabled={!selectionMode}>
			{selectedImages.size === filteredImages.length ? 'Tout désélectionner' : 'Tout sélectionner'}
		</button>
	</div>
</div>

<style>
	.container {
		padding: 20px;
	}

	.content-container {
		width: calc(100vw - 33%);
		height: 100vh;
		display: flex;
		flex-direction: column;
		padding-right: 10px;
		overflow: auto;
	}

	.dropdown-container {
		position: relative;
		display: inline-block;
	}

	.dropdown-button {
		padding: 10px;
		background: white;
		border: 1px solid #ccc;
		cursor: pointer;
		width: 200px;
		text-align: left;
		position: relative;
	}

	.arrow {
		float: right;
	}

	.dropdown-menu {
		position: absolute;
		top: 100%;
		left: 0;
		width: 200px;
		background: white;
		border: 2px solid green;
		box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
		list-style: none;
		padding: 5px 0;
		margin: 0;
		z-index: 100;
	}

	.dropdown-menu li {
		padding: 10px;
		cursor: pointer;
		transition: background 0.3s;
	}

	.dropdown-menu li:hover {
		background: #eee;
	}

	.image-grid {
		flex-wrap: wrap;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 10px;
		margin-top: 20px;
		flex-grow: 1;
	}

	.image-card {
		max-width: 100%;
		overflow: hidden;
		background: white;
		border: 1px solid #ddd;
		padding: 15px;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		transition: border 0.3s ease;
		cursor: pointer;
	}

	.image-placeholder {
		width: 100px;
		height: 100px;
		background: #f0f0f0;
		margin-bottom: 10px;
	}

	.selected {
		border: 3px solid blue;
	}

	/* Buttons */
	.button-container {
		display: flex;
		justify-content: center;
		margin-top: 20px;
		gap: 10px;
	}

	.selection-mode,
	.select-all {
		padding: 10px 15px;
		background: #d63384;
		color: white;
		border: none;
		cursor: pointer;
		border-radius: 20px;
	}

	.selection-mode:hover,
	.select-all:hover {
		background: #b8206e;
	}

	.select-all:disabled {
		background: grey;
		cursor: not-allowed;
	}
</style>

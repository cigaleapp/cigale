<script>
	import Fuse from 'fuse.js';

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {string[]} options possible options
	 * @property {string} searchQuery the string we're searching for
	 * @property {string} selectedValue the option selected by the user
	 */

	/** @type {Props} */
	let { options, searchQuery = $bindable(''), selectedValue = $bindable() } = $props();

	const fuse = $derived(new Fuse(options));

	/** @type {string[]} options that match searchQuery */
	const filteredItems = $derived(
		searchQuery ? fuse.search(searchQuery).map((r) => r.item) : options
	);
</script>

<div class="listeRecherche">
	<input class="search-bar" type="text" placeholder="Search..." bind:value={searchQuery} />

	<ul class="container">
		{#each filteredItems as option}
			<li>
				<button class="button" onclick={() => (selectedValue = option)}>
					{option}
				</button>
			</li>
		{/each}
	</ul>
	Vous avez choisi : {selectedValue}
</div>

<style>
	.container {
		position: absolute;
		max-height: 100px;
		overflow-y: auto;
		border: 1px solid #ccc;
		padding: 10px;
		top: var(--searchBarHeight);
	}
	.search-bar {
		height: var(--searchBarHeight);
	}
	.button {
		width: 100%;
		padding: 10px;
		margin: 5px 0;
		background-color: #f0f0f0;
		border: 1px solid;
		border-radius: 5px;
		cursor: pointer;
		text-align: left;
	}

	ul {
		list-style: none;
		padding-left: 0;
	}

	.listeRecherche {
		position: relative;
		--searchBarHeight: 2.5em;
	}
</style>

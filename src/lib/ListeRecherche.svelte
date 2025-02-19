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
	// svelte-ignore non_reactive_update
	let activeIndex = -1; // Tracks currently selected option in the list
	let listRef;

	function handleKeyDown(event) {
		const itemCount = filteredItems.length;

		if (event.key === 'ArrowDown') {
			event.preventDefault();
			activeIndex = (activeIndex + 1) % itemCount; // Loop to first item
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			activeIndex = (activeIndex - 1 + itemCount) % itemCount; // Loop to last item
		} else if (event.key === 'Enter' && itemCount > 0) {
			event.preventDefault();
			searchQuery = filteredItems[activeIndex]; // Select active item
		}
		// Update the border of the active button
		Array.from(listRef.children).forEach((child, index) => {
			child.firstElementChild.style.background =
				index === activeIndex ? 'var(--bg-primary-translucent)' : 'var(--bg-neutral)';
		});

		// Ensure the active button is scrolled into view
		listRef?.children[activeIndex]?.scrollIntoView({ block: 'nearest' });
	}
</script>

<div class="listeRecherche" role="listbox" tabindex={activeIndex} onkeydown={handleKeyDown}>
	<input class="search-bar" type="text" placeholder="Search..." bind:value={searchQuery} />

	<ul class="container" bind:this={listRef}>
		{#each filteredItems as option, i}
			<li>
				<button
					class="button {activeIndex === i ? option : ''}"
					onclick={() => (selectedValue = option)}
					tabindex="-1"
				>
					{option}
				</button>
			</li>
		{/each}
	</ul>
</div>

<style>
	.container {
		position: absolute;
		max-height: 100px;
		overflow: hidden;
		border: 1px solid #ccc;
		border-radius: 5px;
	}
	.search-bar {
		height: var(--searchBarHeight);
	}
	.button {
		width: 100%;
		height: 100%;
		border: none;
		text-align: left;
	}
	ul {
		list-style: none;
		padding-left: 0;
		visibility: hidden;
		left: 0;
		right: 0;
	}

	.listeRecherche:focus-within ul {
		visibility: visible;
	}

	.listeRecherche {
		position: relative;
		width: fit-content;
		--searchBarHeight: 2.5em;
	}
</style>

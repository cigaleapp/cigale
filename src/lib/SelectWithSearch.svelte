<script>
	import Fuse from 'fuse.js';

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {Record<string, string>} options possible options. {key: user-friendly label}
	 * @property {string} searchQuery the string we're searching for
	 * @property {string} selectedValue the option selected by the user
	 * @property {(value: string) => void} [onblur] callback to call when the user quits the search bar
	 */

	/**
	 * @typedef {{  value: string, label: string }} Item
	 */

	/** @type {Props} */
	let { options, onblur, searchQuery = $bindable(''), selectedValue = $bindable() } = $props();

	const items = $derived(Object.entries(options).map(([value, label]) => ({ value, label })));

	const fuse = $derived(new Fuse(items, { keys: ['value', 'label'] }));

	/** @type {Item[]} options that match searchQuery */
	const filteredItems = $derived(searchQuery ? fuse.search(searchQuery).map((r) => r.item) : items);
	// svelte-ignore non_reactive_update
	let activeIndex = -1; // Tracks currently selected option in the list
	/** @type {HTMLUListElement} */
	let listRef;
	/** @type {HTMLInputElement} */
	let InputRef;

	/** @param {KeyboardEvent} event */
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
			searchQuery = filteredItems[activeIndex].label; // Select active item
			listRef.blur();
			InputRef.blur();
		}
		// Update the border of the active button
		Array.from(listRef.children).forEach((child, index) => {
			if (!child.firstElementChild) return;
			if (!(child.firstElementChild instanceof HTMLLIElement)) return;
			child.firstElementChild.style.background =
				index === activeIndex ? 'var(--bg-primary-translucent)' : 'var(--bg-neutral)';
		});

		// Ensure the active button is scrolled into view
		listRef?.children[activeIndex]?.scrollIntoView({ block: 'nearest' });
	}
</script>

<div class="listeRecherche" role="listbox" tabindex={activeIndex} onkeydown={handleKeyDown}>
	<input
		class="search-bar"
		type="text"
		placeholder="Search..."
		bind:value={searchQuery}
		bind:this={InputRef}
		onblur={() => {
			onblur?.(selectedValue);
		}}
	/>

	<ul class="container" bind:this={listRef}>
		{#each filteredItems as option, i (option)}
			<li>
				<button
					class="button {activeIndex === i ? option : ''}"
					onclick={(e) => {
						selectedValue = option.value;
						searchQuery = option.label;
						e.currentTarget.blur();
					}}
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
		border: 1px solid #ccc;
		border-bottom-left-radius: 5px;
		border-bottom-right-radius: 5px;
		margin-top: 0;
		overflow-x: auto;
	}
	.search-bar {
		border: 1px solid var(--gray);
		height: var(--searchBarHeight);
		border-radius: 5px;
		padding: 0 1em;
	}

	.search-bar:focus {
		outline: none;
		border-color: var(--bg-primary);
	}
	.search-bar:hover {
		border-color: var(--bg-primary-translucent);
	}
	.button {
		width: 100%;
		height: 100%;
		border: none;
		text-align: left;
		display: flex;
		padding: 0 1em;
	}
	.ul:last-child {
		border-bottom-left-radius: 5px;
		border-bottom-right-radius: 5px;
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

	.listeRecherche:focus-within .search-bar {
		border-bottom-left-radius: 0px;
		border-bottom-right-radius: 0px;
	}

	.listeRecherche {
		position: relative;
		width: fit-content;
		--searchBarHeight: 2.5em;
	}
</style>

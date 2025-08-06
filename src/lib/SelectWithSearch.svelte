<script>
	import Fuse from 'fuse.js';

	/**
	 * @typedef {{  key: string, label: string }} Option
	 */

	/**
	 * @typedef Props
	 * @type {object}
	 * @property {Option[]} options possible options. Each option is a {key, label} object. The array allows you to explicitly specify the order of the options.
	 * @property {string} searchQuery the string we're searching for
	 * @property {string} [placeholder="Rechercher…"] the placeholder text for the search bar
	 * @property {string|undefined} selectedValue the option selected by the user
	 * @property {(value: string|undefined) => void} [onblur] callback to call when the user quits the search bar
	 */

	/** @type {Props} */
	let {
		options,
		onblur,
		placeholder,
		searchQuery = $bindable(''),
		selectedValue = $bindable(),
		...rest
	} = $props();

	const fuse = $derived(new Fuse(options, { keys: ['key', 'label'] }));

	/** @type {Option[]} options that match searchQuery */
	const filteredItems = $derived(
		searchQuery ? fuse.search(searchQuery).map((r) => r.item) : options
	);
	let activeIndex = $state(-1);
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
			selectedValue = filteredItems[activeIndex].key;
			listRef.blur();
			InputRef.blur();
		}

		// Ensure the active button is scrolled into view
		listRef?.children[activeIndex]?.scrollIntoView({ block: 'nearest' });
	}
</script>

<div class="listeRecherche" role="listbox">
	<input
		{...rest}
		class="search-bar"
		type="text"
		{placeholder}
		value={searchQuery}
		bind:this={InputRef}
		onkeydown={handleKeyDown}
		oninput={({ currentTarget }) => {
			console.log('input', currentTarget.value);
			searchQuery = currentTarget.value;
			activeIndex = 0;
		}}
		onblur={() => {
			onblur?.(selectedValue);
			activeIndex = 0;
		}}
	/>

	<ul class="container" bind:this={listRef}>
		{#each filteredItems as { key, label }, i (key)}
			<li>
				<button
					class="button"
					class:highlighted={i === activeIndex}
					onclick={(e) => {
						selectedValue = key;
						searchQuery = label;
						e.currentTarget.blur();
					}}
					tabindex="-1"
				>
					{label}
				</button>
			</li>
		{/each}
	</ul>
</div>

<style>
	.container {
		position: absolute;
		max-height: 200px;
		border: 1px solid var(--gay);
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
		width: 100%;
		font-size: 1em;
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
		padding: 0.25em 1em;
		font-size: 1em;
		z-index: 10;
	}

	.button.highlighted {
		background-color: var(--bg-primary-translucent);
	}

	ul:last-child {
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
		width: 100%;
		position: relative;
		--searchBarHeight: 2.5em;
	}
</style>

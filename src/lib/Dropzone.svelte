<script>
	/**
	 * @typedef Props
	 * @type {object}
	 * @property {boolean} [dragging=false] The user is dragging a file above the zone
	 * @property {(data: {event: DragEvent|Event, files: File[] }) => void} [onfiles] Files were added by the user
	 * @property {string[]} [filetypes=[]] The allowed filetypes. Empty for all
	 * @property {boolean} [clickable=false] The user can click to select files
	 * @property {(files: File[]) => void} [onunacceptable] User added files that are not allowed
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props} */
	let {
		dragging = $bindable(false),
		onfiles,
		onunacceptable,
		filetypes,
		children,
		clickable
	} = $props();

	/** @param {DragEvent} event */
	function handleDrop(event) {
		dragging = false;
		if (!event.dataTransfer) return;
		event.preventDefault();

		/** @type {File[]} */
		let files;

		if (event.dataTransfer.items) {
			// Use DataTransferItemList interface to access the file(s)
			files = [...event.dataTransfer.items]
				.map((item) => {
					// If dropped items aren't files, reject them
					if (item.kind === 'file') {
						const file = item.getAsFile();
						return file;
					}
				})
				.filter(
					/** @returns {item is File} */
					(item) => Boolean(item)
				);
		} else {
			// Use DataTransfer interface to access the file(s)
			files = [...event.dataTransfer.files];
		}

		if (filetypes && filetypes.length > 0 && files.some((f) => !filetypes.includes(f.type))) {
			onunacceptable?.(files);
			return;
		}

		onfiles?.({ event, files });
	}
</script>

<section
	class="dropzone"
	role="form"
	class:dragging
	class:clickable
	ondragover={(e) => {
		if (!e.dataTransfer) return;
		e.preventDefault();
		dragging = true;
	}}
	ondrop={handleDrop}
>
	{@render children?.()}
	<div class="dragging-overlay">
		<p>Déposer des images ici…</p>
	</div>
	{#if clickable}
		<input
			type="file"
			multiple
			accept={filetypes?.join(',')}
			oninput={(e) => {
				if (!e.currentTarget.files) return;
				onfiles?.({ event: e, files: [...e.currentTarget.files] });
			}}
		/>
	{/if}
</section>

<style>
	input {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		opacity: 0;
	}

	.dragging-overlay {
		opacity: 0;
		visibility: hidden;
		pointer-events: none;

		display: flex;
		justify-content: center;
		align-items: center;
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 10;
		background-color: rgba(from var(--bg-primary) r g b / 0.5);
		color: var(--fg-primary);
		padding: 1em;
		text-align: center;
		border-radius: var(--corner-radius);
	}

	.dropzone {
		position: relative;
		display: flex;
		flex-grow: 1;
	}

	.dropzone.clickable {
		cursor: pointer;
	}

	.dropzone.dragging .dragging-overlay {
		opacity: 1;
		visibility: visible;
		pointer-events: auto;
	}
</style>

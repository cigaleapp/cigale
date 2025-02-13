<script>
	/** @type {{value: string}} */
	let { value } = $props();
</script>

<textarea bind:value></textarea>

<style>
    textarea {
        font-family: sans-serif;
        border-radius: var(--corner-radius);
        border: var(--border-thickness) solid currentColor;
        outline: none;
        padding: 0.5em;
    }

    textarea:hover {
        background-color: var(--bg-primary-translucent);
    }

    textarea:focus-visible {
        border-color: var(--bg-primary);
        background-color: var(--bg-primary-translucent);
        color: var(--fg-primary);
    }
</style>

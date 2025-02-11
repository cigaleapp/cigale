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
        background-color: azure;
    }

    textarea:focus-visible {
        border-color: chocolate;
        background-color: azure;
    }
</style>

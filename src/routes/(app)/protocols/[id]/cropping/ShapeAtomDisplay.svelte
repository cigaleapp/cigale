<script>
	/**
	 * @type {{atom: string}}
	 */
	const { atom } = $props();

	const isVariable = $derived(!['score', '_', 'delete', ''].includes(atom));
</script>

{#if isVariable && atom.length === 2}
	<span class="atom math">
		{atom.charAt(0)}
		<sub>{atom.charAt(1)}</sub>
	</span>
{:else if isVariable}
	<span class="atom math">
		{atom}
	</span>
{:else}
	<span class="atom text">{atom}</span>
{/if}

<style>
	.math,
	.math * {
		font-family: 'CMU Serif', serif;
		font-style: italic;
	}

	.math sub {
		margin-left: -0.8ch;
	}

	.atom {
		width: 6ch;
		text-align: center;
		font-weight: normal;

		&.text {
			font-size: 1.2em;
		}

		&.math {
			font-size: 1.6em;
		}
	}
</style>

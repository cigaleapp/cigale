<script>
	import Line from './Line.svelte';

	/** @type {Record<string, import('svelte').Snippet>} */
	const { ...coordinates } = $props();
</script>

<math display="block" class="tml-display" style="display:block math;">
	<mrow>
		<mo fence="true" form="prefix">(</mo>
		<mtable>
			{#each Object.values(coordinates) as coordinate}
				<mtr>
					<mtd style="padding-left:0em;padding-right:0em;">
						<Line>{@render coordinate()}</Line>
					</mtd>
				</mtr>
			{/each}
		</mtable>
		<mo fence="true" form="postfix">)</mo>
	</mrow>
</math>

<script>
	/** @type { Record<'x'|'y', import('svelte').Snippet> } */
	const { x, y } = $props();
</script>

<math display="block" class="tml-display" style="display:block math;">
	<mrow>
		<mo fence="true" form="prefix">(</mo>
		<mtable>
			<mtr>
				<mtd style="padding-left:0em;padding-right:0em;">
					{@render x()}
				</mtd>
			</mtr>
			<mtr>
				<mtd style="padding-left:0em;padding-right:0em;">
					{@render y()}
				</mtd>
			</mtr>
		</mtable>
		<mo fence="true" form="postfix">)</mo>
	</mrow>
</math>

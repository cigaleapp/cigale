<script>
    import * as bbs from './BoundingBoxes.svelte';
    /**
     * @typedef Props
     * @type {object}
     * @property {typeof bbs.BoundingBoxes} bb
    */

    /**  @type {Props} */
    let { bb } = $props();

    $effect(() => {
        console.log("yoyo l'asticot");
        console.log(bb);
    });

    let x = bb.x * 100;
    let y = bb.y * 100;
    let width = bb.width * 100;
    let height = bb.height * 100;

    let moving = false;

    function start () {
        moving = true;
    }


</script>

<div class="bounding-box">
	<!-- Four dots at each corner of the bounding box -->
	<div class="dot" style="left: {x}%; top: {y}%"></div>          <!-- top-left -->
	<div class="dot" style="left: {x + width}%; top: {y}%"></div>   <!-- top-right -->
	<div class="dot" style="left: {x}%; top: {y + height}%"></div>  <!-- bottom-left -->
	<div class="dot" style="left: {x + width}%; top: {y + height}%"></div> <!-- bottom-right -->

	<!-- SVG lines joining each dot -->
	<svg class="lines" viewBox="0 0 100 100" preserveAspectRatio="none">
		<line x1="{x}" y1="{y}" x2="{x + width}" y2="{y}" />
		<line x1="{x + width}" y1="{y}" x2="{x + width}" y2="{y + height}" />
		<line x1="{x + width}" y1="{y + height}" x2="{x}" y2="{y + height}" />
		<line x1="{x}" y1="{y + height}" x2="{x}" y2="{y}" />
	</svg>
</div>

<style>
	.bounding-box {
		position: absolute;
		width: 100%;
		height: 100%;
	}
	.dot {
		position: absolute;
		width: 10px;
		height: 10px;
		background: white;
		border-radius: 50%;
		transform: translate(-50%, -50%);
        user-select: none;
        cursor: move;
	}
    
	.lines {
		position: absolute;
		width: 100%;
		height: 100%;
		top: 0;
		left: 0;
		pointer-events: none;
	}
	.lines line {
		stroke: white;
		stroke-width: 0.2;
	}
</style>



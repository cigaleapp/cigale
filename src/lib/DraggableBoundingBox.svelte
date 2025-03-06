<script>
    import * as bbs from './BoundingBoxes.svelte';
    /**
     * @typedef Props
     * @type {object}
     * @property {typeof bbs.BoundingBoxes} bb
	 * @property {typeof bbs.BoundingBoxes} bbout
	 * @property {number} sizew
	 * @property {number} sizeh
    */

    /**  @type {Props} */
    // Remove fallback: require bbout is supplied via binding
    let { bb, bbout=$bindable({x:bb.x, y:bb.y,width:bb.width,height:bb.height}), sizew,sizeh} = $props();

	let x = $state();
	let y = $state();
	let width = $state();
	let height = $state();

    x = bb.x * 100;
    y = bb.y * 100;
    width = bb.width * 100;
    height = bb.height * 100;

    let movingtl = false;
	let movingtr = false;
	let movingbl = false;
	let movingbr = false;

    function starttl () {
        movingtl = true;
		console.log("chocolat !");
    }

	function starttr () {
		movingtr = true;
	}


	function startbl () {
		movingbl = true;
	}


	function startbr () {
		movingbr = true;
	}


	function stopall () {
		movingtl = false;
		movingtr = false;
		movingbl = false;
		movingbr = false;
	}

	/**
	 * @param {MouseEvent} event
	 */
	function movebb (event) {
		let xm = (event.movementX/sizew) * 100;
		let ym = (event.movementY/sizeh) * 100;
		if (movingtl) {
			x += xm ;
			y += ym ;
			width -= xm ;
			height -= ym;
		}

		if (movingtr) {
			y += ym ;
			width += xm ;
			height -= ym;
		}

		if (movingbl) {
			x += xm ;
			width -= xm ;
			height += ym ;
		}

		if (movingbr) {
			width += xm ;
			height += ym ;
		}

		x = Math.max(0, Math.min(x, 100 - width));
		y = Math.max(0, Math.min(y, 100 - height));
		width = Math.max(0, Math.min(width, 100 - x));
		height = Math.max(0, Math.min(height, 100 - y));
		

		bbout.x = x / 100;
		bbout.y = y / 100;
		bbout.width = width / 100;
		bbout.height = height / 100;

	}


</script>
<svelte:window onmousemove="{movebb}" onmouseup="{stopall}"></svelte:window>

<div class="bounding-box">
	<!-- SVG lines joining each dot -->
	<svg class="lines" viewBox="0 0 100 100" preserveAspectRatio="none">
		<line x1="{x}" y1="{y}" x2="{x + width}" y2="{y}" />
		<line x1="{x + width}" y1="{y}" x2="{x + width}" y2="{y + height}" />
		<line x1="{x + width}" y1="{y + height}" x2="{x}" y2="{y + height}" />
		<line x1="{x}" y1="{y + height}" x2="{x}" y2="{y}" />
	</svg>
	<!-- Four dots at each corner of the bounding box -->
	<div class="dot" 
		onmousedown="{starttl}"
		style="	left: {x}%;
				top: {y}%">
	</div>          <!-- top-left -->
	
	<div class="dot" 
		onmousedown="{starttr}"
		style="	left: {x + width}%;
				top: {y}%">
	</div>   <!-- top-right -->
	
	<div class="dot" 
		onmousedown="{startbl}"
		style=" left: {x}%; 
				top: {y + height}%">
	</div>  <!-- bottom-left -->

	<div class="dot" 
		onmousedown="{startbr}"
		style="	left: {x + width}%; 
				top: {y + height}%">
	</div> <!-- bottom-right -->

	
	

	
</div>

<style>

	.bounding-box {
		position: absolute;
		width: 100%;
		height: 100%;
	}
	.dot {
		position: absolute;
		width: 2rem;
		height: 2rem;
		background: rgb(186, 186, 186);
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
		stroke-width: 0.05rem;
	}
</style>



<script>
	/**
	 * @typedef Props
	 * @type {object}
	 * @property {{x: number, y: number, width: number, height: number}} bb
	 * @property {{x: number, y: number, width: number, height: number}} bbout
	 * @property {number} sizew
	 * @property {number} sizeh
	 */

	/**  @type {Props} */
	// Remove fallback: require bbout is supplied via binding
	let {
		bb,
		bbout = $bindable({ x: bb.x, y: bb.y, width: bb.width, height: bb.height }),
		sizew,
		sizeh
	} = $props();

	let x = $state();
	let y = $state();
	let width = $state();
	let height = $state();

	$effect(() => {
		x = bb.x * 100;
		y = bb.y * 100;
		width = bb.width * 100;
		height = bb.height * 100;
	});

	let movingtl = false;
	let movingtr = false;
	let movingbl = false;
	let movingbr = false;
	let movinggbl = false;

	function starttl() {
		movingtl = true;
		console.log('chocolat !');
	}

	function starttr() {
		movingtr = true;
	}

	function startbl() {
		movingbl = true;
	}

	function startbr() {
		movingbr = true;
	}
	/**
	 * @param {MouseEvent} event
	 */
	function startmoveglobal(event) {
		let x2 = (event.offsetX / sizew) * 100;
		let y2 = (event.offsetY / sizeh) * 100;

		console.log('startmoveglobal');
		if (x2 > x && x2 < x + width && y2 > y && y2 < y + height) {
			movinggbl = true;
		}
	}

	$effect(() => {
		console.log('movinggbl : ', movinggbl);
	});

	function stopall() {
		movingtl = false;
		movingtr = false;
		movingbl = false;
		movingbr = false;
		movinggbl = false;
	}

	/**
	 * @param {MouseEvent} event
	 */
	function movebb(event) {
		let xm = (event.movementX / sizew) * 100;
		let ym = (event.movementY / sizeh) * 100;

		let x2 = (event.offsetX / sizew) * 100;
		let y2 = (event.offsetY / sizeh) * 100;

		if (x2 > x && x2 < x + width && y2 > y && y2 < y + height) {
			document.body.style.cursor = 'move';
		} else {
			document.body.style.cursor = 'default';
		}

		if (movingtl) {
			x += xm;
			y += ym;
			width -= xm;
			height -= ym;
		}

		if (movingtr) {
			y += ym;
			width += xm;
			height -= ym;
		}

		if (movingbl) {
			x += xm;
			width -= xm;
			height += ym;
		}

		if (movingbr) {
			width += xm;
			height += ym;
		}

		if (movinggbl && !movingtl && !movingtr && !movingbl && !movingbr) {
			x += xm;
			y += ym;
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

	const stroke = 0.5;
</script>

<svelte:window onmousemove={movebb} onmouseup={stopall} />

<!-- TODO make this accessible -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="bounding-box" onmousedown={startmoveglobal}>
	<!-- SVG lines joining each dot -->
	<svg class="lines" viewBox="0 0 100 100" preserveAspectRatio="none">
		<line x1={x} y1={y} x2={x + width} y2={y} />
		<line class="black" x1={x + stroke} y1={y + stroke} x2={x + width - stroke} y2={y + stroke} />
		<line x1={x + width} y1={y} x2={x + width} y2={y + height} />
		<line
			class="black"
			x1={x + width - stroke}
			y1={y + stroke}
			x2={x + width - stroke}
			y2={y + height - stroke}
		/>
		<line x1={x + width} y1={y + height} x2={x} y2={y + height} />
		<line
			class="black"
			x1={x + width - stroke}
			y1={y + height - stroke}
			x2={x + stroke}
			y2={y + height - stroke}
		/>
		<line x1={x} y1={y + height} x2={x} y2={y} />
		<line class="black" x1={x + stroke} y1={y + height - stroke} x2={x + stroke} y2={y + stroke} />
	</svg>
	<!-- Four dots at each corner of the bounding box -->
	<div
		class="dot"
		onmousedown={starttl}
		style="	left: {x}%;
				top: {y}%;
				cursor: nwse-resize"
	></div>
	<!-- top-left -->

	<div
		class="dot"
		onmousedown={starttr}
		style="	left: {x + width}%;
				top: {y}%;
				cursor: nesw-resize"
	></div>
	<!-- top-right -->

	<div
		class="dot"
		onmousedown={startbl}
		style=" left: {x}%; 
				top: {y + height}%;
				cursor: nesw-resize"
	></div>
	<!-- bottom-left -->

	<div
		class="dot"
		onmousedown={startbr}
		style="	left: {x + width}%; 
				top: {y + height}%;
				cursor: nwse-resize"
	></div>
	<!-- bottom-right -->
</div>

<style>
	.bounding-box {
		position: absolute;
		width: 100%;
		height: 100%;
	}
	.dot {
		position: absolute;
		width: 1.5rem;
		height: 1.5rem;
		background: white;
		border: 3px solid black;
		border-radius: 50%;
		transform: translate(-50%, -50%);
		user-select: none;
		cursor: move;
		transition: all 0.05s;
	}

	.dot:is(:hover, :focus-visible) {
		width: 2rem;
		height: 2rem;
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
		stroke-width: 0.03rem;
	}

	.lines line.black {
		stroke: black;
	}
</style>

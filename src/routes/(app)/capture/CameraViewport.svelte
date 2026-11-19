<script lang="ts">
	import type { CaptureDevice } from './device.svelte.js';

	interface Props {
		device: CaptureDevice;
	}

	const { device }: Props = $props();
</script>

<!-- https://github.com/capacitor-community/camera-preview#extra-web-installation-steps -->
<div class:snapping={device.camera.snapping} id="viewport" {@attach device.cameraViewport}></div>

<style>
	#viewport {
		position: fixed;
		inset: 0;

		:global(video) {
			height: 100%;
			width: 100%;
			object-fit: contain;
		}

		/* Used to show that a pic has been snapped */
		&::after {
			content: '';
			position: fixed;
			inset: 0;
			pointer-events: none;
			opacity: 0;
			background: black;
			transition: opacity 75ms ease;
		}

		&.snapping::after {
			opacity: 1;
		}
	}
</style>

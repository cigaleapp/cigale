<!-- 
@component
show a pop up to crop an image
-->

<script>
    import { pushState } from '$app/navigation';
	import { page } from '$app/state';
	import IconClose from '~icons/ph/x';
	import ButtonIcon from './ButtonIcon.svelte';
    import Modal from './Modal.svelte';
    import ModalConfirm from './ModalConfirm.svelte';
    import * as bbs from './BoundingBoxes.svelte' ;

    /**
	 * @typedef Props
	 * @type {object}
	 * @property {string} key a unique string, used to identify the modal in the page's state.
	 * @property {string} title the title used in the header
	 * @property {() => void} [open] a function you can bind to, to open the modal
	 * @property {Image} image the image to crop 
     * @property {typeof bbs.BoundingBoxes} boundingBoxes the bounding boxes to display
	 */

    /**  @type {Props} */
    let {
        key: stateKey,
        title,
        open = $bindable(undefined),
        image,
        boundingBoxes
    } = $props();

    


</script>

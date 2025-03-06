<!-- 
@component
show a pop up to crop an image
-->

<script>
    import ModalConfirm from './ModalConfirm.svelte';
    import * as bbs from './BoundingBoxes.svelte' ;
    import DraggableBoundingBox from './DraggableBoundingBox.svelte';

    /**
	 * @typedef Props
	 * @type {object}
	 * @property {string} key a unique string, used to identify the modal in the page's state.
	 * @property {() => void} [opener] a function you can bind to, to open the modal
	 * @property {string} image the image to crop 
     * @property {typeof bbs.BoundingBoxes[]} boundingBoxes the bounding boxes to display
     * @property {typeof bbs.BoundingBoxes[]} [boundingBoxesout] the bounding boxes to display
	 */

    /**  @type {Props} */
    let {
        key:StateKey,
        opener = $bindable(undefined),
        boundingBoxesout = $bindable([]),
        image,
        boundingBoxes = []
    } = $props();
    

    /** @type {typeof bbs.BoundingBoxes[]} */
    let BBout = boundingBoxes.map(bb => ({ x: bb.x, y: bb.y, width: bb.width, height: bb.height }));

    export function cropconfirm () {
        console.log('crop confirm');
        boundingBoxesout = BBout.map(bb => ({ ...bb }));
    }

    export function cropcancel () {
        console.log('crop cancel');
        boundingBoxesout = boundingBoxes.map(bb => ({ ...bb }));
    }

</script>

<ModalConfirm
    key={StateKey}
    title="Crop"
    onconfirm={() => cropconfirm()}
    oncancel={() => cropcancel()}
    bind:open={opener}
    confirm="Crop"
    cancel="Cancel">


<img src = {image} alt="chocolat" style="width: 100%; height: auto;position:absolute;">
{#if boundingBoxes}
    {#each boundingBoxes as bb, index}
        <DraggableBoundingBox bb={bb} bbout={BBout[index]}></DraggableBoundingBox>
    {/each}
{/if}


</ModalConfirm>

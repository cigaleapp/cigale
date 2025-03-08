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
     * @property {{x: number, y: number, width: number, height: number}[]} boundingBoxes the bounding boxes to display
     * @property {(boundingbox:{x: number, y: number, width: number, height: number}, id:number) => void} onconfirm a function to call when the user confirms the crop
     * @property {number} id the id of the image 
	 */

    /**  @type {Props} */
    let {
        key:StateKey,
        opener = $bindable(undefined),
        image,
        boundingBoxes = [],
        onconfirm,
        id,
    } = $props();

    let container = $state();

    /** @type {{x: number, y: number, width: number, height: number}[]} */
    let BBout = [];
    for (let i=0;i<boundingBoxes.length; i++){
        BBout.push({x:boundingBoxes[i].x, y:boundingBoxes[i].y, width:boundingBoxes[i].width, height:boundingBoxes[i].height});
    }

    export function cropconfirm () {
        console.log('crop confirm');
        onconfirm(BBout,id);
    }

</script>
<ModalConfirm
    key={StateKey}
    title="Crop"
    onconfirm={() => cropconfirm()}
    bind:open={opener}
    confirm="Crop"
    cancel="Cancel">

<div style="position:relative; display: inline-block;" >
    
    {#if boundingBoxes}
        {#each boundingBoxes as bb, index}
            <DraggableBoundingBox bb={bb} bind:bbout={BBout[index]} sizew={container.getBoundingClientRect().width} sizeh={container.getBoundingClientRect().height}></DraggableBoundingBox>
        {/each}
    {/if}
    <img src = {image} alt="imagetocrop" style="width: 100%; height: 100%;" bind:this={container}>

</div>


</ModalConfirm>

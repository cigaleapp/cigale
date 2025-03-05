export var BoundingBoxes = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
}
/**
 * 
 * @param {number[]} list 
 * @param {number} imheight
 * @param {number} imwidth
 * @returns {BoundingBoxes}
 */
export let BBfromList = function (list,imwidth,imheight) {
    let x = list[0]/imwidth
    let y = list[1]/imheight
    let width = list[2]/imwidth
    let height = list[3]/imheight
    return { x, y, width, height }
}
/**
 * 
 * @param {number[][]} lists 
 * @param {number} imheight
 * @param {number} imwidth
 * @returns {BoundingBoxes[]}
 */
export let BBsfromLists = function (lists,imwidth,imheight) {
    return lists.map(list => BBfromList(list,imwidth,imheight))
}

/**
 * 
 * @param {number[][][]} lists 
 * @param {number} imheight
 * @param {number} imwidth
 * @returns {BoundingBoxes[][]}
 */
export let BBsfromMultipleImages = function (lists,imheight,imwidth) {
    return lists.map(list => BBsfromLists(list,imwidth,imheight))
}
export var BoundingBoxes = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
}
/**
 * 
 * @param {number[]} list 
 * @returns {BoundingBoxes}
 */
export let BBfromList = function (list) {
    let x = list[0]
    let y = list[1]
    let width = list[2]
    let height = list[3]
    return { x, y, width, height }
}
/**
 * 
 * @param {number[][]} lists 
 * @returns {BoundingBoxes[]}
 */
export let BBsfromLists = function (lists) {
    return lists.map(list => BBfromList(list))
}

/**
 * 
 * @param {number[][][]} lists 
 * @returns {BoundingBoxes[][]}
 */
export let BBsfromMultipleImages = function (lists) {
    return lists.map(list => BBsfromLists(list))
}
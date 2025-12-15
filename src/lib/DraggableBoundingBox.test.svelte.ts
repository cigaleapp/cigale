import { describe, expect, it, test } from 'vitest';

import { fittedImageRect, NewBoundingBox } from './DraggableBoundingBox.svelte.js';

describe('fittedImageRect', () => {
	test('naturalWidth < naturalHeight', () => {
		const rect = fittedImageRect(
			{
				naturalWidth: 100,
				naturalHeight: 200,
				clientWidth: 100,
				clientHeight: 200,
				clientTop: 0,
				clientLeft: 0
			},
			undefined
		);
		expect(rect).toEqual({
			width: 100,
			height: 200,
			x: 0,
			y: 0
		});
	});

	test('naturalWidth > naturalHeight', () => {
		const rect = fittedImageRect(
			{
				naturalWidth: 200,
				naturalHeight: 100,
				clientWidth: 200,
				clientHeight: 100,
				clientTop: 0,
				clientLeft: 0
			},
			undefined
		);
		expect(rect).toEqual({
			width: 200,
			height: 100,
			x: 0,
			y: 0
		});
	});

	test('portrait image without zoom', () => {
		const rect = fittedImageRect(
			{
				naturalWidth: 100,
				naturalHeight: 200,
				clientWidth: 200,
				clientHeight: 100,
				clientTop: 0,
				clientLeft: 0
			},
			undefined
		);
		expect(rect).toMatchInlineSnapshot(`
				{
				  "height": 100,
				  "width": 50,
				  "x": 75,
				  "y": 0,
				}
			`);
	});

	test('landscape image without zoom', () => {
		const rect = fittedImageRect(
			{
				naturalWidth: 200,
				naturalHeight: 100,
				clientWidth: 100,
				clientHeight: 200,
				clientTop: 0,
				clientLeft: 0
			},
			undefined
		);
		expect(rect).toMatchInlineSnapshot(`
				{
				  "height": 50,
				  "width": 100,
				  "x": 0,
				  "y": 75,
				}
			`);
	});

	test('portrait image with zoom', () => {
		const rect = fittedImageRect(
			{
				naturalWidth: 100,
				naturalHeight: 200,
				clientWidth: 200,
				clientHeight: 100,
				clientTop: 0,
				clientLeft: 0
			},
			{
				origin: { x: 0, y: 0 },
				scale: 2,
				panning: false,
				panStart: { x: 0, y: 0, zoomOrigin: { x: 0, y: 0 } }
			}
		);
		expect(rect).toMatchInlineSnapshot(`
				{
				  "height": 200,
				  "width": 100,
				  "x": 50,
				  "y": -50,
				}
			`);
	});

	test('landscape image with zoom', () => {
		const rect = fittedImageRect(
			{
				naturalWidth: 200,
				naturalHeight: 100,
				clientWidth: 100,
				clientHeight: 200,
				clientTop: 0,
				clientLeft: 0
			},
			{
				origin: { x: 0, y: 0 },
				scale: 2,
				panning: false,
				panStart: { x: 0, y: 0, zoomOrigin: { x: 0, y: 0 } }
			}
		);
		expect(rect).toMatchInlineSnapshot(`
				{
				  "height": 100,
				  "width": 200,
				  "x": -50,
				  "y": 50,
				}
			`);
	});

	test('nonzero clientTop and clientLeft', () => {
		const rect = fittedImageRect(
			{
				naturalWidth: 200,
				naturalHeight: 100,
				clientWidth: 100,
				clientHeight: 200,
				clientTop: 10,
				clientLeft: 20
			},
			{
				origin: { x: 0, y: 0 },
				scale: 2,
				panning: false,
				panStart: { x: 0, y: 0, zoomOrigin: { x: 0, y: 0 } }
			}
		);
		expect(rect).toMatchInlineSnapshot(`
				{
				  "height": 100,
				  "width": 200,
				  "x": -30,
				  "y": 60,
				}
			`);
	});
});

describe('NewBoundingBox', () => {
	/**
	 * @param {'clickanddrag' | '2point' | '4point'|'off'} mode
	 */
	function createBox(mode = '2point') {
		const box = new NewBoundingBox({ limits: { x: 0, y: 0, width: 100, height: 100 } });
		box.setCreateMode(mode);
		return box;
	}

	it('starts with zero values', () => {
		const limits = {
			x: 1,
			y: 2,
			width: 3,
			height: 4
		};
		const boundingBox = new NewBoundingBox({
			limits
		});
		expect(boundingBox.clickanddrag).toEqual({
			x: 0,
			y: 0,
			width: 0,
			height: 0,
			dragDirection: { x: 0, y: 0 }
		});
		expect(boundingBox.points).toEqual([]);
		expect(boundingBox.limits).toEqual(limits);
	});

	describe('registration', () => {
		it('points', () => {
			const bb = createBox();
			bb.registerPoint(1, 2);
			expect(bb.points).toEqual([{ x: 1, y: 2 }]);
		});
		describe('movement', () => {
			const makeBox = () => {
				const bb = createBox('clickanddrag');
				bb.registerPoint(1, 2);
				bb.registerMovement(3, 4);
				return bb;
			};

			test('non-clickanddrag createMode', () => {
				const bb = createBox('2point');
				bb.registerPoint(1, 2);
				bb.registerMovement(3, 4);
				expect(bb.clickanddrag).toEqual({
					x: 0,
					y: 0,
					width: 0,
					height: 0,
					dragDirection: { x: 0, y: 0 }
				});
			});

			describe('→↓', () => {
				test('initializes', () => {
					const bb = makeBox();
					expect(bb.clickanddrag).toEqual({
						x: 1,
						y: 2,
						width: 3,
						height: 4,
						dragDirection: { x: 1, y: 1 }
					});
				});
				test('enlarges', () => {
					const bb = makeBox();
					bb.registerMovement(5, 6);
					expect(bb.clickanddrag).toEqual({
						x: 1,
						y: 2,
						width: 8,
						height: 10,
						dragDirection: { x: 1, y: 1 }
					});
				});
				test('shrinks', () => {
					const bb = makeBox();
					bb.registerMovement(-1, -2);
					expect(bb.clickanddrag).toEqual({
						x: 1,
						y: 2,
						width: 2,
						height: 2,
						dragDirection: { x: 1, y: 1 }
					});
				});
				describe('changes direction', () => {
					it('to ←↓', () => {
						const bb = makeBox();
						bb.registerMovement(-4, -3);
						bb.registerMovement(-10, -10);
						expect(bb.clickanddrag).toEqual({
							x: -9,
							y: -8,
							width: 9,
							height: 11,
							dragDirection: { x: -1, y: -1 }
						});
					});
					it('to ←↑', () => {
						const bb = makeBox();
						bb.registerMovement(-4, -3);
						bb.registerMovement(-10, 10);
						expect(bb.clickanddrag).toEqual({
							x: -9,
							y: 2,
							width: 9,
							height: 11,
							dragDirection: { x: -1, y: 1 }
						});
					});
					it('to →↑', () => {
						const bb = makeBox();
						bb.registerMovement(-4, 0);
						bb.registerMovement(3, -14);
						expect(bb.clickanddrag).toEqual({
							x: 1,
							y: -12,
							width: 2,
							height: 18,
							dragDirection: { x: 1, y: -1 }
						});
					});
				});
			});
			// Verify that these test cases actually describe their movement directions
			describe('←↓', () => {
				test('initializes', () => {
					const bb = makeBox();
					bb.registerMovement(-3, 4);
					expect(bb.clickanddrag).toMatchInlineSnapshot(`
						{
						  "dragDirection": {
						    "x": 1,
						    "y": 1,
						  },
						  "height": 8,
						  "width": 0,
						  "x": 1,
						  "y": 2,
						}
					`);
				});
				test('enlarges', () => {
					const bb = makeBox();
					bb.registerMovement(-3, 4);
					bb.registerMovement(-5, 6);
					expect(bb.clickanddrag).toMatchInlineSnapshot(`
						{
						  "dragDirection": {
						    "x": -1,
						    "y": 1,
						  },
						  "height": 14,
						  "width": 5,
						  "x": -4,
						  "y": 2,
						}
					`);
				});
				test('shrinks', () => {
					const bb = makeBox();
					bb.registerMovement(-3, 4);
					bb.registerMovement(1, -2);
					expect(bb.clickanddrag).toMatchInlineSnapshot(`
						{
						  "dragDirection": {
						    "x": 1,
						    "y": -1,
						  },
						  "height": 10,
						  "width": 1,
						  "x": 1,
						  "y": 0,
						}
					`);
				});
				describe('changes direction', () => {
					it('to →↓', () => {
						const bb = makeBox();
						bb.registerMovement(-3, 4);
						bb.registerMovement(5, 6);
						expect(bb.clickanddrag).toMatchInlineSnapshot(`
							{
							  "dragDirection": {
							    "x": 1,
							    "y": 1,
							  },
							  "height": 14,
							  "width": 5,
							  "x": 1,
							  "y": 2,
							}
						`);
					});
					it('to →↑', () => {
						const bb = makeBox();
						bb.registerMovement(-3, 4);
						bb.registerMovement(5, -6);
						expect(bb.clickanddrag).toMatchInlineSnapshot(`
							{
							  "dragDirection": {
							    "x": 1,
							    "y": -1,
							  },
							  "height": 14,
							  "width": 5,
							  "x": 1,
							  "y": -4,
							}
						`);
					});
				});
			});

			describe('←↑', () => {
				test('initializes', () => {
					const bb = makeBox();
					bb.registerMovement(-3, -4);
					expect(bb.clickanddrag).toMatchInlineSnapshot(`
						{
						  "dragDirection": {
						    "x": 1,
						    "y": 1,
						  },
						  "height": 0,
						  "width": 0,
						  "x": 1,
						  "y": 2,
						}
					`);
				});
				test('enlarges', () => {
					const bb = makeBox();
					bb.registerMovement(-3, -4);
					bb.registerMovement(-5, -6);
					expect(bb.clickanddrag).toMatchInlineSnapshot(`
						{
						  "dragDirection": {
						    "x": -1,
						    "y": -1,
						  },
						  "height": 6,
						  "width": 5,
						  "x": -4,
						  "y": -4,
						}
					`);
				});
				test('shrinks', () => {
					const bb = makeBox();
					bb.registerMovement(-3, -4);
					bb.registerMovement(1, 2);
					expect(bb.clickanddrag).toMatchInlineSnapshot(`
						{
						  "dragDirection": {
						    "x": 1,
						    "y": 1,
						  },
						  "height": 2,
						  "width": 1,
						  "x": 1,
						  "y": 2,
						}
					`);
				});
				describe('changes direction', () => {
					it('to →↑', () => {
						const bb = makeBox();
						bb.registerMovement(-3, -4);
						bb.registerMovement(5, -6);
						expect(bb.clickanddrag).toMatchInlineSnapshot(`
							{
							  "dragDirection": {
							    "x": 1,
							    "y": -1,
							  },
							  "height": 6,
							  "width": 5,
							  "x": 1,
							  "y": -4,
							}
						`);
					});
					it('to →↓', () => {
						const bb = makeBox();
						bb.registerMovement(-3, -4);
						bb.registerMovement(5, 6);
						expect(bb.clickanddrag).toMatchInlineSnapshot(`
							{
							  "dragDirection": {
							    "x": 1,
							    "y": 1,
							  },
							  "height": 6,
							  "width": 5,
							  "x": 1,
							  "y": 2,
							}
						`);
					});
				});
			});

			describe('→↑', () => {
				test('initializes', () => {
					const bb = makeBox();
					bb.registerMovement(3, -4);
					expect(bb.clickanddrag).toMatchInlineSnapshot(`
						{
						  "dragDirection": {
						    "x": 1,
						    "y": 1,
						  },
						  "height": 0,
						  "width": 6,
						  "x": 1,
						  "y": 2,
						}
					`);
				});
				test('enlarges', () => {
					const bb = makeBox();
					bb.registerMovement(3, -4);
					bb.registerMovement(5, -6);
					expect(bb.clickanddrag).toMatchInlineSnapshot(`
						{
						  "dragDirection": {
						    "x": 1,
						    "y": -1,
						  },
						  "height": 6,
						  "width": 11,
						  "x": 1,
						  "y": -4,
						}
					`);
				});
				test('shrinks', () => {
					const bb = makeBox();
					bb.registerMovement(3, -4);
					bb.registerMovement(-1, 2);
					expect(bb.clickanddrag).toMatchInlineSnapshot(`
						{
						  "dragDirection": {
						    "x": -1,
						    "y": 1,
						  },
						  "height": 2,
						  "width": 7,
						  "x": 0,
						  "y": 2,
						}
					`);
				});
				describe('changes direction', () => {
					it('to ←↑', () => {
						const bb = makeBox();
						bb.registerMovement(3, -4);
						bb.registerMovement(-5, -6);
						expect(bb.clickanddrag).toMatchInlineSnapshot(`
							{
							  "dragDirection": {
							    "x": -1,
							    "y": -1,
							  },
							  "height": 6,
							  "width": 11,
							  "x": -4,
							  "y": -4,
							}
						`);
					});
					it('to ←↓', () => {
						const bb = makeBox();
						bb.registerMovement(3, -4);
						bb.registerMovement(-5, 6);
						expect(bb.clickanddrag).toMatchInlineSnapshot(`
							{
							  "dragDirection": {
							    "x": -1,
							    "y": 1,
							  },
							  "height": 6,
							  "width": 11,
							  "x": -4,
							  "y": 2,
							}
						`);
					});
				});
			});
		});
	});

	describe('.rect', () => {
		test('clickanddrag, within limits', () => {
			const bb = createBox('clickanddrag');
			bb.registerPoint(1, 2);
			bb.registerMovement(3, 4);
			expect(bb.rect()).toEqual({
				x: 1,
				y: 2,
				width: 3,
				height: 4
			});
		});
		test('clickanddrag, outside limits', () => {
			const bb = createBox('clickanddrag');
			bb.registerPoint(1, 2);
			bb.registerMovement(300, 4);
			expect(bb.rect()).toEqual({
				x: 1,
				y: 2,
				width: 99,
				height: 4
			});
		});
		test('2-points', () => {
			const bb = createBox('2point');
			bb.registerPoint(1, 2);
			bb.registerPoint(3, 4);
			expect(bb.rect()).toEqual({
				x: 1,
				y: 2,
				width: 2,
				height: 2
			});
		});
		test('4-points', () => {
			const bb = createBox('4point');
			bb.registerPoint(1, 2);
			bb.registerPoint(3, 4);
			bb.registerPoint(5, 6);
			bb.registerPoint(7, 8);
			expect(bb.rect()).toEqual({
				x: 1,
				y: 2,
				width: 6,
				height: 6
			});
		});
		test('createMode off', () => {
			const bb = createBox('off');
			bb.registerPoint(1, 2);
			bb.registerPoint(3, 4);
			expect(bb.rect()).toEqual({
				x: 0,
				y: 0,
				width: 0,
				height: 0
			});
		});
	});
	test('.reset', () => {
		const bb = createBox('clickanddrag');
		bb.registerPoint(1, 2);
		bb.registerMovement(3, 4);
		expect(bb.clickanddrag).toEqual({
			x: 1,
			y: 2,
			width: 3,
			height: 4,
			dragDirection: { x: 1, y: 1 }
		});
		bb.reset();
		expect(bb.clickanddrag).toEqual({
			x: 0,
			y: 0,
			width: 0,
			height: 0,
			dragDirection: { x: 0, y: 0 }
		});
		expect(bb.points).toEqual([]);
		expect(bb.limits).toEqual({ x: 0, y: 0, width: 100, height: 100 });
	});
	describe('.ready', () => {
		// oxlint-disable no-standalone-expect
		test('createMode off', () => {
			const bb = createBox('off');
			expect(bb.ready).toBe(false);
		});
		test('clickanddrag', () => {
			$effect.root(() => {
				const bb = createBox('clickanddrag');
				bb.registerPoint(1, 2);
				expect(bb.ready).toBe(false);
				bb.registerMovement(3, 4);
				expect(bb.ready).toBe(true);
			})();
		});
		test('2point', () => {
			$effect.root(() => {
				const bb = createBox('2point');
				bb.registerPoint(1, 2);
				expect(bb.ready).toBe(false);
				bb.registerPoint(3, 4);
				expect(bb.ready).toBe(true);
			})();
		});
		test('4point', () => {
			$effect.root(() => {
				const bb = createBox('4point');
				bb.registerPoint(1, 2);
				expect(bb.ready).toBe(false);
				bb.registerPoint(3, 4);
				expect(bb.ready).toBe(false);
				bb.registerPoint(5, 6);
				expect(bb.ready).toBe(false);
				bb.registerPoint(7, 8);
				expect(bb.ready).toBe(true);
			})();
		});
		// oxlint-enable no-standalone-expect
	});
});

import { test, expect } from 'vitest';

test('IoU', () => {
    expect(IoU([0, 0, 10, 10], [5, 5, 10, 10])).toBe(0.14285714285714285);
    expect(IoU([0, 0, 10, 10], [15, 15, 10, 10])).toBe(0);
    expect(IoU([0, 0, 10, 10], [5, 5, 5, 5])).toBe(0.25);
});
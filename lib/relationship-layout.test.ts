import { describe, expect, it } from 'vitest';
import { routeAroundNodes } from './relationship-layout';

describe('relationship routing', () => {
  it('routes around an unrelated person node', () => {
    const positions = {
      source: { x: 0, y: 80 },
      obstacle: { x: 180, y: 80 },
      target: { x: 360, y: 80 },
    };
    const points = routeAroundNodes('source', 'target', positions);
    expect(points.length).toBeGreaterThan(2);

    const rect = { left: 162, right: 314, top: 62, bottom: 186 };
    for (let index = 1; index < points.length; index++) {
      const a = points[index - 1], b = points[index];
      const crossesHorizontal = a.y === b.y && a.y > rect.top && a.y < rect.bottom && Math.max(a.x, b.x) > rect.left && Math.min(a.x, b.x) < rect.right;
      const crossesVertical = a.x === b.x && a.x > rect.left && a.x < rect.right && Math.max(a.y, b.y) > rect.top && Math.min(a.y, b.y) < rect.bottom;
      expect(crossesHorizontal || crossesVertical).toBe(false);
    }
  });

  it('keeps a clear relationship direct', () => {
    const points = routeAroundNodes('source', 'target', { source: { x: 0, y: 0 }, target: { x: 240, y: 120 } });
    expect(points).toHaveLength(2);
  });
});

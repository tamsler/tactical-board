import { describe, it, expect } from "vitest";
import {
  controlThroughMidpoint,
  curveLength,
  curveMidpoint,
  pointAtLength,
  straightControl,
} from "./path";

const p0 = { x: 0, y: 0 };
const p1 = { x: 400, y: 0 };

describe("curved paths", () => {
  it("returns the endpoints exactly", () => {
    const c = { x: 200, y: 300 };
    expect(pointAtLength(p0, c, p1, 0)).toBe(p0);
    expect(pointAtLength(p0, c, p1, 1)).toBe(p1);
  });

  it("puts the bend handle on the curve and inverts it", () => {
    const m = { x: 150, y: 120 };
    const c = controlThroughMidpoint(p0, p1, m);
    expect(curveMidpoint(p0, c, p1)).toEqual(m);
  });

  it("matches a straight line when the control is the chord midpoint", () => {
    const c = straightControl(p0, p1);
    const p = pointAtLength(p0, c, p1, 0.25);
    expect(p.x).toBeCloseTo(100, 6);
    expect(p.y).toBeCloseTo(0, 6);
    expect(curveLength(p0, c, p1)).toBeCloseTo(400, 6);
  });

  it("moves at a near-constant speed along a strong bend", () => {
    const c = { x: 0, y: 400 };
    const steps = 20;
    const points = Array.from({ length: steps + 1 }, (_, i) =>
      pointAtLength(p0, c, p1, i / steps),
    );
    const gaps = points
      .slice(1)
      .map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y));
    const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    for (const g of gaps) expect(Math.abs(g - mean) / mean).toBeLessThan(0.05);
  });

  it("is symmetric: halfway along a symmetric bend is its apex", () => {
    const c = { x: 200, y: 200 };
    const mid = pointAtLength(p0, c, p1, 0.5);
    expect(mid.x).toBeCloseTo(200, 3);
    expect(mid.y).toBeCloseTo(100, 3);
  });
});

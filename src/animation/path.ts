import type { Point } from "../types/tactics";

/** Point on the quadratic Bézier `p0 → c → p1` at curve parameter `t`. */
export function quadPoint(p0: Point, c: Point, p1: Point, t: number): Point {
  const a = (1 - t) * (1 - t);
  const b = 2 * (1 - t) * t;
  const d = t * t;
  return { x: a * p0.x + b * c.x + d * p1.x, y: a * p0.y + b * c.y + d * p1.y };
}

const SAMPLES = 32;

/** Cumulative arc length at `SAMPLES + 1` evenly spaced curve parameters. */
function arcTable(p0: Point, c: Point, p1: Point): number[] {
  const table = [0];
  let prev = p0;
  for (let i = 1; i <= SAMPLES; i++) {
    const p = quadPoint(p0, c, p1, i / SAMPLES);
    table.push(table[i - 1] + Math.hypot(p.x - prev.x, p.y - prev.y));
    prev = p;
  }
  return table;
}

/**
 * Point at fraction `s` (0..1) of the curve's length, so movement along the
 * curve has constant speed. Raw Bézier parameters bunch up around the bend.
 */
export function pointAtLength(
  p0: Point,
  c: Point,
  p1: Point,
  s: number,
): Point {
  if (s <= 0) return p0;
  if (s >= 1) return p1;
  const table = arcTable(p0, c, p1);
  const total = table[SAMPLES];
  if (total === 0) return p0;
  const target = s * total;
  let i = 1;
  while (i < SAMPLES && table[i] < target) i++;
  const span = table[i] - table[i - 1];
  const t = (i - 1 + (span > 0 ? (target - table[i - 1]) / span : 0)) / SAMPLES;
  return quadPoint(p0, c, p1, t);
}

export function curveLength(p0: Point, c: Point, p1: Point): number {
  return arcTable(p0, c, p1)[SAMPLES];
}

/** The curve point at t = 0.5, where the bend handle is drawn. */
export function curveMidpoint(p0: Point, c: Point, p1: Point): Point {
  return quadPoint(p0, c, p1, 0.5);
}

/** Control point that makes the curve pass through `m` at t = 0.5. */
export function controlThroughMidpoint(p0: Point, p1: Point, m: Point): Point {
  return { x: 2 * m.x - (p0.x + p1.x) / 2, y: 2 * m.y - (p0.y + p1.y) / 2 };
}

/** Control point of a straight path, used when no bend is set. */
export function straightControl(p0: Point, p1: Point): Point {
  return { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
}

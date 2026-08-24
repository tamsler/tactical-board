import type { Point } from "../types/tactics";

export function distance(p1: Point, p2: Point): number {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

export function angle(p1: Point, p2: Point): number {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

// Generate true mathematical sine wave path for dribbling
export function generateWavyPath(
  start: Point,
  end: Point,
  amplitude = 7.5,
): { path: string; endAngle: number } {
  const d = distance(start, end);
  const ang = angle(start, end);

  if (d < 16) {
    return {
      path: `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} L ${end.x.toFixed(2)} ${end.y.toFixed(2)}`,
      endAngle: ang,
    };
  }

  const cos = Math.cos(ang);
  const sin = Math.sin(ang);

  // Exact integer cycles so sine starts and ends at zero offset: sin(2 * PI * N) = 0
  const cycles = Math.max(2, Math.round(d / 36));
  const samples = Math.max(30, Math.round(d / 2));
  const points: { x: number; y: number }[] = [];

  // Arrowhead length to leave straight runway for the arrow
  const arrowRunway = Math.min(18, d * 0.2);

  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * d;

    // Smooth envelope: zero at start, zero before the arrow head runway
    let envelope = 1;
    if (t < 16) {
      envelope = t / 16;
    } else if (t > d - arrowRunway) {
      envelope = Math.max(0, (d - t) / arrowRunway);
    }

    // Smooth easing of envelope
    envelope = envelope * envelope * (3 - 2 * envelope);

    const phase = (t / (d - arrowRunway || 1)) * (cycles * 2 * Math.PI);
    const perpOffset =
      t < d - arrowRunway ? amplitude * Math.sin(phase) * envelope : 0;

    const px = start.x + t * cos - perpOffset * sin;
    const py = start.y + t * sin + perpOffset * cos;
    points.push({ x: px, y: py });
  }

  let pathStr = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 1; i < points.length; i++) {
    pathStr += ` L ${points[i].x.toFixed(2)} ${points[i].y.toFixed(2)}`;
  }

  return { path: pathStr, endAngle: ang };
}

// Generate quadratic bezier path string with control point
export function generateCurvePath(
  start: Point,
  control: Point,
  end: Point,
): { path: string; endAngle: number } {
  const endAngle = Math.atan2(end.y - control.y, end.x - control.x);
  return {
    path: `M ${start.x} ${start.y} Q ${control.x} ${control.y}, ${end.x} ${end.y}`,
    endAngle,
  };
}

// Generate freehand smooth path using Catmull-Rom or simple line join
export function generateFreehandPath(points: Point[]): string {
  if (points.length === 0) return "";
  if (points.length === 1)
    return `M ${points[0].x} ${points[0].y} L ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    d += ` Q ${points[i].x} ${points[i].y}, ${xc} ${yc}`;
  }
  d += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
  return d;
}

// Calculate sleek, professional tactical Arrow Head coordinates with recessed notch
export function getArrowHeadPath(
  tip: Point,
  angleRad: number,
  size = 15,
): string {
  const wingAngle = 0.44; // ~25.2 degrees swept back
  const backAngle1 = angleRad + Math.PI - wingAngle;
  const backAngle2 = angleRad + Math.PI + wingAngle;

  const p1 = {
    x: tip.x + size * Math.cos(backAngle1),
    y: tip.y + size * Math.sin(backAngle1),
  };
  const p2 = {
    x: tip.x + size * Math.cos(backAngle2),
    y: tip.y + size * Math.sin(backAngle2),
  };

  // Recessed inner notch for professional stealth/tactical arrowhead
  const notchDist = size * 0.72;
  const notch = {
    x: tip.x + notchDist * Math.cos(angleRad + Math.PI),
    y: tip.y + notchDist * Math.sin(angleRad + Math.PI),
  };

  return `M ${tip.x.toFixed(2)} ${tip.y.toFixed(2)} L ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} L ${notch.x.toFixed(2)} ${notch.y.toFixed(2)} L ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} Z`;
}

// Calculate T-Bar (Block line end)
export function getTBarPath(
  point: Point,
  angleRad: number,
  length = 20,
): string {
  const perp1 = angleRad + Math.PI / 2;
  const perp2 = angleRad - Math.PI / 2;
  const half = length / 2;

  const p1 = {
    x: point.x + half * Math.cos(perp1),
    y: point.y + half * Math.sin(perp1),
  };
  const p2 = {
    x: point.x + half * Math.cos(perp2),
    y: point.y + half * Math.sin(perp2),
  };

  return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
}

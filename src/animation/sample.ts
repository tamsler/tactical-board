import type { Ball, Player, TacticFrame } from "../types/tactics";
import { ease } from "./easing";
import { pathControl, type AnimationFrame, type SampledFrame } from "./model";
import { pointAtLength } from "./path";
import { segmentIndexAt, type Timeline } from "./timeline";

function toTacticFrame(f: AnimationFrame): TacticFrame {
  return {
    id: f.id,
    title: f.title,
    players: f.players,
    balls: f.balls,
    equipments: f.equipments,
    lines: f.lines,
    shapes: f.shapes,
    texts: f.texts,
    notes: f.notes,
  };
}

function lerp(a: number, b: number, p: number): number {
  return a + (b - a) * p;
}

function interpolate<T extends Player | Ball>(
  source: AnimationFrame,
  from: T[],
  to: T[],
  p: number,
): T[] {
  const targets = new Map(to.map((e) => [e.id, e]));
  return from.map((e) => {
    const t = targets.get(e.id);
    if (!t) return e;
    const control = pathControl(source, e.id);
    if (control) {
      const { x, y } = pointAtLength(e, control, t, p);
      return { ...e, x, y };
    }
    if (t.x === e.x && t.y === e.y) return e;
    return { ...e, x: lerp(e.x, t.x, p), y: lerp(e.y, t.y, p) };
  });
}

/** Pose at `timeMs`, following the temporal contract in docs/specs/animation.md §5. */
export function sampleAt(
  frames: readonly AnimationFrame[],
  timeline: Timeline,
  timeMs: number,
): SampledFrame {
  const last = frames.length - 1;
  const t = Number.isFinite(timeMs) ? Math.max(0, timeMs) : 0;

  if (t >= timeline.totalMs) {
    return {
      frame: toTacticFrame(frames[last]),
      sourceFrameId: frames[last].id,
      phase: "end",
      progress: 1,
    };
  }

  const i = segmentIndexAt(timeline, t);
  const source = frames[i];
  const moveStart = timeline.starts[i] + timeline.holds[i];

  if (i === last || t < moveStart) {
    return {
      frame: toTacticFrame(source),
      sourceFrameId: source.id,
      targetFrameId: i === last ? undefined : frames[i + 1].id,
      phase: "hold",
      progress: 0,
    };
  }

  const target = frames[i + 1];
  const u = Math.min(1, Math.max(0, (t - moveStart) / timeline.durations[i]));
  const p = ease(u, source.easing);
  const frame = toTacticFrame(source);
  return {
    frame: {
      ...frame,
      players: interpolate(source, source.players, target.players, p),
      balls: interpolate(source, source.balls, target.balls, p),
    },
    sourceFrameId: source.id,
    targetFrameId: target.id,
    phase: "move",
    progress: u,
  };
}

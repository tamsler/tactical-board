import type { AnimationFrame } from "./model";

type Timing = Pick<AnimationFrame, "holdMs" | "durationMs">;

export interface Timeline {
  /** Start of each frame's hold. Strictly increasing because durations are >= 100 ms. */
  starts: number[];
  holds: number[];
  durations: number[];
  totalMs: number;
}

export function compileTimeline(frames: readonly Timing[]): Timeline {
  const starts: number[] = [];
  let t = 0;
  frames.forEach((f, i) => {
    starts.push(t);
    t += f.holdMs;
    if (i < frames.length - 1) t += f.durationMs;
  });
  return {
    starts,
    holds: frames.map((f) => f.holdMs),
    durations: frames.map((f) => f.durationMs),
    totalMs: t,
  };
}

export function totalDurationMs(frames: readonly Timing[]): number {
  return compileTimeline(frames).totalMs;
}

/** Index of the last frame whose start is <= time (half-open segments). */
export function segmentIndexAt(timeline: Timeline, timeMs: number): number {
  const { starts } = timeline;
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid] <= timeMs) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

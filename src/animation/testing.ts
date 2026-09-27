import type { PlaybackClock } from "./playback";

/** Deterministic clock for tests: time only moves when `advance` is called. */
export function createFakeClock() {
  let now = 0;
  let nextHandle = 1;
  const callbacks = new Map<number, (ts: number) => void>();
  const clock: PlaybackClock = {
    now: () => now,
    requestFrame: (cb) => {
      callbacks.set(nextHandle, cb);
      return nextHandle++;
    },
    cancelFrame: (h) => {
      callbacks.delete(h);
    },
  };
  return {
    clock,
    pending: () => callbacks.size,
    /** Advances the clock and runs one animation frame. */
    advance(ms: number) {
      now += ms;
      const due = [...callbacks.values()];
      callbacks.clear();
      due.forEach((cb) => cb(now));
    },
  };
}

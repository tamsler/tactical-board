import type { PlaybackRate, PlaybackState } from "./model";

export interface PlaybackClock {
  now(): number;
  requestFrame(callback: (timestampMs: number) => void): number;
  cancelFrame(handle: number): void;
}

export const browserClock: PlaybackClock = {
  now: () => performance.now(),
  requestFrame: (cb) => requestAnimationFrame(cb),
  cancelFrame: (handle) => cancelAnimationFrame(handle),
};

/**
 * Single-clock playback. Time is derived from the frame timestamp
 * (`anchorTimeline + (now - anchorClock) * rate`), never accumulated per tick.
 * `subscribe`/`getSnapshot` are compatible with `useSyncExternalStore`.
 */
export class PlaybackController {
  private state: PlaybackState;
  private totalMs: number;
  private readonly clock: PlaybackClock;
  private anchorTimelineMs = 0;
  private anchorClockMs = 0;
  private handle: number | null = null;
  private readonly listeners = new Set<() => void>();

  constructor(
    totalMs: number,
    clock: PlaybackClock = browserClock,
    options: { rate?: PlaybackRate; loop?: boolean } = {},
  ) {
    this.totalMs = Math.max(0, totalMs);
    this.clock = clock;
    this.state = {
      status: "paused",
      timeMs: 0,
      rate: options.rate ?? 1,
      loop: options.loop ?? false,
    };
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): PlaybackState => this.state;

  play(): void {
    if (this.state.status === "playing" || this.totalMs <= 0) return;
    const start = this.state.timeMs >= this.totalMs ? 0 : this.state.timeMs;
    this.anchor(start, this.clock.now());
    this.set({ status: "playing", timeMs: start });
    this.schedule();
  }

  pause(): void {
    if (this.state.status !== "playing") return;
    const t = this.timeAt(this.clock.now());
    this.cancel();
    this.set({ status: "paused", timeMs: t });
  }

  seek(timeMs: number): void {
    const t = this.clamp(timeMs);
    if (this.state.status === "playing") this.anchor(t, this.clock.now());
    this.set({ timeMs: t });
  }

  setRate(rate: PlaybackRate): void {
    if (rate === this.state.rate) return;
    if (this.state.status === "playing") {
      const now = this.clock.now();
      const t = this.timeAt(now);
      this.anchor(t, now);
      this.set({ rate, timeMs: t });
    } else {
      this.set({ rate });
    }
  }

  setLoop(loop: boolean): void {
    if (loop !== this.state.loop) this.set({ loop });
  }

  /** Call after committed sequence edits change the total duration. */
  setTotal(totalMs: number): void {
    this.totalMs = Math.max(0, totalMs);
    if (this.totalMs === 0) this.pause();
    if (this.state.timeMs > this.totalMs) this.seek(this.totalMs);
  }

  dispose(): void {
    this.cancel();
    this.listeners.clear();
  }

  private tick = (timestampMs: number): void => {
    this.handle = null;
    if (this.state.status !== "playing") return;
    let t = this.timeAt(timestampMs);
    if (t >= this.totalMs) {
      if (!this.state.loop) {
        this.set({ status: "paused", timeMs: this.totalMs });
        return;
      }
      t %= this.totalMs;
      this.anchor(t, timestampMs);
    }
    this.set({ timeMs: t });
    this.schedule();
  };

  private timeAt(clockMs: number): number {
    // rAF timestamps can precede the clock reading taken when play() anchored.
    const elapsed = Math.max(0, clockMs - this.anchorClockMs);
    return this.anchorTimelineMs + elapsed * this.state.rate;
  }

  private anchor(timelineMs: number, clockMs: number): void {
    this.anchorTimelineMs = timelineMs;
    this.anchorClockMs = clockMs;
  }

  private clamp(timeMs: number): number {
    if (!Number.isFinite(timeMs)) return 0;
    return Math.min(this.totalMs, Math.max(0, timeMs));
  }

  private schedule(): void {
    if (this.handle === null) this.handle = this.clock.requestFrame(this.tick);
  }

  private cancel(): void {
    if (this.handle !== null) {
      this.clock.cancelFrame(this.handle);
      this.handle = null;
    }
  }

  private set(patch: Partial<PlaybackState>): void {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l());
  }
}

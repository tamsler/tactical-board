import { describe, it, expect } from "vitest";
import { PlaybackController } from "./playback";
import { createFakeClock as fakeClock } from "./testing";

describe("PlaybackController", () => {
  it("derives time from the clock and stops at the end without looping", () => {
    const c = fakeClock();
    const p = new PlaybackController(1000, c.clock);
    p.play();
    c.advance(400);
    expect(p.getSnapshot()).toMatchObject({ status: "playing", timeMs: 400 });
    c.advance(700);
    expect(p.getSnapshot()).toMatchObject({ status: "paused", timeMs: 1000 });
    expect(c.pending()).toBe(0);
  });

  it("does not jump across pause and resume (A6)", () => {
    const c = fakeClock();
    const p = new PlaybackController(5000, c.clock);
    p.play();
    c.advance(300);
    p.pause();
    c.advance(10_000);
    expect(p.getSnapshot().timeMs).toBe(300);
    p.play();
    c.advance(100);
    expect(p.getSnapshot().timeMs).toBe(400);
  });

  it("covers two seconds of timeline per second at 2x and preserves pose on rate change (A6)", () => {
    const c = fakeClock();
    const p = new PlaybackController(10_000, c.clock);
    p.play();
    c.advance(500);
    p.setRate(2);
    expect(p.getSnapshot().timeMs).toBe(500);
    c.advance(1000);
    expect(p.getSnapshot().timeMs).toBe(2500);
  });

  it("seeks while playing and while paused", () => {
    const c = fakeClock();
    const p = new PlaybackController(2000, c.clock);
    p.seek(1500);
    expect(p.getSnapshot().timeMs).toBe(1500);
    p.seek(-10);
    expect(p.getSnapshot().timeMs).toBe(0);
    p.play();
    c.advance(100);
    p.seek(1000);
    c.advance(100);
    expect(p.getSnapshot().timeMs).toBe(1100);
  });

  it("wraps when looping", () => {
    const c = fakeClock();
    const p = new PlaybackController(1000, c.clock, { loop: true });
    p.play();
    c.advance(1250);
    expect(p.getSnapshot()).toMatchObject({ status: "playing", timeMs: 250 });
    c.advance(100);
    expect(p.getSnapshot().timeMs).toBe(350);
  });

  it("restarts from zero when played at the end, and ignores zero-length sequences", () => {
    const c = fakeClock();
    const p = new PlaybackController(1000, c.clock);
    p.seek(1000);
    p.play();
    expect(p.getSnapshot().timeMs).toBe(0);
    const empty = new PlaybackController(0, c.clock);
    empty.play();
    expect(empty.getSnapshot().status).toBe("paused");
  });

  it("keeps a single scheduled callback and cancels it on dispose (A11)", () => {
    const c = fakeClock();
    const p = new PlaybackController(5000, c.clock);
    p.play();
    p.pause();
    p.play();
    expect(c.pending()).toBe(1);
    p.dispose();
    expect(c.pending()).toBe(0);
  });

  it("returns a stable snapshot between changes and notifies subscribers", () => {
    const c = fakeClock();
    const p = new PlaybackController(1000, c.clock);
    let calls = 0;
    const unsubscribe = p.subscribe(() => calls++);
    const before = p.getSnapshot();
    expect(p.getSnapshot()).toBe(before);
    p.setLoop(true);
    expect(p.getSnapshot()).not.toBe(before);
    expect(calls).toBe(1);
    unsubscribe();
    p.setLoop(false);
    expect(calls).toBe(1);
  });

  it("clamps the playhead when the sequence gets shorter", () => {
    const c = fakeClock();
    const p = new PlaybackController(3000, c.clock);
    p.seek(2500);
    p.setTotal(1000);
    expect(p.getSnapshot().timeMs).toBe(1000);
  });
});

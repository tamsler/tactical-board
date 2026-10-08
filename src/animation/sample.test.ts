import { describe, it, expect } from "vitest";
import type { AnimationFrame } from "./model";
import { pointAtLength } from "./path";
import { compileTimeline, segmentIndexAt } from "./timeline";
import { sampleAt } from "./sample";

function frame(
  id: string,
  ball: { x: number; y: number },
  timing: Partial<Pick<AnimationFrame, "holdMs" | "durationMs">> = {},
  playerX = 100,
): AnimationFrame {
  return {
    id,
    title: "",
    players: [
      {
        id: "p1",
        team: "A",
        number: "8",
        x: playerX,
        y: 300,
        color: "#f00",
        textColor: "#fff",
        facingAngle: id === "f1" ? 0 : 90,
      },
      {
        id: "p2",
        team: "B",
        number: "4",
        x: 700,
        y: 200,
        color: "#00f",
        textColor: "#fff",
      },
    ],
    balls: [{ id: "b1", ...ball }],
    equipments: [],
    lines: [],
    shapes: [],
    texts: [
      { id: `t-${id}`, x: 0, y: 0, text: id, fontSize: 12, color: "#fff" },
    ],
    holdMs: timing.holdMs ?? 0,
    durationMs: timing.durationMs ?? 1000,
  };
}

describe("compileTimeline", () => {
  it("adds holds and outgoing durations, ignoring the last frame's duration (A4)", () => {
    const frames = [
      frame("f1", { x: 0, y: 0 }, { holdMs: 500, durationMs: 1000 }),
      frame("f2", { x: 0, y: 0 }, { holdMs: 250, durationMs: 9000 }),
    ];
    const t = compileTimeline(frames);
    expect(t.starts).toEqual([0, 1500]);
    expect(t.totalMs).toBe(1750);
  });

  it("finds segments with half-open intervals", () => {
    const t = compileTimeline([
      frame("f1", { x: 0, y: 0 }),
      frame("f2", { x: 0, y: 0 }),
      frame("f3", { x: 0, y: 0 }),
    ]);
    expect(segmentIndexAt(t, 0)).toBe(0);
    expect(segmentIndexAt(t, 999.9)).toBe(0);
    expect(segmentIndexAt(t, 1000)).toBe(1);
    expect(segmentIndexAt(t, 2000)).toBe(2);
  });
});

describe("sampleAt", () => {
  const pass = [
    frame("f1", { x: 200, y: 340 }),
    frame("f2", { x: 800, y: 340 }, {}, 300),
  ];
  const timeline = compileTimeline(pass);

  it("interpolates a pass linearly (A3)", () => {
    const s = sampleAt(pass, timeline, 500);
    expect(s.phase).toBe("move");
    expect(s.progress).toBe(0.5);
    expect(s.frame.balls[0]).toMatchObject({ x: 500, y: 340 });
    expect(s.frame.players[0].x).toBe(200);
  });

  it("keeps unmoved entities stationary and returns the same object (A8)", () => {
    const s = sampleAt(pass, timeline, 500);
    expect(s.frame.players[1]).toBe(pass[0].players[1]);
  });

  it("shows source annotations and pose properties during a move", () => {
    const s = sampleAt(pass, timeline, 500);
    expect(s.frame.texts[0].text).toBe("f1");
    expect(s.frame.players[0].facingAngle).toBe(0);
  });

  it("returns the destination pose exactly at the boundary and after the end", () => {
    const end = sampleAt(pass, timeline, 1000);
    expect(end.phase).toBe("end");
    expect(end.frame.balls[0]).toBe(pass[1].balls[0]);
    expect(end.frame.texts[0].text).toBe("f2");
    expect(sampleAt(pass, timeline, 5000).frame.balls[0].x).toBe(800);
  });

  it("clamps negative and non-finite time to the first pose", () => {
    expect(sampleAt(pass, timeline, -50).frame.balls[0].x).toBe(200);
    expect(sampleAt(pass, timeline, Number.NaN).frame.balls[0].x).toBe(200);
  });

  it("honours holds at both ends (A4)", () => {
    const frames = [
      frame("f1", { x: 0, y: 0 }, { holdMs: 500, durationMs: 1000 }),
      frame("f2", { x: 1000, y: 0 }, { holdMs: 250 }),
    ];
    const t = compileTimeline(frames);
    expect(sampleAt(frames, t, 499).phase).toBe("hold");
    expect(sampleAt(frames, t, 499).frame.balls[0].x).toBe(0);
    expect(sampleAt(frames, t, 500).phase).toBe("move");
    expect(sampleAt(frames, t, 1000).frame.balls[0].x).toBe(500);
    const finalHold = sampleAt(frames, t, 1500);
    expect(finalHold.phase).toBe("hold");
    expect(finalHold.sourceFrameId).toBe("f2");
    expect(finalHold.targetFrameId).toBeUndefined();
    expect(sampleAt(frames, t, 1750).phase).toBe("end");
  });

  it("handles a single frame with zero total duration (A8)", () => {
    const single = [frame("f1", { x: 10, y: 20 })];
    const t = compileTimeline(single);
    expect(t.totalMs).toBe(0);
    const s = sampleAt(single, t, 0);
    expect(s.frame.balls[0]).toMatchObject({ x: 10, y: 20 });
    expect(Number.isNaN(s.progress)).toBe(false);
  });

  it("is deterministic for any seek time (A5)", () => {
    const a = sampleAt(pass, timeline, 700);
    const b = sampleAt(pass, compileTimeline(pass), 700);
    expect(a.frame.balls[0].x).toBeCloseTo(b.frame.balls[0].x, 9);
    expect(a.frame.balls[0].x).toBeCloseTo(620, 9);
  });

  it("interpolates multiple balls independently", () => {
    const f1 = frame("f1", { x: 0, y: 0 });
    const f2 = frame("f2", { x: 100, y: 0 });
    f1.balls = [...f1.balls, { id: "b2", x: 0, y: 100 }];
    f2.balls = [...f2.balls, { id: "b2", x: 0, y: 300 }];
    const s = sampleAt([f1, f2], compileTimeline([f1, f2]), 250);
    expect(s.frame.balls.map((b) => [b.x, b.y])).toEqual([
      [25, 0],
      [0, 150],
    ]);
  });

  it("follows a curved path and lands exactly on the target", () => {
    const f1 = {
      ...frame("f1", { x: 0, y: 0 }),
      paths: { b1: { x: 200, y: 200 } },
    };
    const f2 = frame("f2", { x: 400, y: 0 });
    const timeline = compileTimeline([f1, f2]);
    const mid = sampleAt([f1, f2], timeline, 500).frame.balls[0];
    expect(mid.x).toBeCloseTo(200, 3);
    expect(mid.y).toBeCloseTo(100, 3);
    expect(sampleAt([f1, f2], timeline, 1000).frame.balls[0]).toMatchObject({
      x: 400,
      y: 0,
    });
    // Straight entities in the same move are unaffected.
    expect(sampleAt([f1, f2], timeline, 500).frame.players[0].x).toBe(100);
  });

  describe("easing", () => {
    // p1 runs x 100 → 500 while the ball goes 0 → 800 and p2 stays put.
    const run = (easing?: AnimationFrame["easing"]) => {
      const f1 = { ...frame("f1", { x: 0, y: 0 }), easing };
      const f2 = frame("f2", { x: 800, y: 0 }, {}, 500);
      const frames = [f1, f2];
      return { frames, timeline: compileTimeline(frames) };
    };
    const playerX = (easing: AnimationFrame["easing"], t: number) => {
      const { frames, timeline } = run(easing);
      return sampleAt(frames, timeline, t).frame.players[0].x;
    };

    it("moves at steady speed when linear or unset", () => {
      expect(playerX("linear", 250)).toBe(200);
      expect(playerX(undefined, 250)).toBe(200);
    });

    it("follows 6u⁵ − 15u⁴ + 10u³ when easeInOut", () => {
      expect(playerX("easeInOut", 250)).toBe(141.40625);
      expect(playerX("easeInOut", 500)).toBe(300);
      expect(playerX("easeInOut", 750)).toBe(458.59375);
    });

    it("keeps the timeline and reports progress as the time fraction", () => {
      const eased = run("easeInOut");
      expect(eased.timeline).toEqual(run().timeline);
      expect(sampleAt(eased.frames, eased.timeline, 250).progress).toBe(0.25);
    });

    it("starts and ends exactly on the stored poses", () => {
      const { frames, timeline } = run("easeInOut");
      expect(sampleAt(frames, timeline, 0).frame.players[0].x).toBe(100);
      const end = sampleAt(frames, timeline, 1000).frame;
      expect(end.players[0].x).toBe(500);
      expect(end.balls[0]).toMatchObject({ x: 800, y: 0 });
    });

    it("leaves an entity that does not move exactly where it is", () => {
      const { frames, timeline } = run("easeInOut");
      for (const t of [1, 250, 500, 999]) {
        expect(sampleAt(frames, timeline, t).frame.players[1]).toBe(
          frames[0].players[1],
        );
      }
    });

    it("applies one easing to every player and ball in the move", () => {
      const { frames, timeline } = run("easeInOut");
      const s = sampleAt(frames, timeline, 250).frame;
      expect((s.players[0].x - 100) / 400).toBe(0.103515625);
      expect(s.balls[0].x / 800).toBe(0.103515625);
      // Pose properties still switch at the destination, not part-way.
      expect(s.players[0].facingAngle).toBe(0);
    });

    it("eases along the length of a curved path", () => {
      const control = { x: 200, y: 200 };
      const f1 = {
        ...frame("f1", { x: 0, y: 0 }),
        paths: { b1: control },
        easing: "easeInOut" as const,
      };
      const f2 = frame("f2", { x: 400, y: 0 });
      const timeline = compileTimeline([f1, f2]);
      const from = { x: 0, y: 0 };
      const to = { x: 400, y: 0 };
      // pointAtLength takes a fraction of the curve's length.
      const ballAt = (t: number) =>
        sampleAt([f1, f2], timeline, t).frame.balls[0];
      expect(ballAt(250)).toEqual({
        id: "b1",
        ...pointAtLength(from, control, to, 0.103515625),
      });
      expect(ballAt(500)).toEqual({
        id: "b1",
        ...pointAtLength(from, control, to, 0.5),
      });
      expect(ballAt(250)).not.toEqual(ballAt(500));
    });

    it("samples a sequence without easing exactly as before", () => {
      const { frames, timeline } = run();
      for (const t of [0, 100, 333, 500, 900, 1000]) {
        const s = sampleAt(frames, timeline, t).frame;
        const u = Math.min(1, t / 1000);
        if (t < 1000) expect(s.players[0].x).toBe(100 + 400 * u);
        expect(s.balls[0].x).toBe(800 * u);
      }
    });
  });
});

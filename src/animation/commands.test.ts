import { describe, it, expect } from "vitest";
import type { BoardState } from "../hooks/useTacticsState";
import {
  applyBoardEdit,
  assignFormationSlots,
  boardFromSequence,
  copyEquipmentToAllFrames,
  deleteFrame,
  equipmentCopyCount,
  duplicateFrame,
  moveFrame,
  removeEquipmentFromAllFrames,
  sequenceFromBoard,
  setFrameEasing,
  setFrameTiming,
  setPathControl,
} from "./commands";
import { LIMITS } from "./model";
import { checkFrames } from "./validate";

const board: BoardState = {
  title: "Build-up",
  notes: "Notes",
  players: [
    {
      id: "p1",
      team: "A",
      number: "6",
      x: 100,
      y: 100,
      color: "#f00",
      textColor: "#fff",
    },
    {
      id: "p2",
      team: "A",
      number: "8",
      x: 200,
      y: 100,
      color: "#f00",
      textColor: "#fff",
    },
  ],
  balls: [{ id: "b1", x: 100, y: 110, size: 11 }],
  equipments: [{ id: "e1", type: "cone-orange", x: 5, y: 5 }],
  lines: [],
  shapes: [],
  texts: [],
};

function threeFrames() {
  let seq = sequenceFromBoard(board);
  const ids = [seq.frames[0].id];
  for (let i = 0; i < 2; i++) {
    const r = duplicateFrame(seq, ids[ids.length - 1])!;
    seq = r.seq;
    ids.push(r.frameId);
  }
  return { seq, ids };
}

describe("frame commands", () => {
  it("converts a static board into Frame 1 without changing it (A1)", () => {
    const seq = sequenceFromBoard(board);
    expect(seq.frames).toHaveLength(1);
    expect(boardFromSequence(seq, seq.frames[0].id)).toEqual(board);
  });

  it("duplicates after the selected frame with a new id and the same entity ids", () => {
    const seq = sequenceFromBoard(board);
    const { seq: next, frameId } = duplicateFrame(seq, seq.frames[0].id)!;
    expect(next.frames.map((f) => f.id)).toEqual([seq.frames[0].id, frameId]);
    expect(frameId).not.toBe(seq.frames[0].id);
    expect(next.frames[1].players.map((p) => p.id)).toEqual(["p1", "p2"]);
    expect(next.frames[1].title).toBe("");
  });

  it("edits positions in the selected frame only (A2)", () => {
    const { seq, ids } = threeFrames();
    const prev = boardFromSequence(seq, ids[1]);
    const next = {
      ...prev,
      players: prev.players.map((p) =>
        p.id === "p2" ? { ...p, x: 500, facingAngle: 45 } : p,
      ),
      equipments: [],
    };
    const edited = applyBoardEdit(seq, ids[1], prev, next);
    expect(edited.frames[1].players[1]).toMatchObject({
      x: 500,
      facingAngle: 45,
    });
    expect(edited.frames[0]).toBe(seq.frames[0]);
    expect(edited.frames[2]).toBe(seq.frames[2]);
  });

  it("propagates sequence-wide properties but not pose", () => {
    const { seq, ids } = threeFrames();
    const prev = boardFromSequence(seq, ids[1]);
    const next = {
      ...prev,
      players: prev.players.map((p) =>
        p.id === "p1" ? { ...p, x: 900, name: "Rodri", color: "#0f0" } : p,
      ),
    };
    const edited = applyBoardEdit(seq, ids[1], prev, next);
    expect(edited.frames[0].players[0]).toMatchObject({
      x: 100,
      name: "Rodri",
      color: "#0f0",
    });
    expect(edited.frames[2].players[0]).toMatchObject({
      x: 100,
      name: "Rodri",
    });
    expect(checkFrames(edited.frames).ok).toBe(true);
  });

  it("adds and removes players and balls in every frame (A13)", () => {
    const { seq, ids } = threeFrames();
    const prev = boardFromSequence(seq, ids[2]);
    const next = {
      ...prev,
      players: [
        prev.players[1],
        {
          id: "p3",
          team: "B" as const,
          number: "9",
          x: 50,
          y: 60,
          color: "#00f",
          textColor: "#fff",
        },
      ],
      balls: [...prev.balls, { id: "b2", x: 1, y: 2 }],
    };
    const edited = applyBoardEdit(seq, ids[2], prev, next);
    for (const f of edited.frames) {
      expect(f.players.map((p) => p.id).sort()).toEqual(["p2", "p3"]);
      expect(f.balls.map((b) => b.id)).toEqual(["b1", "b2"]);
      expect(f.players.find((p) => p.id === "p3")).toMatchObject({
        x: 50,
        y: 60,
      });
    }
    expect(checkFrames(edited.frames).ok).toBe(true);
  });

  it("keeps static content per frame and the title document-wide", () => {
    const { seq, ids } = threeFrames();
    const prev = boardFromSequence(seq, ids[0]);
    const edited = applyBoardEdit(seq, ids[0], prev, {
      ...prev,
      title: "Press",
      notes: "Frame 1 only",
      equipments: [],
    });
    expect(edited.title).toBe("Press");
    expect(edited.frames[0].notes).toBe("Frame 1 only");
    expect(edited.frames[1].notes).toBe("Notes");
    expect(edited.frames[1].equipments).toHaveLength(1);
  });

  it("deletes a frame and selects its predecessor, or the new first frame", () => {
    const { seq, ids } = threeFrames();
    expect(deleteFrame(seq, ids[1])).toMatchObject({ frameId: ids[0] });
    const first = deleteFrame(seq, ids[0])!;
    expect(first.frameId).toBe(ids[1]);
    expect(first.seq.frames.map((f) => f.id)).toEqual([ids[1], ids[2]]);
    expect(deleteFrame(sequenceFromBoard(board), "x")).toBeNull();
  });

  it("moves frames together with their own timing (A7)", () => {
    const { seq, ids } = threeFrames();
    const timed = setFrameTiming(seq, ids[0], {
      holdMs: 300,
      durationMs: 2000,
    });
    if (!timed.ok) throw new Error(timed.error);
    const moved = moveFrame(timed.value, ids[0], 2);
    expect(moved.frames.map((f) => f.id)).toEqual([ids[1], ids[2], ids[0]]);
    expect(moved.frames[2]).toMatchObject({ holdMs: 300, durationMs: 2000 });
    expect(moveFrame(moved, ids[0], 99)).toBe(moved);
  });

  it("rejects timings outside the limits", () => {
    const seq = sequenceFromBoard(board);
    const id = seq.frames[0].id;
    expect(setFrameTiming(seq, id, { durationMs: 50 }).ok).toBe(false);
    expect(setFrameTiming(seq, id, { durationMs: 30_001 }).ok).toBe(false);
    expect(setFrameTiming(seq, id, { holdMs: -1 }).ok).toBe(false);
    expect(setFrameTiming(seq, id, { holdMs: 1.5 }).ok).toBe(false);
    expect(setFrameTiming(seq, id, { holdMs: 0, durationMs: 100 }).ok).toBe(
      true,
    );
  });
});

describe("easing", () => {
  it("sets easeInOut on one frame and stores nothing for linear", () => {
    const { seq, ids } = threeFrames();
    const eased = setFrameEasing(seq, ids[1], "easeInOut");
    expect(eased.frames.map((f) => f.easing)).toEqual([
      undefined,
      "easeInOut",
      undefined,
    ]);
    const back = setFrameEasing(eased, ids[1], "linear");
    expect("easing" in back.frames[1]).toBe(false);
    expect(back).toEqual(seq);
  });

  it("returns the same sequence when nothing changes", () => {
    const { seq, ids } = threeFrames();
    expect(setFrameEasing(seq, ids[0], "linear")).toBe(seq);
    const eased = setFrameEasing(seq, ids[0], "easeInOut");
    expect(setFrameEasing(eased, ids[0], "easeInOut")).toBe(eased);
  });

  it("copies the easing to a duplicate and leaves the source's in place", () => {
    const { seq, ids } = threeFrames();
    const eased = setFrameEasing(seq, ids[0], "easeInOut");
    const { seq: next, frameId } = duplicateFrame(eased, ids[0])!;
    expect(next.frames.map((f) => [f.id, f.easing])).toEqual([
      [ids[0], "easeInOut"],
      [frameId, "easeInOut"],
      [ids[1], undefined],
      [ids[2], undefined],
    ]);
  });

  it("stays with its frame through reorder, delete and timing changes", () => {
    const { seq, ids } = threeFrames();
    const eased = setFrameEasing(seq, ids[0], "easeInOut");

    const moved = moveFrame(eased, ids[0], 1);
    expect(moved.frames.map((f) => [f.id, f.easing])).toEqual([
      [ids[1], undefined],
      [ids[0], "easeInOut"],
      [ids[2], undefined],
    ]);

    const deleted = deleteFrame(eased, ids[1])!;
    expect(deleted.seq.frames.map((f) => f.easing)).toEqual([
      "easeInOut",
      undefined,
    ]);

    const timed = setFrameTiming(eased, ids[0], { durationMs: 2000 });
    expect(timed.ok && timed.value.frames[0]).toMatchObject({
      durationMs: 2000,
      easing: "easeInOut",
    });
  });
});

describe("curved paths", () => {
  const bend = { x: 150, y: 300 };

  it("sets and clears a curve on a frame's outgoing move", () => {
    const { seq, ids } = threeFrames();
    const curved = setPathControl(seq, ids[0], "p1", bend);
    expect(curved.frames[0].paths).toEqual({ p1: bend });
    expect(
      setPathControl(curved, ids[0], "p1", null).frames[0].paths,
    ).toBeUndefined();
  });

  it("ignores unknown entities and the last frame", () => {
    const { seq, ids } = threeFrames();
    expect(setPathControl(seq, ids[0], "nope", bend)).toBe(seq);
    expect(setPathControl(seq, ids[2], "p1", bend)).toBe(seq);
  });

  it("moves curves to the copy when duplicating the source frame", () => {
    const { seq, ids } = threeFrames();
    const curved = setPathControl(seq, ids[1], "p1", bend);
    const { seq: next } = duplicateFrame(curved, ids[1])!;
    expect(next.frames[1].paths).toBeUndefined();
    expect(next.frames[2].paths).toEqual({ p1: bend });
  });

  it("drops curves whose target frame changes on delete or reorder", () => {
    const { seq, ids } = threeFrames();
    const curved = setPathControl(
      setPathControl(seq, ids[0], "p1", bend),
      ids[1],
      "p2",
      bend,
    );
    const deleted = deleteFrame(curved, ids[1])!.seq;
    expect(deleted.frames[0].paths).toBeUndefined();

    const moved = moveFrame(curved, ids[2], 1);
    expect(moved.frames.map((f) => f.paths)).toEqual([
      undefined,
      undefined,
      undefined,
    ]);
  });

  it("removes curves for players removed from the board", () => {
    const { seq, ids } = threeFrames();
    const curved = setPathControl(seq, ids[0], "p1", bend);
    const prev = boardFromSequence(curved, ids[1]);
    const edited = applyBoardEdit(curved, ids[1], prev, {
      ...prev,
      players: prev.players.filter((p) => p.id !== "p1"),
    });
    expect(edited.frames[0].paths).toBeUndefined();
    expect(checkFrames(edited.frames).ok).toBe(true);
  });
});

describe("assignFormationSlots", () => {
  const players = [
    {
      id: "a",
      team: "A" as const,
      number: "5",
      x: 0,
      y: 0,
      color: "",
      textColor: "",
    },
    {
      id: "gk",
      team: "A" as const,
      number: "1",
      x: 0,
      y: 0,
      color: "",
      textColor: "",
      isGoalkeeper: true,
    },
    {
      id: "b",
      team: "A" as const,
      number: "7",
      x: 0,
      y: 0,
      color: "",
      textColor: "",
    },
  ];

  it("places goalkeepers first, then field players in order, keeping ids", () => {
    const result = assignFormationSlots(players, [
      { x: 10, y: 10 },
      { x: 1, y: 1, isGoalkeeper: true },
      { x: 20, y: 20 },
    ])!;
    expect(result.map((p) => [p.id, p.x])).toEqual([
      ["gk", 1],
      ["a", 10],
      ["b", 20],
    ]);
    expect(result[1].number).toBe("5");
  });

  it("rejects a player-count mismatch", () => {
    expect(assignFormationSlots(players, [{ x: 1, y: 1 }])).toBeNull();
  });
});

describe("equipment across frames", () => {
  const goal = { id: "g1", type: "mini-goal", x: 50, y: 60 } as const;

  function withGoalInFrame(frameIndex: number) {
    const { seq, ids } = threeFrames();
    const prev = boardFromSequence(seq, ids[frameIndex]);
    const next = applyBoardEdit(seq, ids[frameIndex], prev, {
      ...prev,
      equipments: [...prev.equipments, goal],
    });
    return { seq: next, ids };
  }

  it("keeps new equipment in its own frame", () => {
    const { seq, ids } = withGoalInFrame(0);
    expect(equipmentCopyCount(seq, ids[0], "g1")).toBe(1);
  });

  it("copies an item into every frame in one command", () => {
    const { seq, ids } = withGoalInFrame(0);
    const next = copyEquipmentToAllFrames(seq, ids[0], "g1")!;
    for (const f of next.frames) {
      expect(f.equipments.filter((e) => e.id === "g1")).toEqual([goal]);
    }
    expect(equipmentCopyCount(next, ids[0], "g1")).toBe(3);
    expect(checkFrames(next.frames).ok).toBe(true);
  });

  it("overwrites a moved copy and leaves other equipment alone", () => {
    const { seq, ids } = threeFrames();
    const prev = boardFromSequence(seq, ids[2]);
    const moved = applyBoardEdit(seq, ids[2], prev, {
      ...prev,
      equipments: [{ ...prev.equipments[0], x: 99 }],
    });
    expect(equipmentCopyCount(moved, ids[0], "e1")).toBe(2);
    const next = copyEquipmentToAllFrames(moved, ids[0], "e1")!;
    expect(next.frames[2].equipments).toEqual([board.equipments[0]]);
  });

  it("returns the same sequence when nothing changes", () => {
    const { seq, ids } = threeFrames();
    expect(copyEquipmentToAllFrames(seq, ids[0], "e1")).toBe(seq);
    expect(copyEquipmentToAllFrames(seq, ids[0], "nope")).toBe(seq);
    expect(removeEquipmentFromAllFrames(seq, "nope")).toBe(seq);
  });

  it("refuses when a frame is at the equipment limit", () => {
    const { seq, ids } = withGoalInFrame(0);
    const full = Array.from(
      { length: LIMITS.maxItemsPerCollection },
      (_, i) => ({ ...goal, id: `c${i}` }),
    );
    const frames = seq.frames.map((f, i) =>
      i === 1 ? { ...f, equipments: full } : f,
    );
    expect(copyEquipmentToAllFrames({ ...seq, frames }, ids[0], "g1")).toBe(
      null,
    );
  });

  it("removes an item from every frame", () => {
    const { seq } = threeFrames();
    const next = removeEquipmentFromAllFrames(seq, "e1");
    for (const f of next.frames) expect(f.equipments).toEqual([]);
  });
});

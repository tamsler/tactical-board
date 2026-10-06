import { describe, it, expect } from "vitest";
import type { BoardState } from "../hooks/useTacticsState";
import { nudgeBoard, nudgeDeltaForKey } from "./nudge";

const key = (k: string, mods: Partial<KeyboardEventInit> = {}) => ({
  key: k,
  shiftKey: false,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  ...mods,
});

const board: BoardState = {
  title: "",
  notes: "",
  players: [
    {
      id: "p1",
      team: "A",
      number: "6",
      x: 300,
      y: 200,
      color: "#f00",
      textColor: "#fff",
    },
    {
      id: "p2",
      team: "A",
      number: "8",
      x: 1045,
      y: 300,
      color: "#f00",
      textColor: "#fff",
    },
  ],
  balls: [
    { id: "b1", x: 525, y: 340, size: 11 },
    { id: "b2", x: 0, y: 340, size: 11 },
  ],
  equipments: [
    { id: "e1", type: "cone-orange", x: 100, y: 100 },
    { id: "e2", type: "cone-orange", x: 1100, y: 300 },
  ],
  lines: [
    {
      id: "l1",
      type: "straight",
      points: [
        { x: 100, y: 100 },
        { x: 200, y: 150 },
      ],
      color: "#fff",
      width: 3,
      style: "solid",
    },
    {
      id: "l2",
      type: "curve",
      points: [
        { x: 100, y: 100 },
        { x: 300, y: 100 },
      ],
      controlPoint: { x: 200, y: 40 },
      color: "#fff",
      width: 3,
      style: "solid",
    },
    {
      id: "l3",
      type: "straight",
      points: [
        { x: 3, y: 100 },
        { x: 200, y: 100 },
      ],
      color: "#fff",
      width: 3,
      style: "solid",
    },
  ],
  shapes: [
    {
      id: "s1",
      type: "rectangle",
      x: 500,
      y: 300,
      width: 120,
      height: 80,
      color: "#fff",
      fillOpacity: 0.2,
      strokeColor: "#fff",
      strokeWidth: 2,
    },
    {
      id: "s2",
      type: "rectangle",
      x: 945,
      y: 300,
      width: 100,
      height: 100,
      color: "#fff",
      fillOpacity: 0.2,
      strokeColor: "#fff",
      strokeWidth: 2,
    },
  ],
  texts: [{ id: "t1", x: 400, y: 300, text: "Press", fontSize: 13, color: "#fff" }],
};

describe("nudgeDeltaForKey", () => {
  it("maps each arrow key to one pitch unit", () => {
    expect(nudgeDeltaForKey(key("ArrowLeft"))).toEqual({ dx: -1, dy: 0 });
    expect(nudgeDeltaForKey(key("ArrowRight"))).toEqual({ dx: 1, dy: 0 });
    expect(nudgeDeltaForKey(key("ArrowUp"))).toEqual({ dx: 0, dy: -1 });
    expect(nudgeDeltaForKey(key("ArrowDown"))).toEqual({ dx: 0, dy: 1 });
  });

  it("moves ten units with Shift", () => {
    expect(nudgeDeltaForKey(key("ArrowLeft", { shiftKey: true }))).toEqual({
      dx: -10,
      dy: 0,
    });
    expect(nudgeDeltaForKey(key("ArrowDown", { shiftKey: true }))).toEqual({
      dx: 0,
      dy: 10,
    });
  });

  it("ignores Ctrl, Cmd and Alt combinations", () => {
    expect(nudgeDeltaForKey(key("ArrowLeft", { ctrlKey: true }))).toBeNull();
    expect(nudgeDeltaForKey(key("ArrowLeft", { metaKey: true }))).toBeNull();
    expect(nudgeDeltaForKey(key("ArrowLeft", { altKey: true }))).toBeNull();
  });

  it("ignores other keys", () => {
    expect(nudgeDeltaForKey(key("a"))).toBeNull();
    expect(nudgeDeltaForKey(key("PageUp"))).toBeNull();
  });
});

describe("nudgeBoard", () => {
  it("moves a player right", () => {
    const next = nudgeBoard(board, "p1", "player", 1, 0);
    expect(next.players[0]).toMatchObject({ x: 301, y: 200 });
  });

  it("moves a ball up", () => {
    const next = nudgeBoard(board, "b1", "ball", 0, -1);
    expect(next.balls[0]).toMatchObject({ x: 525, y: 339 });
  });

  it("moves equipment down", () => {
    const next = nudgeBoard(board, "e1", "equipment", 0, 1);
    expect(next.equipments[0]).toMatchObject({ x: 100, y: 101 });
  });

  it("moves a text left by ten", () => {
    const next = nudgeBoard(board, "t1", "text", -10, 0);
    expect(next.texts[0]).toMatchObject({ x: 390, y: 300 });
  });

  it("leaves every other item untouched", () => {
    const next = nudgeBoard(board, "p1", "player", 1, 0);
    expect(next.players[1]).toBe(board.players[1]);
    expect(next.balls).toBe(board.balls);
    expect(next.equipments).toBe(board.equipments);
    expect(next.lines).toBe(board.lines);
    expect(next.shapes).toBe(board.shapes);
    expect(next.texts).toBe(board.texts);
  });

  it("returns the same board for an unknown id or a zero move", () => {
    expect(nudgeBoard(board, "nope", "player", 1, 0)).toBe(board);
    expect(nudgeBoard(board, "p1", "player", 0, 0)).toBe(board);
  });

  describe("lines and shapes", () => {
    it("moves both ends of a straight line", () => {
      const next = nudgeBoard(board, "l1", "line", 1, 0);
      expect(next.lines[0].points).toEqual([
        { x: 101, y: 100 },
        { x: 201, y: 150 },
      ]);
      expect(next.lines[0].controlPoint).toBeUndefined();
    });

    it("moves a curve with its control point", () => {
      const next = nudgeBoard(board, "l2", "line", 0, 10);
      expect(next.lines[1].points).toEqual([
        { x: 100, y: 110 },
        { x: 300, y: 110 },
      ]);
      expect(next.lines[1].controlPoint).toEqual({ x: 200, y: 50 });
    });

    it("moves a shape without resizing it", () => {
      const next = nudgeBoard(board, "s1", "shape", -1, 0);
      expect(next.shapes[0]).toMatchObject({
        x: 499,
        y: 300,
        width: 120,
        height: 80,
      });
    });
  });

  describe("canvas edges", () => {
    it("shortens a step that would cross the right edge", () => {
      const next = nudgeBoard(board, "p2", "player", 10, 0);
      expect(next.players[1]).toMatchObject({ x: 1050, y: 300 });
    });

    it("does not move an item that is already at the edge", () => {
      expect(nudgeBoard(board, "b2", "ball", -1, 0)).toBe(board);
    });

    it("stops a shape when its far side reaches the edge", () => {
      const next = nudgeBoard(board, "s2", "shape", 10, 0);
      expect(next.shapes[1]).toMatchObject({ x: 950, y: 300 });
    });

    it("stops a line when one end reaches the edge", () => {
      const next = nudgeBoard(board, "l3", "line", -10, 0);
      expect(next.lines[2].points).toEqual([
        { x: 0, y: 100 },
        { x: 197, y: 100 },
      ]);
    });

    it("does not let a curve's control point limit the move", () => {
      const next = nudgeBoard(board, "l2", "line", 0, -100);
      expect(next.lines[1].points[0]).toEqual({ x: 100, y: 0 });
      expect(next.lines[1].controlPoint).toEqual({ x: 200, y: -60 });
    });

    it("lets an item outside the canvas come back in", () => {
      const next = nudgeBoard(board, "e2", "equipment", -10, 0);
      expect(next.equipments[1]).toMatchObject({ x: 1090, y: 300 });
    });

    it("does not move an item outside the canvas further out", () => {
      expect(nudgeBoard(board, "e2", "equipment", 1, 0)).toBe(board);
    });

    it("clamps at the top and bottom edges", () => {
      const top = nudgeBoard(board, "e1", "equipment", 0, -500);
      expect(top.equipments[0]).toMatchObject({ x: 100, y: 0 });
      const bottom = nudgeBoard(board, "e1", "equipment", 0, 900);
      expect(bottom.equipments[0]).toMatchObject({ x: 100, y: 680 });
    });
  });
});

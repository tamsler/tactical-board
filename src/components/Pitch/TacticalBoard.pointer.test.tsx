import { useEffect, useRef } from "react";
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useTacticsState } from "../../hooks/useTacticsState";
import type { ToolType } from "../../types/tactics";
import { TacticalBoard } from "./TacticalBoard";

type Tactics = ReturnType<typeof useTacticsState>;

let tactics: Tactics;
let svg: SVGSVGElement;

function Harness() {
  const current = useTacticsState();
  const boardRef = useRef<SVGSVGElement | null>(null);
  useEffect(() => {
    tactics = current;
    svg = boardRef.current!;
  });
  return <TacticalBoard tactics={current} boardRef={boardRef} />;
}

// jsdom has no layout or SVG geometry. The board is given a 1050 × 680 box at
// the origin, so client coordinates equal pitch units.
beforeAll(() => {
  const svgProto = SVGSVGElement.prototype as unknown as Record<string, unknown>;
  svgProto.createSVGPoint = () => ({ x: 0, y: 0 });
  svgProto.getScreenCTM = () => null;
  vi.spyOn(SVGSVGElement.prototype, "getBoundingClientRect").mockReturnValue({
    left: 0,
    top: 0,
    width: 1050,
    height: 680,
  } as DOMRect);
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
});

afterAll(() => vi.restoreAllMocks());

const at = (x: number, y: number) => ({
  clientX: x,
  clientY: y,
  pointerId: 1,
  button: 0,
});

const down = (target: Element, x: number, y: number) =>
  fireEvent.pointerDown(target, at(x, y));
const move = (x: number, y: number) => fireEvent.pointerMove(svg, at(x, y));
const up = (x: number, y: number) => fireEvent.pointerUp(svg, at(x, y));

const setTool = (tool: ToolType) => act(() => tactics.setActiveTool(tool));

// Gives the first player a number no one else has, so it can be found on the board.
const markFirstPlayer = () => {
  const id = tactics.state.players[0].id;
  act(() => tactics.updatePlayer(id, { number: "77" }));
  const pos = () => {
    const p = tactics.state.players.find((pl) => pl.id === id);
    return p && { x: p.x, y: p.y };
  };
  return { id, pos, element: () => screen.getByText("77") };
};

const pressKey = (key: string) =>
  act(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
  });

describe("TacticalBoard pointer interaction", () => {
  beforeEach(() => {
    localStorage.clear();
    render(<Harness />);
  });

  describe("dragging (C6)", () => {
    it("moves one player and undoes the drag in one step", () => {
      const player = markFirstPlayer();
      const start = player.pos()!;
      const others = tactics.state.players.slice(1);
      act(() => tactics.undo()); // drop the renumbering step
      act(() => tactics.redo());

      down(player.element(), start.x, start.y);
      move(start.x + 20, start.y + 10);
      move(start.x + 40, start.y + 30);
      up(start.x + 40, start.y + 30);

      expect(player.pos()).toEqual({ x: start.x + 40, y: start.y + 30 });
      expect(tactics.state.players.slice(1)).toEqual(others);
      expect(tactics.selectedId).toBe(player.id);

      act(() => tactics.undo());
      expect(player.pos()).toEqual(start);
    });

    it("rounds positions to whole pitch units", () => {
      const player = markFirstPlayer();
      const start = player.pos()!;

      down(player.element(), start.x, start.y);
      move(start.x + 10.4, start.y + 5.6);
      up(start.x + 10.4, start.y + 5.6);

      expect(player.pos()).toEqual({ x: start.x + 10, y: start.y + 6 });
    });

    it("adds no undo step for a click", () => {
      const player = markFirstPlayer();
      const start = player.pos()!;
      act(() => tactics.undo());
      expect(tactics.canUndo).toBe(false);

      const first = tactics.state.players[0];
      down(screen.getAllByText(first.number)[0], start.x, start.y);
      up(start.x, start.y);

      expect(tactics.canUndo).toBe(false);
      expect(tactics.selectedId).toBeTruthy();
    });

    it("restores the position when Escape is pressed mid-drag", () => {
      const player = markFirstPlayer();
      const start = player.pos()!;

      down(player.element(), start.x, start.y);
      move(start.x + 50, start.y);
      expect(player.pos()).toEqual({ x: start.x + 50, y: start.y });

      pressKey("Escape");
      expect(player.pos()).toEqual(start);
      up(start.x + 50, start.y);
      expect(player.pos()).toEqual(start);
      expect(tactics.selectedId).toBeNull();
    });

    it("restores the position on pointer cancel", () => {
      const player = markFirstPlayer();
      const start = player.pos()!;

      down(player.element(), start.x, start.y);
      move(start.x + 50, start.y);
      fireEvent.pointerCancel(svg, at(start.x + 50, start.y));

      expect(player.pos()).toEqual(start);
    });

    it("does not move players during preview", () => {
      const player = markFirstPlayer();
      const start = player.pos()!;
      act(() => tactics.setPreviewing(true));

      down(player.element(), start.x, start.y);
      move(start.x + 50, start.y);
      up(start.x + 50, start.y);

      act(() => tactics.setPreviewing(false));
      expect(player.pos()).toEqual(start);
    });
  });

  describe("drawing (C7)", () => {
    it("creates nothing for a 10-unit drag", () => {
      setTool("line-run");
      down(svg, 400, 300);
      move(410, 300);
      up(410, 300);

      expect(tactics.state.lines).toHaveLength(0);
      expect(tactics.canUndo).toBe(false);
    });

    it("creates one run line for a 20-unit drag, in the current colour and width", () => {
      setTool("line-run");
      act(() => {
        tactics.setDrawingColor("#ff0000");
        tactics.setDrawingWidth(5);
      });
      down(svg, 400, 300);
      move(420, 300);
      up(420, 300);

      expect(tactics.state.lines).toHaveLength(1);
      expect(tactics.state.lines[0]).toMatchObject({
        type: "straight",
        points: [
          { x: 400, y: 300 },
          { x: 420, y: 300 },
        ],
        color: "#ff0000",
        width: 5,
        style: "solid",
        arrowEnd: "arrow",
      });

      act(() => tactics.undo());
      expect(tactics.state.lines).toHaveLength(0);
    });

    it("creates a dashed pass line with the pass tool", () => {
      setTool("line-pass");
      down(svg, 100, 100);
      move(300, 200);
      up(300, 200);

      expect(tactics.state.lines).toHaveLength(1);
      expect(tactics.state.lines[0]).toMatchObject({ style: "dashed" });
    });

    it("creates a zone with the rectangle tool", () => {
      setTool("shape-rect");
      down(svg, 300, 200);
      move(100, 100);
      up(100, 100);

      expect(tactics.state.shapes).toHaveLength(1);
      expect(tactics.state.shapes[0]).toMatchObject({
        type: "rectangle",
        x: 100,
        y: 100,
        width: 200,
        height: 100,
      });
    });

    it("discards a drawing on pointer cancel", () => {
      setTool("line-run");
      down(svg, 400, 300);
      move(500, 300);
      fireEvent.pointerCancel(svg, at(500, 300));
      up(500, 300);

      expect(tactics.state.lines).toHaveLength(0);
    });
  });

  describe("adding items", () => {
    it("adds a Team A player where the pitch is clicked and selects it", () => {
      const before = tactics.state.players.length;
      setTool("add-player-a");
      down(svg, 333, 222);
      up(333, 222);

      expect(tactics.state.players).toHaveLength(before + 1);
      const added = tactics.state.players[before];
      expect(added).toMatchObject({ team: "A", x: 333, y: 222 });
      expect(tactics.selectedId).toBe(added.id);
      expect(tactics.selectedType).toBe("player");
    });

    it("clamps pointer positions to the canvas", () => {
      setTool("add-player-a");
      down(svg, 5000, -40);
      up(5000, -40);

      const added = tactics.state.players.at(-1)!;
      expect(added).toMatchObject({ x: 1050, y: 0 });
    });
  });

  describe("eraser and Delete (C8)", () => {
    it("erases exactly the clicked player, and undo restores it", () => {
      const player = markFirstPlayer();
      const count = tactics.state.players.length;
      const start = player.pos()!;
      setTool("eraser");

      down(player.element(), start.x, start.y);
      up(start.x, start.y);

      expect(tactics.state.players).toHaveLength(count - 1);
      expect(player.pos()).toBeUndefined();

      act(() => tactics.undo());
      expect(tactics.state.players).toHaveLength(count);
      expect(player.pos()).toEqual(start);
    });

    it("deletes the selected player with the Delete key, and undo restores it", () => {
      const player = markFirstPlayer();
      const count = tactics.state.players.length;
      const start = player.pos()!;

      down(player.element(), start.x, start.y);
      up(start.x, start.y);
      pressKey("Delete");

      expect(tactics.state.players).toHaveLength(count - 1);
      expect(tactics.selectedId).toBeNull();

      act(() => tactics.undo());
      expect(player.pos()).toEqual(start);
    });
  });

  describe("visibility (C14)", () => {
    it("hides a team from the board but keeps it in the saved state", () => {
      const player = markFirstPlayer();
      const count = tactics.state.players.length;
      expect(tactics.state.players[0].team).toBe("A");

      act(() => tactics.toggleTeamVisibility("A"));

      expect(screen.queryByText("77")).toBeNull();
      expect(tactics.state.players).toHaveLength(count);
      expect(player.pos()).toBeDefined();
    });
  });
});

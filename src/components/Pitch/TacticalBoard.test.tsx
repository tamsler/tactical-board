import { createRef, useEffect } from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { act, render } from "@testing-library/react";
import { useTacticsState } from "../../hooks/useTacticsState";
import { TacticalBoard } from "./TacticalBoard";

type Tactics = ReturnType<typeof useTacticsState>;

let tactics: Tactics;

function Harness() {
  const current = useTacticsState();
  useEffect(() => {
    tactics = current;
  });
  return (
    <>
      <input aria-label="title" />
      <TacticalBoard tactics={current} boardRef={createRef<SVGSVGElement>()} />
    </>
  );
}

const press = (key: string, init: KeyboardEventInit = {}) => {
  const event = new KeyboardEvent("keydown", {
    key,
    cancelable: true,
    bubbles: true,
    ...init,
  });
  act(() => {
    (document.activeElement ?? window).dispatchEvent(event);
  });
  return event.defaultPrevented;
};

const release = (key: string) =>
  act(() => {
    window.dispatchEvent(new KeyboardEvent("keyup", { key }));
  });

// Selection is set through the hook: jsdom has no SVG geometry, so picking a
// player with pointer events would test the mocks more than the board.
const selectFirstPlayer = () => {
  const id = tactics.state.players[0].id;
  act(() => {
    tactics.setSelectedId(id);
    tactics.setSelectedType("player");
  });
  const pos = () => {
    const p = tactics.state.players.find((pl) => pl.id === id)!;
    return { x: p.x, y: p.y };
  };
  return pos;
};

describe("TacticalBoard arrow-key nudging", () => {
  beforeEach(() => {
    localStorage.clear();
    (document.activeElement as HTMLElement | null)?.blur();
  });

  it("moves the selected player one unit per arrow key", () => {
    render(<Harness />);
    const pos = selectFirstPlayer();
    const start = pos();

    expect(press("ArrowRight")).toBe(true);
    expect(pos()).toEqual({ x: start.x + 1, y: start.y });
    press("ArrowDown");
    expect(pos()).toEqual({ x: start.x + 1, y: start.y + 1 });
    press("ArrowLeft");
    press("ArrowUp");
    expect(pos()).toEqual(start);
  });

  it("moves ten units with Shift", () => {
    render(<Harness />);
    const pos = selectFirstPlayer();
    const start = pos();

    press("ArrowRight", { shiftKey: true });
    expect(pos()).toEqual({ x: start.x + 10, y: start.y });
  });

  it("undoes a held key in one step", () => {
    render(<Harness />);
    const pos = selectFirstPlayer();
    const start = pos();

    press("ArrowRight");
    for (let i = 0; i < 5; i++) press("ArrowRight", { repeat: true });
    release("ArrowRight");
    expect(pos()).toEqual({ x: start.x + 6, y: start.y });

    act(() => tactics.undo());
    expect(pos()).toEqual(start);
    expect(tactics.canUndo).toBe(false);
  });

  it("undoes separate presses one at a time", () => {
    render(<Harness />);
    const pos = selectFirstPlayer();
    const start = pos();

    for (let i = 0; i < 3; i++) {
      press("ArrowRight");
      release("ArrowRight");
    }
    act(() => tactics.undo());
    expect(pos()).toEqual({ x: start.x + 2, y: start.y });
  });

  it("starts a new undo step for a repeat that follows no press", () => {
    render(<Harness />);
    const pos = selectFirstPlayer();
    const start = pos();

    press("ArrowRight");
    release("ArrowRight");
    press("ArrowRight", { repeat: true });
    act(() => tactics.undo());
    expect(pos()).toEqual({ x: start.x + 1, y: start.y });
  });

  it("ignores Ctrl, Cmd and Alt combinations", () => {
    render(<Harness />);
    const pos = selectFirstPlayer();
    const start = pos();

    expect(press("ArrowLeft", { altKey: true })).toBe(false);
    expect(press("ArrowLeft", { ctrlKey: true })).toBe(false);
    expect(press("ArrowLeft", { metaKey: true })).toBe(false);
    expect(pos()).toEqual(start);
  });

  it("leaves the arrow keys alone while typing", () => {
    const { getByLabelText } = render(<Harness />);
    const pos = selectFirstPlayer();
    const start = pos();
    getByLabelText("title").focus();

    expect(press("ArrowRight")).toBe(false);
    expect(pos()).toEqual(start);
  });

  it("leaves the arrow keys alone when nothing is selected", () => {
    render(<Harness />);
    const before = tactics.state;

    expect(press("ArrowDown")).toBe(false);
    expect(tactics.state).toBe(before);
    expect(tactics.canUndo).toBe(false);
  });

  it("does not nudge during preview", () => {
    render(<Harness />);
    const pos = selectFirstPlayer();
    const start = pos();
    act(() => tactics.setPreviewing(true));

    press("ArrowRight");
    act(() => tactics.setPreviewing(false));
    expect(pos()).toEqual(start);
  });
});

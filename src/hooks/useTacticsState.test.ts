import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTacticsState } from "./useTacticsState";

describe("useTacticsState", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("initializes with a standard full-pitch 11v11 state", () => {
    const { result } = renderHook(() => useTacticsState());

    expect(result.current.matchFormat).toBe("11v11");
    expect(result.current.pitchType).toBe("full");
    expect(result.current.state.players.length).toBe(22); // 11 Team A + 11 Team B
    expect(result.current.state.balls.length).toBe(1);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it("handles undo and redo actions correctly", () => {
    const { result } = renderHook(() => useTacticsState());

    act(() => {
      result.current.pushState((prev) => ({
        ...prev,
        title: "Corner Kick Setup",
      }));
    });

    expect(result.current.state.title).toBe("Corner Kick Setup");
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);

    // Undo change
    act(() => {
      result.current.undo();
    });

    expect(result.current.state.title).toBe("Match Tactics - 11v11");
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);

    // Redo change
    act(() => {
      result.current.redo();
    });

    expect(result.current.state.title).toBe("Corner Kick Setup");
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it("updates player position and attributes", () => {
    const { result } = renderHook(() => useTacticsState());
    const firstPlayerId = result.current.state.players[0].id;

    act(() => {
      result.current.updatePlayer(firstPlayerId, {
        x: 450,
        y: 300,
        number: "10",
        name: "Playmaker",
      });
    });

    const updated = result.current.state.players.find(
      (p) => p.id === firstPlayerId,
    );
    expect(updated?.x).toBe(450);
    expect(updated?.y).toBe(300);
    expect(updated?.number).toBe("10");
    expect(updated?.name).toBe("Playmaker");
  });

  it("deletes selected element when deleteSelected is invoked", () => {
    const { result } = renderHook(() => useTacticsState());
    const firstPlayerId = result.current.state.players[0].id;
    const initialCount = result.current.state.players.length;

    act(() => {
      result.current.setSelectedId(firstPlayerId);
      result.current.setSelectedType("player");
    });

    act(() => {
      result.current.deleteSelected();
    });

    expect(result.current.state.players.length).toBe(initialCount - 1);
    expect(result.current.selectedId).toBe(null);
    expect(result.current.selectedType).toBe(null);
  });

  it("clears drawing lines and annotations without resetting players", () => {
    const { result } = renderHook(() => useTacticsState());

    act(() => {
      result.current.pushState((prev) => ({
        ...prev,
        lines: [
          {
            id: "line-1",
            type: "pass",
            style: "dashed",
            points: [
              { x: 0, y: 0 },
              { x: 50, y: 50 },
            ],
            color: "#ffffff",
            width: 3,
          },
        ],
      }));
    });

    expect(result.current.state.lines.length).toBe(1);

    act(() => {
      result.current.clearDrawings();
    });

    expect(result.current.state.lines.length).toBe(0);
    expect(result.current.state.players.length).toBeGreaterThan(0);
  });

  it("switches match format to 9v9 with correct player count", () => {
    const { result } = renderHook(() => useTacticsState());

    act(() => {
      result.current.switchFormat("9v9");
    });

    expect(result.current.matchFormat).toBe("9v9");
    expect(result.current.state.players.length).toBe(18); // 9 Team A + 9 Team B
  });

  it("switches match format to 7v7 with correct player count", () => {
    const { result } = renderHook(() => useTacticsState());

    act(() => {
      result.current.switchFormat("7v7");
    });

    expect(result.current.matchFormat).toBe("7v7");
    expect(result.current.state.players.length).toBe(14); // 7 Team A + 7 Team B
  });
});

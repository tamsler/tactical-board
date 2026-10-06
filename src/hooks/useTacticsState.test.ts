import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTacticsState } from "./useTacticsState";
import {
  FORMATIONS_11V11_TEAM_A,
  FORMATIONS_7V7_TEAM_A,
} from "../constants/formations";
import type { Player } from "../types/tactics";

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

  describe("team sides", () => {
    const byName = (players: Player[], team: string, name: string) =>
      players.find((p) => p.team === team && p.name === name);

    it("puts each full-pitch team's right back on its own right", () => {
      const { result } = renderHook(() => useTacticsState());
      const { players } = result.current.state;
      // Team A faces right, so its right is the bottom of the screen; Team B is turned around.
      expect(byName(players, "A", "RB")).toMatchObject({ x: 260, y: 550 });
      expect(byName(players, "B", "RB")).toMatchObject({ x: 800, y: 130 });
    });

    it("keeps Team B's sides when a formation is applied", () => {
      const { result } = renderHook(() => useTacticsState());
      act(() => {
        result.current.loadFormation(FORMATIONS_11V11_TEAM_A[0], "B");
      });
      const { players } = result.current.state;
      expect(byName(players, "B", "RB")).toMatchObject({ x: 790, y: 130 });
      expect(byName(players, "B", "LW")).toMatchObject({ x: 550, y: 550 });
    });

    it("puts the half-pitch team's right back on the left of the screen", () => {
      const { result } = renderHook(() => useTacticsState());
      act(() => result.current.switchPitchType("half"));
      // The team defends the top goal and faces down the screen.
      const seeded = result.current.state.players;
      expect(byName(seeded, "B", "RB")!).toMatchObject({ x: 240, y: 220 });
      expect(byName(seeded, "B", "LB")!).toMatchObject({ x: 810, y: 220 });

      act(() => {
        result.current.loadFormation(FORMATIONS_11V11_TEAM_A[0], "B");
      });
      const applied = result.current.state.players;
      expect(byName(applied, "B", "RB")!.x).toBeLessThan(525);
      expect(byName(applied, "B", "LB")!.x).toBeGreaterThan(525);
    });
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

  it("copies equipment to all frames as one undo step", () => {
    const { result } = renderHook(() => useTacticsState());
    act(() => result.current.addFrame());
    act(() => result.current.addFrame());
    act(() => result.current.selectFrame(result.current.frames[0].id));
    act(() => {
      result.current.pushState((prev) => ({
        ...prev,
        equipments: [{ id: "g1", type: "mini-goal", x: 10, y: 20 }],
      }));
    });
    const hasGoal = () =>
      result.current.frames.map((f) => f.equipments.some((e) => e.id === "g1"));
    expect(hasGoal()).toEqual([true, false, false]);

    act(() => {
      expect(result.current.copyEquipmentToAllFrames("g1")).toBe(true);
    });
    expect(hasGoal()).toEqual([true, true, true]);

    act(() => result.current.undo());
    expect(hasGoal()).toEqual([true, false, false]);

    act(() => result.current.redo());
    act(() => result.current.removeEquipmentFromAllFrames("g1"));
    expect(hasGoal()).toEqual([false, false, false]);
  });

  describe("drag transactions", () => {
    const moveFirstPlayer = (
      result: { current: ReturnType<typeof useTacticsState> },
      x: number,
    ) => {
      const id = result.current.state.players[0].id;
      act(() => {
        result.current.updateDrag((prev) => ({
          ...prev,
          players: prev.players.map((p) => (p.id === id ? { ...p, x } : p)),
        }));
      });
    };

    it("commits a whole drag as one undo step", () => {
      const { result } = renderHook(() => useTacticsState());
      const originalX = result.current.state.players[0].x;

      act(() => result.current.beginDrag());
      moveFirstPlayer(result, 10);
      moveFirstPlayer(result, 20);
      expect(result.current.state.players[0].x).toBe(20);
      expect(result.current.canUndo).toBe(false);
      act(() => result.current.commitDrag());

      expect(result.current.state.players[0].x).toBe(20);
      expect(result.current.canUndo).toBe(true);
      act(() => result.current.undo());
      expect(result.current.state.players[0].x).toBe(originalX);
      expect(result.current.canUndo).toBe(false);
    });

    it("creates no history entry for a click without movement", () => {
      const { result } = renderHook(() => useTacticsState());
      act(() => result.current.beginDrag());
      act(() => result.current.commitDrag());
      expect(result.current.canUndo).toBe(false);
    });

    it("ignores drag updates after switching frames mid-drag", () => {
      const { result } = renderHook(() => useTacticsState());
      const firstFrameId = result.current.selectedFrameId;
      act(() => result.current.addFrame());
      const originalX = result.current.state.players[0].x;
      act(() => result.current.beginDrag());
      act(() => result.current.selectFrame(firstFrameId));
      moveFirstPlayer(result, 10);
      act(() => result.current.commitDrag());
      expect(result.current.frames.map((f) => f.players[0].x)).toEqual([
        originalX,
        originalX,
      ]);
    });

    it("discards a cancelled drag", () => {
      const { result } = renderHook(() => useTacticsState());
      const originalX = result.current.state.players[0].x;
      act(() => result.current.beginDrag());
      moveFirstPlayer(result, 10);
      act(() => result.current.cancelDrag());
      expect(result.current.state.players[0].x).toBe(originalX);
      expect(result.current.canUndo).toBe(false);
    });

    it("does not write to storage while dragging", () => {
      vi.useFakeTimers();
      try {
        const { result } = renderHook(() => useTacticsState());
        act(() => vi.runAllTimers());
        const setItem = vi.spyOn(Storage.prototype, "setItem");
        act(() => result.current.beginDrag());
        for (let x = 0; x < 5; x++) {
          moveFirstPlayer(result, x);
          act(() => vi.advanceTimersByTime(1000));
        }
        expect(setItem).not.toHaveBeenCalled();
        act(() => result.current.commitDrag());
        act(() => vi.advanceTimersByTime(1000));
        expect(setItem).toHaveBeenCalledTimes(1);
        setItem.mockRestore();
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe("persistence", () => {
    it("reloads every frame and the selected frame from v2 storage (A1, A10)", () => {
      vi.useFakeTimers();
      try {
        const first = renderHook(() => useTacticsState());
        act(() => first.result.current.addFrame());
        const { frames, selectedFrameId } = first.result.current;
        act(() => vi.advanceTimersByTime(1000));
        first.unmount();

        const second = renderHook(() => useTacticsState());
        expect(second.result.current.frames).toEqual(frames);
        expect(second.result.current.selectedFrameId).toBe(selectedFrameId);
        expect(second.result.current.isRestoredFromCache).toBe(true);
      } finally {
        vi.useRealTimers();
      }
    });

    it("pauses autosave instead of overwriting unreadable saved data", () => {
      vi.useFakeTimers();
      try {
        localStorage.setItem(
          "tactical_board_saved_state_v2",
          JSON.stringify({ storageVersion: 99 }),
        );
        const { result } = renderHook(() => useTacticsState());
        expect(result.current.storageProblem?.reason).toMatch(/newer/);
        act(() => result.current.addFrame());
        act(() => vi.advanceTimersByTime(1000));
        expect(localStorage.getItem("tactical_board_saved_state_v2")).toBe(
          JSON.stringify({ storageVersion: 99 }),
        );

        act(() => result.current.discardStoredData());
        act(() => vi.advanceTimersByTime(1000));
        const saved = JSON.parse(
          localStorage.getItem("tactical_board_saved_state_v2")!,
        );
        expect(saved.document.frames).toHaveLength(2);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  it("restores a blank board from the cache", () => {
    localStorage.setItem(
      "tactical_board_saved_state_v1",
      JSON.stringify({
        pitchType: "blank",
        boardState: {
          players: [],
          balls: [{ id: "ball-x", x: 10, y: 20 }],
          equipments: [],
          lines: [],
          shapes: [],
          texts: [],
          title: "Rondo",
          notes: "",
        },
      }),
    );
    const { result } = renderHook(() => useTacticsState());
    expect(result.current.isRestoredFromCache).toBe(true);
    expect(result.current.state.title).toBe("Rondo");
    expect(result.current.state.balls).toEqual([
      { id: "ball-x", x: 10, y: 20 },
    ]);
  });

  describe("frames", () => {
    it("edits only the selected frame and undo restores the selection", () => {
      const { result } = renderHook(() => useTacticsState());
      const firstFrameId = result.current.selectedFrameId;
      const playerId = result.current.state.players[0].id;
      const originalX = result.current.state.players[0].x;

      act(() => result.current.addFrame());
      expect(result.current.frames).toHaveLength(2);
      expect(result.current.isAnimated).toBe(true);
      const secondFrameId = result.current.selectedFrameId;
      expect(secondFrameId).not.toBe(firstFrameId);

      act(() => result.current.updatePlayer(playerId, { x: 900 }));
      expect(result.current.state.players[0].x).toBe(900);

      act(() => result.current.selectFrame(firstFrameId));
      expect(result.current.state.players[0].x).toBe(originalX);

      act(() => result.current.undo());
      expect(result.current.selectedFrameId).toBe(secondFrameId);
      expect(result.current.state.players[0].x).toBe(originalX);
    });

    it("adds players to every frame", () => {
      const { result } = renderHook(() => useTacticsState());
      act(() => result.current.addFrame());
      act(() =>
        result.current.pushState((prev) => ({
          ...prev,
          players: [
            ...prev.players,
            {
              id: "new",
              team: "neutral",
              number: "N",
              x: 1,
              y: 2,
              color: "",
              textColor: "",
            },
          ],
        })),
      );
      for (const f of result.current.frames) {
        expect(f.players.some((p) => p.id === "new")).toBe(true);
      }
    });

    it("locks layout changes while animated", () => {
      const { result } = renderHook(() => useTacticsState());
      act(() => result.current.addFrame());
      act(() => result.current.switchFormat("7v7"));
      act(() => result.current.switchPitchType("half"));
      expect(result.current.matchFormat).toBe("11v11");
      expect(result.current.pitchType).toBe("full");
      expect(result.current.state.players).toHaveLength(22);
    });

    it("keeps player ids when applying a formation to an animated board", () => {
      const { result } = renderHook(() => useTacticsState());
      act(() => result.current.addFrame());
      const idsBefore = result.current.state.players.map((p) => p.id).sort();
      let applied = false;
      act(() => {
        applied = result.current.loadFormation(FORMATIONS_11V11_TEAM_A[1], "A");
      });
      expect(applied).toBe(true);
      expect(result.current.state.players.map((p) => p.id).sort()).toEqual(
        idsBefore,
      );
      act(() => {
        applied = result.current.loadFormation(FORMATIONS_7V7_TEAM_A[0], "A");
      });
      expect(applied).toBe(false);
    });

    it("rejects invalid timing with a message", () => {
      const { result } = renderHook(() => useTacticsState());
      const id = result.current.selectedFrameId;
      let error: string | null = null;
      act(() => {
        error = result.current.setFrameTiming(id, { durationMs: 10 });
      });
      expect(error).toMatch(/Duration/);
      expect(result.current.canUndo).toBe(false);
    });

    it("bends a move as one undoable step", () => {
      const { result } = renderHook(() => useTacticsState());
      const firstFrameId = result.current.selectedFrameId;
      act(() => result.current.addFrame());
      const playerId = result.current.state.players[0].id;
      act(() =>
        result.current.setPathControl(firstFrameId, playerId, {
          x: 300,
          y: 50,
        }),
      );
      expect(result.current.frames[0].paths).toEqual({
        [playerId]: { x: 300, y: 50 },
      });
      act(() => result.current.undo());
      expect(result.current.frames[0].paths).toBeUndefined();
    });

    it("reset returns to a single static frame as one undo step", () => {
      const { result } = renderHook(() => useTacticsState());
      act(() => result.current.addFrame());
      act(() => result.current.resetBoard());
      expect(result.current.frames).toHaveLength(1);
      act(() => result.current.undo());
      expect(result.current.frames).toHaveLength(2);
    });
  });

  describe("nudging the selected item", () => {
    const setup = () => {
      const hook = renderHook(() => useTacticsState());
      const id = hook.result.current.state.players[0].id;
      act(() => {
        hook.result.current.setSelectedId(id);
        hook.result.current.setSelectedType("player");
      });
      const pos = () => {
        const p = hook.result.current.state.players.find((pl) => pl.id === id)!;
        return { x: p.x, y: p.y };
      };
      return { ...hook, id, pos };
    };

    it("adds one undo step per press", () => {
      const { result, pos } = setup();
      const start = pos();
      act(() => result.current.nudgeSelected(1, 0));
      act(() => result.current.nudgeSelected(1, 0));
      act(() => result.current.nudgeSelected(1, 0));
      expect(pos()).toEqual({ x: start.x + 3, y: start.y });

      act(() => result.current.undo());
      expect(pos()).toEqual({ x: start.x + 2, y: start.y });
    });

    it("folds a held key into the step of its first press", () => {
      const { result, pos } = setup();
      const start = pos();
      act(() => result.current.nudgeSelected(1, 0));
      for (let i = 0; i < 39; i++) {
        act(() => result.current.nudgeSelected(1, 0, true));
      }
      expect(pos()).toEqual({ x: start.x + 40, y: start.y });

      act(() => result.current.undo());
      expect(pos()).toEqual(start);
      expect(result.current.canUndo).toBe(false);

      act(() => result.current.redo());
      expect(pos()).toEqual({ x: start.x + 40, y: start.y });
    });

    it("adds no undo step when the item cannot move", () => {
      const { result, id, pos } = setup();
      act(() => {
        result.current.pushState((prev) => ({
          ...prev,
          players: prev.players.map((p) => (p.id === id ? { ...p, x: 0 } : p)),
        }));
      });
      act(() => result.current.undo());
      act(() => result.current.redo());
      const before = pos();
      act(() => result.current.nudgeSelected(-1, 0));
      expect(pos()).toEqual(before);
      // Only the setup edit is on the stack.
      act(() => result.current.undo());
      expect(result.current.canUndo).toBe(false);
    });

    it("does nothing without a selection", () => {
      const { result } = renderHook(() => useTacticsState());
      const before = result.current.state;
      act(() => result.current.nudgeSelected(1, 0));
      expect(result.current.state).toBe(before);
      expect(result.current.canUndo).toBe(false);
    });

    it("changes the selected frame only", () => {
      const { result, id } = setup();
      act(() => result.current.addFrame());
      act(() => result.current.addFrame());
      act(() => result.current.selectFrame(result.current.frames[1].id));
      // Changing frame clears the selection.
      act(() => {
        result.current.setSelectedId(id);
        result.current.setSelectedType("player");
      });
      const ys = () =>
        result.current.frames.map((f) => f.players.find((p) => p.id === id)!.y);
      const [y1, y2, y3] = ys();

      act(() => result.current.nudgeSelected(0, -1));
      expect(ys()).toEqual([y1, y2 - 1, y3]);
    });

    it("does nothing while previewing", () => {
      const { result, pos } = setup();
      const start = pos();
      act(() => result.current.setPreviewing(true));
      act(() => result.current.nudgeSelected(1, 0));
      act(() => result.current.setPreviewing(false));
      expect(pos()).toEqual(start);
      expect(result.current.canUndo).toBe(false);
    });
  });
});

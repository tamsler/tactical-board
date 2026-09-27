import { describe, it, expect, beforeEach } from "vitest";
import type { BoardState } from "../hooks/useTacticsState";
import { duplicateFrame, sequenceFromBoard } from "./commands";
import {
  DEFAULT_PREFERENCES,
  DEFAULT_SETTINGS,
  STORAGE_KEY_V1,
  STORAGE_KEY_V2,
  buildStoredState,
  loadStoredState,
  parsePreferences,
  saveStoredState,
} from "./storage";

const board: BoardState = {
  players: [],
  balls: [{ id: "b1", x: 1, y: 2 }],
  equipments: [],
  lines: [],
  shapes: [],
  texts: [],
  title: "Rondo",
  notes: "",
};

describe("storage", () => {
  beforeEach(() => localStorage.clear());

  it("reports an empty store", () => {
    expect(loadStoredState()).toMatchObject({ source: "none", sequence: null });
  });

  it("round-trips every frame, the selection, settings and preferences (A10)", () => {
    const seq = duplicateFrame(sequenceFromBoard(board), "")!.seq;
    const prefs = { ...DEFAULT_PREFERENCES, showGrid: true };
    const settings = { ...DEFAULT_SETTINGS, pitchType: "blank" as const };
    expect(
      saveStoredState(buildStoredState(seq, seq.frames[1].id, settings, prefs)),
    ).toEqual({ ok: true });

    const loaded = loadStoredState();
    expect(loaded.source).toBe("v2");
    expect(loaded.sequence).toEqual(seq);
    expect(loaded.selectedFrameId).toBe(seq.frames[1].id);
    expect(loaded.settings).toEqual(settings);
    expect(loaded.preferences).toEqual(prefs);
  });

  it("migrates v1 settings and preferences without touching the v1 key", () => {
    const v1 = JSON.stringify({
      boardState: board,
      pitchType: "half",
      matchFormat: "7v7",
      halfPitchTeam: "A",
      grassStyle: "slate",
      showZones: true,
      frames: [{ id: "frame-1" }],
    });
    localStorage.setItem(STORAGE_KEY_V1, v1);
    const loaded = loadStoredState();
    expect(loaded.source).toBe("v1");
    expect(loaded.sequence?.frames).toHaveLength(1);
    expect(loaded.settings).toMatchObject({
      pitchType: "half",
      matchFormat: "7v7",
      halfPitchTeam: "A",
    });
    expect(loaded.preferences).toMatchObject({
      grassStyle: "slate",
      showZones: true,
    });
    expect(localStorage.getItem(STORAGE_KEY_V1)).toBe(v1);
  });

  it("flags newer or damaged v2 data instead of reading it", () => {
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify({ storageVersion: 3 }));
    expect(loadStoredState().problem?.reason).toMatch(/newer version/);
    localStorage.setItem(STORAGE_KEY_V2, "{not json");
    const loaded = loadStoredState();
    expect(loaded.problem?.raw).toBe("{not json");
    expect(loaded.sequence).toBeNull();
  });

  it("falls back to v1 content when v2 is unreadable, keeping the problem", () => {
    localStorage.setItem(STORAGE_KEY_V2, "{not json");
    localStorage.setItem(STORAGE_KEY_V1, JSON.stringify({ boardState: board }));
    const loaded = loadStoredState();
    expect(loaded.sequence?.title).toBe("Rondo");
    expect(loaded.problem).toBeDefined();
  });

  it("ignores malformed preference values", () => {
    expect(
      parsePreferences({
        grassStyle: "neon",
        drawingWidth: -4,
        showGrid: "yes",
      }),
    ).toEqual(DEFAULT_PREFERENCES);
  });

  it("reports a full store", () => {
    const full = {
      setItem: () => {
        throw new DOMException("full", "QuotaExceededError");
      },
    } as unknown as Storage;
    const seq = sequenceFromBoard(board);
    const state = buildStoredState(
      seq,
      seq.frames[0].id,
      DEFAULT_SETTINGS,
      DEFAULT_PREFERENCES,
    );
    expect(saveStoredState(state, full)).toEqual({
      ok: false,
      reason: "quota",
    });
  });
});

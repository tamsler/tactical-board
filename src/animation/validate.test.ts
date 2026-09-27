import { describe, it, expect } from "vitest";
import { parseBoardState, parseDocument } from "./validate";
import { parseProjectJSON, sequenceFromV1Cache, toDocument } from "./migrate";
import { duplicateFrame, sequenceFromBoard } from "./commands";
import { DEFAULT_SELECTED_FORMATIONS, type DocumentSettings } from "./model";
import type { Player } from "../types/tactics";
import type { BoardState } from "../hooks/useTacticsState";

const player: Player = {
  id: "p1",
  team: "A",
  number: "10",
  x: 100,
  y: 200,
  color: "#f00",
  textColor: "#fff",
};

const settings: DocumentSettings = {
  pitchType: "full",
  matchFormat: "11v11",
  halfPitchTeam: "B",
  selectedFormations: DEFAULT_SELECTED_FORMATIONS,
};

describe("parseBoardState", () => {
  it("accepts a legacy board and normalizes missing collections", () => {
    const r = parseBoardState({ players: [player], balls: [] });
    expect(r.ok && r.value).toEqual({
      players: [player],
      balls: [],
      equipments: [],
      lines: [],
      shapes: [],
      texts: [],
      title: "",
      notes: "",
    });
  });

  it("accepts blank boards", () => {
    expect(parseBoardState({ players: [], balls: [], title: "Drill" }).ok).toBe(
      true,
    );
  });

  it("drops unknown fields", () => {
    const r = parseBoardState({
      players: [{ ...player, extra: "x" }],
      balls: [],
      junk: 1,
    });
    expect(r.ok && r.value.players[0]).toEqual(player);
    expect(r.ok && "junk" in r.value).toBe(false);
  });

  it.each([
    ["missing players", { balls: [] }],
    ["non-finite coordinate", { players: [{ ...player, x: null }], balls: [] }],
    ["unknown team", { players: [{ ...player, team: "Z" }], balls: [] }],
    ["duplicate ids", { players: [player], balls: [{ id: "p1", x: 0, y: 0 }] }],
    ["wrong type", { players: "nope", balls: [] }],
    ["not an object", 42],
  ])("rejects %s", (_label, input) => {
    expect(parseBoardState(input).ok).toBe(false);
  });
});

describe("parseDocument", () => {
  const board: BoardState = {
    players: [player],
    balls: [{ id: "b1", x: 0, y: 0 }],
    equipments: [],
    lines: [],
    shapes: [],
    texts: [],
    title: "T",
    notes: "",
  };
  const seq = duplicateFrame(sequenceFromBoard(board), "")!.seq;
  const doc = toDocument(seq, settings);

  it("round-trips a document (A10)", () => {
    const r = parseDocument(JSON.parse(JSON.stringify(doc)));
    expect(r.ok && r.value).toEqual(doc);
  });

  it("rejects newer schema versions", () => {
    const r = parseDocument({ ...doc, schemaVersion: 4 });
    expect(!r.ok && r.error).toMatch(/newer version/);
  });

  it("rejects frames with different players", () => {
    const frames = [doc.frames[0], { ...doc.frames[1], players: [] }];
    expect(parseDocument({ ...doc, frames }).ok).toBe(false);
  });

  it("rejects duplicate frame ids and invalid durations", () => {
    expect(
      parseDocument({ ...doc, frames: [doc.frames[0], doc.frames[0]] }).ok,
    ).toBe(false);
    const bad = [{ ...doc.frames[0], durationMs: 99 }, doc.frames[1]];
    expect(parseDocument({ ...doc, frames: bad }).ok).toBe(false);
  });

  it("reads v2 documents, which have no curved paths", () => {
    const r = parseDocument({ ...doc, schemaVersion: 2 });
    expect(r.ok && r.value.schemaVersion).toBe(3);
  });

  it("accepts curve control points only for players and balls", () => {
    const curved = [
      { ...doc.frames[0], paths: { p1: { x: 50, y: 60 } } },
      doc.frames[1],
    ];
    const r = parseDocument({ ...doc, frames: curved });
    expect(r.ok && r.value.frames[0].paths).toEqual({ p1: { x: 50, y: 60 } });

    const unknown = [
      { ...doc.frames[0], paths: { nope: { x: 1, y: 1 } } },
      doc.frames[1],
    ];
    expect(parseDocument({ ...doc, frames: unknown }).ok).toBe(false);
    const notPoint = [
      { ...doc.frames[0], paths: { p1: { x: "a" } } },
      doc.frames[1],
    ];
    expect(parseDocument({ ...doc, frames: notPoint }).ok).toBe(false);
  });
});

describe("migration", () => {
  it("uses the v1 boardState as Frame 1 and ignores the placeholder frames", () => {
    const seq = sequenceFromV1Cache({
      boardState: {
        players: [],
        balls: [{ id: "b", x: 1, y: 2 }],
        title: "Blank",
        notes: "",
      },
      frames: [
        { id: "frame-1", title: "Phase 1: Build-up", players: [], balls: [] },
      ],
      activeFrameIndex: 0,
    });
    expect(seq?.frames).toHaveLength(1);
    expect(seq?.frames[0].balls).toEqual([{ id: "b", x: 1, y: 2 }]);
    expect(seq?.title).toBe("Blank");
  });

  it("returns null for invalid v1 data", () => {
    expect(sequenceFromV1Cache(null)).toBeNull();
    expect(sequenceFromV1Cache({ boardState: { players: 1 } })).toBeNull();
  });

  it("imports both legacy boards and v2 documents", () => {
    const legacy = parseProjectJSON(
      JSON.stringify({ players: [player], balls: [] }),
    );
    expect(legacy.ok && legacy.value.settings).toBeUndefined();
    const board: BoardState = {
      players: [player],
      balls: [],
      equipments: [],
      lines: [],
      shapes: [],
      texts: [],
      title: "",
      notes: "",
    };
    const doc = toDocument(sequenceFromBoard(board), settings);
    const v2 = parseProjectJSON(JSON.stringify(doc));
    expect(v2.ok && v2.value.settings).toEqual(settings);
    expect(parseProjectJSON("{").ok).toBe(false);
  });
});

import { describe, it, expect } from "vitest";
import { lintDocument } from "./lint";
import { parseProjectJSON, toDocument } from "./migrate";
import {
  DEFAULT_SELECTED_FORMATIONS,
  DOCUMENT_KIND,
  DOCUMENT_SCHEMA_VERSION,
  type AnimationFrame,
  type TacticsDocument,
} from "./model";
import type { Player } from "../types/tactics";

const player = (id: string, x: number, y: number): Player => ({
  id,
  team: "A",
  number: "7",
  x,
  y,
  color: "#ef4444",
  textColor: "#ffffff",
});

const frame = (
  id: string,
  players: Player[],
  extra: Partial<AnimationFrame> = {},
): AnimationFrame => ({
  id,
  title: "",
  players,
  balls: [{ id: "ball", x: 500, y: 300 }],
  equipments: [],
  lines: [],
  shapes: [],
  texts: [],
  holdMs: 0,
  durationMs: 1000,
  ...extra,
});

const doc = (frames: AnimationFrame[]): TacticsDocument => ({
  kind: DOCUMENT_KIND,
  schemaVersion: DOCUMENT_SCHEMA_VERSION,
  title: "Test",
  settings: {
    pitchType: "full",
    matchFormat: "7v7",
    halfPitchTeam: "B",
    selectedFormations: DEFAULT_SELECTED_FORMATIONS,
  },
  frames,
});

describe("lintDocument", () => {
  it("reports nothing for a clean document", () => {
    const frames = [
      frame("f1", [player("p1", 100, 100), player("p2", 300, 100)]),
      frame("f2", [player("p1", 200, 150), player("p2", 300, 100)]),
    ];
    expect(lintDocument(doc(frames))).toEqual([]);
  });

  it("flags entities placed off the pitch", () => {
    const warnings = lintDocument(
      doc([frame("f1", [player("p1", 1200, 100)])]),
    );
    expect(warnings).toEqual([
      'frames[0]: player "p1" is off the pitch at (1200, 100)',
    ]);
  });

  it("flags overlapping players", () => {
    const warnings = lintDocument(
      doc([frame("f1", [player("p1", 100, 100), player("p2", 110, 100)])]),
    );
    expect(warnings).toEqual(['frames[0]: players "p1" and "p2" overlap']);
  });

  it("flags identity that changes between frames, but not pose", () => {
    const moved = { ...player("p1", 200, 100), facingAngle: 90 };
    const renumbered = { ...player("p1", 200, 100), number: "9" };
    expect(
      lintDocument(
        doc([frame("f1", [player("p1", 100, 100)]), frame("f2", [moved])]),
      ),
    ).toEqual([]);
    expect(
      lintDocument(
        doc([frame("f1", [player("p1", 100, 100)]), frame("f2", [renumbered])]),
      ),
    ).toHaveLength(1);
  });

  it("flags undrawable lines, loose colours and oversized teams", () => {
    const squad = Array.from({ length: 8 }, (_, i) =>
      player(`p${i}`, 100 + i * 50, 100),
    );
    const warnings = lintDocument(
      doc([
        frame("f1", squad, {
          lines: [
            {
              id: "l1",
              type: "pass",
              points: [{ x: 10, y: 10 }],
              color: "white",
              width: 3,
              style: "dashed",
            },
          ],
        }),
      ]),
    );
    expect(warnings).toEqual([
      "frames: team A has 8 players, more than a 7v7 side",
      'frames[0]: line "l1" needs at least two points to be drawn',
      'frames[0]: line "l1" color "white" is not #rrggbb',
    ]);
  });

  it("flags a caption too long to fit on the canvas", () => {
    const caption = (id: string, text: string) => ({
      id,
      x: 48,
      y: 21,
      text,
      fontSize: 13,
      color: "#ffffff",
    });
    const warnings = lintDocument(
      doc([
        frame("f1", [player("p1", 100, 100)], {
          texts: [
            caption("ok", "x".repeat(60)),
            caption("long", "x".repeat(140)),
          ],
        }),
      ]),
    );
    expect(warnings).toEqual([
      'frames[0]: text "long" runs off the right edge; shorten it',
    ]);
  });

  it("flags curved paths that are never played or bend off the pitch", () => {
    const frames = [
      frame("f1", [player("p1", 100, 100)], {
        paths: { p1: { x: 100, y: -80 } },
      }),
      frame("f2", [player("p1", 300, 100)], {
        paths: { p1: { x: 200, y: 200 } },
      }),
    ];
    expect(lintDocument(doc(frames))).toEqual([
      'frames[0]: the curved path for "p1" bends off the pitch',
      "frames[1]: paths on the last frame are never played",
    ]);
  });
});

// The examples are quoted in docs/agent/document-format.md and handed to agents as references.
describe("agent example documents", () => {
  const examples = import.meta.glob<string>(
    "../../docs/agent/examples/*.tacticalboard",
    { query: "?raw", import: "default", eager: true },
  );

  it("finds the examples", () => {
    expect(Object.keys(examples).length).toBeGreaterThan(0);
  });

  it.each(Object.entries(examples))("%s is valid and lint-free", (_, text) => {
    const result = parseProjectJSON(text);
    if (!result.ok) throw new Error(result.error);
    const { sequence, settings } = result.value;
    expect(lintDocument(toDocument(sequence, settings!))).toEqual([]);
  });
});

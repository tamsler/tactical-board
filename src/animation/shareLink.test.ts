import { describe, it, expect } from "vitest";
import type { BoardState } from "../hooks/useTacticsState";
import { duplicateFrame, sequenceFromBoard } from "./commands";
import { toDocument } from "./migrate";
import { DOCUMENT_SCHEMA_VERSION, type TacticsDocument } from "./model";
import { DEFAULT_SETTINGS } from "./storage";
import { V2_DOCUMENT, V3_DOCUMENT, V3_SHARE_FRAGMENT } from "./testing";
import {
  createShareLink,
  hasShareFragment,
  parseShareFragment,
} from "./shareLink";

const board: BoardState = {
  players: [
    {
      id: "p1",
      team: "A",
      number: "9",
      x: 10,
      y: 20,
      color: "#f00",
      textColor: "#fff",
    },
  ],
  balls: [{ id: "b1", x: 1, y: 2 }],
  equipments: [],
  lines: [],
  shapes: [],
  texts: [],
  title: "Press",
  notes: "",
};
const doc = toDocument(
  duplicateFrame(sequenceFromBoard(board), "")!.seq,
  DEFAULT_SETTINGS,
);
const base = "https://tacticalboard.app/";

describe("share links", () => {
  it("links to the current page without the retired ?animate=1 flag", async () => {
    const before = window.location.href;
    window.history.replaceState(null, "", "/board?animate=1&lang=en#old");
    try {
      const link = await createShareLink(doc);
      expect(
        link.startsWith(`${window.location.origin}/board?lang=en#share=`),
      ).toBe(true);
    } finally {
      window.history.replaceState(null, "", before);
    }
  });

  it("round-trips a document through the URL fragment (A15)", async () => {
    const link = await createShareLink(doc, base);
    const hash = link.slice(base.length);
    expect(hasShareFragment(hash)).toBe(true);
    expect(hash).toMatch(/^#share=1\.[A-Za-z0-9_-]+$/);
    const result = await parseShareFragment(hash);
    expect(result.ok && result.value).toEqual(doc);
  });

  it("keeps a frame's easing through the link", async () => {
    const eased = {
      ...doc,
      frames: [
        { ...doc.frames[0], easing: "easeInOut" as const },
        doc.frames[1],
      ],
    };
    const link = await createShareLink(eased, base);
    const result = await parseShareFragment(link.slice(base.length));
    expect(result.ok && result.value).toEqual(eased);
  });

  it.each([
    ["version 3, with curved paths", V3_DOCUMENT],
    ["version 2", V2_DOCUMENT],
  ])("opens a link holding a %s document", async (_label, old) => {
    // createShareLink only serialises, so it carries the old document as is.
    const link = await createShareLink(old as unknown as TacticsDocument, base);
    const result = await parseShareFragment(link.slice(base.length));
    if (!result.ok) throw new Error(result.error);
    expect(result.value.schemaVersion).toBe(DOCUMENT_SCHEMA_VERSION);
    expect(result.value.title).toBe(old.title);
    expect(result.value.frames).toEqual(old.frames);
  });

  it("opens a link made by version 1.8.0", async () => {
    const result = await parseShareFragment(V3_SHARE_FRAGMENT);
    if (!result.ok) throw new Error(result.error);
    const { title, frames } = result.value;
    expect(title).toBe("Wall pass");
    expect(frames).toHaveLength(3);
    expect(frames.map((f) => [f.holdMs, f.durationMs])).toEqual([
      [800, 1000],
      [200, 1500],
      [1500, 1000],
    ]);
    expect(frames.map((f) => f.paths)).toEqual([
      undefined,
      { p1: { x: 500, y: 560 } },
      undefined,
    ]);
    expect(frames.some((f) => "easing" in f)).toBe(false);
  });

  it("rejects unknown versions and damaged payloads", async () => {
    const link = await createShareLink(doc, base);
    const hash = link.slice(base.length);
    expect((await parseShareFragment(hash.replace("=1.", "=9."))).ok).toBe(
      false,
    );
    expect((await parseShareFragment("#share=1.not*base64")).ok).toBe(false);
    expect((await parseShareFragment(`${hash.slice(0, -12)}AAAA`)).ok).toBe(
      false,
    );
  });

  it("rejects payloads that expand past the import limit", async () => {
    const huge = { ...doc, title: "x".repeat(6 * 1024 * 1024) };
    const link = await createShareLink(huge as typeof doc, base);
    const result = await parseShareFragment(link.slice(base.length));
    expect(!result.ok && result.error).toMatch(/too large|damaged/);
  });

  it("validates the decoded document", async () => {
    const broken = { ...doc, frames: [] };
    const link = await createShareLink(broken as typeof doc, base);
    expect((await parseShareFragment(link.slice(base.length))).ok).toBe(false);
  });
});

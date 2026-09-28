import { describe, it, expect } from "vitest";
import type { BoardState } from "../hooks/useTacticsState";
import { duplicateFrame, sequenceFromBoard } from "./commands";
import { toDocument } from "./migrate";
import { DEFAULT_SETTINGS } from "./storage";
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

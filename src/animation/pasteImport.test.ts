import { describe, it, expect } from "vitest";
import { checkPastedDocument, extractJSON, feedbackFor } from "./pasteImport";

const example = Object.values(
  import.meta.glob<string>(
    "../../docs/agent/examples/minimal-wall-pass.tacticalboard",
    { query: "?raw", import: "default", eager: true },
  ),
)[0];

describe("extractJSON", () => {
  it("strips a code fence and surrounding chat text", () => {
    const pasted = 'Here is your drill:\n```json\n{"a": {"b": 1}}\n```\nEnjoy!';
    expect(extractJSON(pasted)).toBe('{"a": {"b": 1}}');
  });

  it("returns text without braces unchanged", () => {
    expect(extractJSON("  hello ")).toBe("hello");
  });
});

describe("checkPastedDocument", () => {
  it("accepts a document pasted inside a chat reply", () => {
    const check = checkPastedDocument(
      `Sure!\n\`\`\`json\n${example}\n\`\`\`\nOpen it with Paste from AI.`,
    );
    expect(check).toMatchObject({
      ok: true,
      summary: "“Wall pass”: 3 frames, 2 players, 1 ball, 5.00 s",
      warnings: [],
    });
  });

  it("reports the failing field of an invalid document", () => {
    const doc = JSON.parse(example);
    doc.frames[1].players.pop();
    const check = checkPastedDocument(JSON.stringify(doc));
    expect(check).toEqual({
      ok: false,
      error:
        "document: document.frames[1]: every frame must contain the same players and balls",
    });
    expect(feedbackFor(check)).toContain("every frame must contain");
  });

  it("lists lint warnings and turns them into feedback", () => {
    const doc = JSON.parse(example);
    doc.frames[0].players[0].x = 2000;
    const check = checkPastedDocument(JSON.stringify(doc));
    expect(check.ok && check.warnings).toEqual([
      'frames[0]: player "p1" is off the pitch at (2000, 440)',
    ]);
    expect(feedbackFor(check)).toBe(
      [
        "Tactical Board opened the document but reported 1 warning(s):",
        '- frames[0]: player "p1" is off the pitch at (2000, 440)',
        "Please fix these and send the complete corrected document.",
      ].join("\n"),
    );
  });

  it("rejects empty input and text that is not JSON", () => {
    expect(checkPastedDocument("  ")).toEqual({
      ok: false,
      error: "Nothing was pasted.",
    });
    const cutOff = checkPastedDocument(example.slice(0, 400));
    expect(!cutOff.ok && cutOff.error).toMatch(/not a complete JSON document/);
  });
});

// @vitest-environment node
// public/ai/ is committed and served as-is by the dev server, so it must match
// what docs/agent/ generates. If this fails, run `npm run build:ai` and commit.
import { readFile } from "node:fs/promises";
import { inflateRawSync } from "node:zlib";
import { describe, it, expect } from "vitest";
import { buildAiFiles } from "./build-ai-prompt.mjs";

const committed = (name) =>
  readFile(new URL(`../public/ai/${name}`, import.meta.url), "utf8");

// Compressed bytes can differ between zlib builds, so links are compared by
// the document they carry.
const decodeLinks = (json) =>
  JSON.parse(json).map((example) => ({
    ...example,
    link: JSON.parse(
      inflateRawSync(
        Buffer.from(example.link.replace("/#share=1.", ""), "base64url"),
      ).toString(),
    ),
  }));

describe("public/ai is up to date with docs/agent", () => {
  it("prompt.md", async () => {
    const files = await buildAiFiles();
    expect(await committed("prompt.md")).toBe(files["prompt.md"]);
  });

  it("examples.json", async () => {
    const files = await buildAiFiles();
    expect(decodeLinks(await committed("examples.json"))).toEqual(
      decodeLinks(files["examples.json"]),
    );
  });
});

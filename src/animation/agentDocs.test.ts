import { describe, it, expect } from "vitest";
import formatDoc from "../../docs/agent/document-format.md?raw";
import validatorSource from "./validate.ts?raw";

// docs/agent/document-format.md is what an AI assistant reads to write a
// document, so it has to name every field and value the validator accepts.
// These are read from the validator's source: a field or value added there
// fails here until the format reference mentions it.

const fields = new Set<string>();
for (const m of validatorSource.matchAll(/\bo\.([A-Za-z]\w*)/g)) {
  fields.add(m[1]);
}
for (const m of validatorSource.matchAll(/\b(?:opt|list)\(\s*o,\s*"(\w+)"/g)) {
  fields.add(m[1]);
}

const values = new Set<string>();
for (const m of validatorSource.matchAll(
  /const [A-Z_]+ = \[([^\]]*)\] as const/g,
)) {
  for (const v of m[1].matchAll(/"([^"]+)"/g)) values.add(v[1]);
}

// Named in code or JSON: `holdMs`, "holdMs" or `settings.holdMs`.
const mentions = (name: string) =>
  new RegExp(`[\`".]${name}[\`"]`).test(formatDoc);

describe("document-format.md covers the validator", () => {
  it("finds the validator's fields and values", () => {
    expect(fields.size).toBeGreaterThan(40);
    expect(values.size).toBeGreaterThan(30);
  });

  it.each([...fields])("documents the field %s", (field) => {
    expect(mentions(field)).toBe(true);
  });

  it.each([...values])('documents the value "%s"', (value) => {
    expect(mentions(value)).toBe(true);
  });
});

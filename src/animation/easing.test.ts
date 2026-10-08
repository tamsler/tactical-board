import { describe, it, expect } from "vitest";
import { ease } from "./easing";

describe("ease", () => {
  it("returns the time fraction for linear and for a missing easing", () => {
    for (const u of [0, 0.25, 0.5, 0.75, 1]) {
      expect(ease(u, "linear")).toBe(u);
      expect(ease(u)).toBe(u);
    }
  });

  it("follows 6u⁵ − 15u⁴ + 10u³ for easeInOut", () => {
    expect(ease(0, "easeInOut")).toBe(0);
    expect(ease(0.25, "easeInOut")).toBe(0.103515625);
    expect(ease(0.5, "easeInOut")).toBe(0.5);
    expect(ease(0.75, "easeInOut")).toBe(0.896484375);
    expect(ease(1, "easeInOut")).toBe(1);
  });
});

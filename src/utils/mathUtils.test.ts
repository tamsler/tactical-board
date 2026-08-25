import { describe, it, expect } from "vitest";
import {
  distance,
  angle,
  generateWavyPath,
  generateCurvePath,
  generateFreehandPath,
  getArrowHeadPath,
  getTBarPath,
  getContrastTextColor,
} from "./mathUtils";

describe("mathUtils", () => {
  describe("distance", () => {
    it("calculates Euclidean distance correctly", () => {
      expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
      expect(distance({ x: 10, y: 10 }, { x: 10, y: 10 })).toBe(0);
      expect(distance({ x: -1, y: -1 }, { x: 2, y: 3 })).toBe(5);
    });
  });

  describe("angle", () => {
    it("calculates heading angle in radians", () => {
      expect(angle({ x: 0, y: 0 }, { x: 10, y: 0 })).toBe(0);
      expect(angle({ x: 0, y: 0 }, { x: 0, y: 10 })).toBeCloseTo(Math.PI / 2);
      expect(angle({ x: 0, y: 0 }, { x: -10, y: 0 })).toBeCloseTo(Math.PI);
      expect(angle({ x: 0, y: 0 }, { x: 0, y: -10 })).toBeCloseTo(-Math.PI / 2);
    });
  });

  describe("generateWavyPath", () => {
    it("returns straight line fallback when points are very close (<16px)", () => {
      const start = { x: 10, y: 10 };
      const end = { x: 15, y: 10 };
      const result = generateWavyPath(start, end);
      expect(result.path).toContain("M 10.00 10.00 L 15.00 10.00");
    });

    it("generates a multi-segment wavy SVG path for longer distances", () => {
      const start = { x: 0, y: 0 };
      const end = { x: 100, y: 0 };
      const result = generateWavyPath(start, end, 8);
      expect(result.path.startsWith("M 0.00 0.00")).toBe(true);
      expect(result.path.split(" L ").length).toBeGreaterThan(10);
      expect(result.endAngle).toBeCloseTo(0);
    });
  });

  describe("generateCurvePath", () => {
    it("formats quadratic Bézier curve correctly", () => {
      const start = { x: 0, y: 0 };
      const control = { x: 50, y: 25 };
      const end = { x: 100, y: 0 };
      const result = generateCurvePath(start, control, end);
      expect(result.path).toBe("M 0 0 Q 50 25, 100 0");
      expect(typeof result.endAngle).toBe("number");
    });
  });

  describe("generateFreehandPath", () => {
    it("handles empty and single-point arrays gracefully", () => {
      expect(generateFreehandPath([])).toBe("");
      expect(generateFreehandPath([{ x: 10, y: 20 }])).toBe("M 10 20 L 10 20");
    });

    it("generates smooth quadratic curve segments for multiple points", () => {
      const points = [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 20, y: 0 },
        { x: 30, y: 10 },
      ];
      const path = generateFreehandPath(points);
      expect(path.startsWith("M 0 0")).toBe(true);
      expect(path).toContain("Q");
      expect(path.endsWith("L 30 10")).toBe(true);
    });
  });

  describe("getArrowHeadPath", () => {
    it("generates closed SVG path with notch", () => {
      const path = getArrowHeadPath({ x: 50, y: 50 }, 0, 15);
      expect(path.startsWith("M 50.00 50.00")).toBe(true);
      expect(path.endsWith("Z")).toBe(true);
    });
  });

  describe("getTBarPath", () => {
    it("generates perpendicular t-bar line path", () => {
      const path = getTBarPath({ x: 100, y: 100 }, 0, 20);
      expect(path.startsWith("M 100")).toBe(true);
      expect(path).toContain("L 100");
    });
  });

  describe("getContrastTextColor", () => {
    it("returns white text for dark backgrounds", () => {
      expect(getContrastTextColor("#000000")).toBe("#ffffff");
      expect(getContrastTextColor("#0f172a")).toBe("#ffffff");
      expect(getContrastTextColor("#1e293b")).toBe("#ffffff");
      expect(getContrastTextColor("#dc2626")).toBe("#ffffff");
      expect(getContrastTextColor("#2563eb")).toBe("#ffffff");
    });

    it("returns dark text for light/bright backgrounds", () => {
      expect(getContrastTextColor("#ffffff")).toBe("#0f172a");
      expect(getContrastTextColor("#ffff00")).toBe("#0f172a");
      expect(getContrastTextColor("#facc15")).toBe("#0f172a");
      expect(getContrastTextColor("#4ade80")).toBe("#0f172a");
    });

    it("handles 3-digit shorthand hex codes", () => {
      expect(getContrastTextColor("#fff")).toBe("#0f172a");
      expect(getContrastTextColor("#000")).toBe("#ffffff");
    });

    it("defaults to white for invalid hex inputs", () => {
      expect(getContrastTextColor("not-a-hex")).toBe("#ffffff");
    });
  });
});

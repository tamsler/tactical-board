import { describe, it, expect } from "vitest";
import {
  parseStyledTextLines,
  parseStyledTextLine,
  tokenizeText,
  toggleMarkdownFormat,
  isFormatActive,
} from "./textUtils";

describe("textUtils", () => {
  describe("parseStyledTextLines", () => {
    it("parses plain text into standard span", () => {
      const result = parseStyledTextLines("High Press");
      expect(result).toEqual([
        [{ text: "High Press", bold: false, italic: false }],
      ]);
    });

    it("parses markdown bold correctly", () => {
      const result = parseStyledTextLines("Play **wide** now");
      expect(result[0]).toEqual([
        { text: "Play ", bold: false, italic: false },
        { text: "wide", bold: true, italic: false },
        { text: " now", bold: false, italic: false },
      ]);
    });

    it("parses multi-line text with formatting", () => {
      const result = parseStyledTextLines("Line 1\n**Line 2**");
      expect(result.length).toBe(2);
      expect(result[0]).toEqual([
        { text: "Line 1", bold: false, italic: false },
      ]);
      expect(result[1]).toEqual([
        { text: "Line 2", bold: true, italic: false },
      ]);
    });
  });

  describe("parseStyledTextLine", () => {
    it("handles bold italic combined formatting", () => {
      const spans = parseStyledTextLine("***Critical Zone***");
      expect(spans).toEqual([
        { text: "Critical Zone", bold: true, italic: true },
      ]);
    });
  });

  describe("tokenizeText", () => {
    it("splits text into tokens preserving indices", () => {
      const tokens = tokenizeText("Hello *World*");
      expect(tokens.length).toBe(2);
      expect(tokens[0].text).toBe("Hello ");
      expect(tokens[1].text).toBe("World");
      expect(tokens[1].italic).toBe(true);
    });
  });

  describe("toggleMarkdownFormat", () => {
    it("wraps unformatted selection in bold syntax", () => {
      const text = "Quick counter attack";
      const start = 6;
      const end = 13; // "counter"
      const result = toggleMarkdownFormat(text, start, end, "bold");
      expect(result.newText).toBe("Quick **counter** attack");
      // Selection adjusts to inner content
      expect(result.newStart).toBe(8);
      expect(result.newEnd).toBe(15);
    });

    it("unwraps formatted bold text when toggled again", () => {
      const text = "Quick **counter** attack";
      const start = 6;
      const end = 17; // "**counter**"
      const result = toggleMarkdownFormat(text, start, end, "bold");
      expect(result.newText).toBe("Quick counter attack");
    });
  });

  describe("isFormatActive", () => {
    it("identifies active formatting at cursor position", () => {
      const text = "Hello **World**";
      expect(isFormatActive(text, 10, 10, "bold")).toBe(true);
      expect(isFormatActive(text, 2, 2, "bold")).toBe(false);
    });
  });
});

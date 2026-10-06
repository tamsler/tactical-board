import { lintDocument } from "./lint";
import { parseProjectJSON, toDocument, type ImportedProject } from "./migrate";
import { toSeconds } from "./model";
import { totalDurationMs } from "./timeline";

export type PasteCheck =
  | { ok: false; error: string }
  | {
      ok: true;
      project: ImportedProject;
      summary: string;
      warnings: string[];
    };

/**
 * Pulls the JSON document out of pasted chat text: assistants wrap it in a
 * code fence and often add a sentence before or after.
 */
export function extractJSON(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  return start === -1 || end < start ? text.trim() : text.slice(start, end + 1);
}

/** Validates and lints text pasted from an AI assistant. */
export function checkPastedDocument(text: string): PasteCheck {
  if (text.trim() === "") return { ok: false, error: "Nothing was pasted." };
  const json = extractJSON(text);
  try {
    JSON.parse(json);
  } catch {
    // The usual cause is a reply that was cut off or only partly copied.
    return {
      ok: false,
      error:
        "This is not a complete JSON document. Copy the whole code block; if the reply was cut off, ask for the document again.",
    };
  }
  const result = parseProjectJSON(json);
  if (!result.ok) return result;
  const { sequence, settings } = result.value;
  const { frames } = sequence;
  const count = (n: number, noun: string) =>
    `${n} ${noun}${n === 1 ? "" : "s"}`;
  const parts = [
    count(frames.length, "frame"),
    count(frames[0].players.length, "player"),
    count(frames[0].balls.length, "ball"),
  ];
  if (frames.length > 1) parts.push(`${toSeconds(totalDurationMs(frames))} s`);
  return {
    ok: true,
    project: result.value,
    summary: `“${sequence.title || "Untitled"}”: ${parts.join(", ")}`,
    // Legacy single boards carry no layout settings, so there is nothing to lint against.
    warnings: settings ? lintDocument(toDocument(sequence, settings)) : [],
  };
}

/** The message a coach sends back to the assistant so it can fix its document. */
export function feedbackFor(check: PasteCheck): string {
  if (!check.ok) {
    return `Tactical Board could not open the document.\nError: ${check.error}\nPlease fix it and send the complete corrected document.`;
  }
  return [
    `Tactical Board opened the document but reported ${check.warnings.length} warning(s):`,
    ...check.warnings.map((w) => `- ${w}`),
    "Please fix these and send the complete corrected document.",
  ].join("\n");
}

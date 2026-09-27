import {
  DOCUMENT_KIND,
  DOCUMENT_SCHEMA_VERSION,
  LIMITS,
  type DocumentSettings,
  type SequenceState,
  type TacticsDocument,
} from "./model";
import { sequenceFromBoard } from "./commands";
import { parseBoardState, parseDocument, type Result } from "./validate";

export function toDocument(
  seq: SequenceState,
  settings: DocumentSettings,
): TacticsDocument {
  return {
    kind: DOCUMENT_KIND,
    schemaVersion: DOCUMENT_SCHEMA_VERSION,
    title: seq.title,
    settings,
    frames: seq.frames,
  };
}

export interface ImportedProject {
  sequence: SequenceState;
  /** Present only for v2 documents; legacy boards keep the current layout. */
  settings?: DocumentSettings;
}

/** Parses an imported JSON file: a v2 document or a legacy exported `BoardState`. */
export function parseProjectJSON(text: string): Result<ImportedProject> {
  if (text.length > LIMITS.maxImportBytes) {
    return { ok: false, error: "File is too large." };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "Could not parse JSON file." };
  }
  if (typeof raw === "object" && raw !== null && "kind" in raw) {
    const doc = parseDocument(raw);
    if (!doc.ok) return doc;
    return {
      ok: true,
      value: {
        sequence: { title: doc.value.title, frames: doc.value.frames },
        settings: doc.value.settings,
      },
    };
  }
  const board = parseBoardState(raw);
  if (!board.ok) return board;
  return { ok: true, value: { sequence: sequenceFromBoard(board.value) } };
}

/**
 * Reads the v1 cache's `boardState` as Frame 1. The v1 `frames` and
 * `activeFrameIndex` fields are ignored: they were never user-editable.
 */
export function sequenceFromV1Cache(saved: unknown): SequenceState | null {
  if (typeof saved !== "object" || saved === null) return null;
  const board = parseBoardState((saved as { boardState?: unknown }).boardState);
  return board.ok ? sequenceFromBoard(board.value) : null;
}

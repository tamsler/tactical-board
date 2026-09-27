import type { GrassStyle, MatchFormat, PitchType } from "../types/tactics";
import {
  DEFAULT_SELECTED_FORMATIONS,
  type DocumentSettings,
  type SelectedFormations,
  type SequenceState,
  type TacticsDocument,
} from "./model";
import { sequenceFromV1Cache, toDocument } from "./migrate";
import { parseDocument } from "./validate";

export const STORAGE_KEY_V1 = "tactical_board_saved_state_v1";
export const STORAGE_KEY_V2 = "tactical_board_saved_state_v2";
const STORAGE_VERSION = 2;

/** View settings kept per browser; never exported with the document. */
export interface Preferences {
  grassStyle: GrassStyle;
  showGrid: boolean;
  showZones: boolean;
  showPlayerLabels: boolean;
  showBuildOutLines: boolean;
  drawingColor: string;
  drawingWidth: number;
  hiddenTeams: { A: boolean; B: boolean };
  showPreviousFrame: boolean;
}

export const DEFAULT_PREFERENCES: Preferences = {
  grassStyle: "stripes",
  showGrid: false,
  showZones: false,
  showPlayerLabels: true,
  showBuildOutLines: true,
  drawingColor: "#facc15",
  drawingWidth: 3.5,
  hiddenTeams: { A: false, B: false },
  showPreviousFrame: true,
};

export const DEFAULT_SETTINGS: DocumentSettings = {
  pitchType: "full",
  matchFormat: "11v11",
  halfPitchTeam: "B",
  selectedFormations: DEFAULT_SELECTED_FORMATIONS,
};

export interface StoredState {
  storageVersion: typeof STORAGE_VERSION;
  document: TacticsDocument;
  selectedFrameId: string;
  preferences: Preferences;
}

export interface StorageProblem {
  /** Original stored text, offered as a backup download. */
  raw: string;
  reason: string;
}

export interface LoadedState {
  sequence: SequenceState | null;
  selectedFrameId: string | null;
  settings: DocumentSettings;
  preferences: Preferences;
  source: "v2" | "v1" | "none";
  /** Set when v2 data exists but cannot be read; autosave must not overwrite it. */
  problem?: StorageProblem;
}

const GRASS_STYLES: readonly GrassStyle[] = [
  "stripes",
  "grid",
  "plain",
  "slate",
  "blueprint",
  "indoor",
];
const PITCH_TYPES: readonly PitchType[] = ["full", "half", "blank"];
const MATCH_FORMATS: readonly MatchFormat[] = ["11v11", "9v9", "7v7"];

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const pick = <T>(v: unknown, ok: (v: unknown) => boolean, fallback: T): T =>
  ok(v) ? (v as T) : fallback;
const isBool = (v: unknown) => typeof v === "boolean";
const oneOf = (values: readonly string[]) => (v: unknown) =>
  typeof v === "string" && values.includes(v);

/** Lenient: unknown or malformed preference values fall back to defaults. */
export function parsePreferences(input: unknown): Preferences {
  const o = isObj(input) ? input : {};
  const d = DEFAULT_PREFERENCES;
  const hidden = isObj(o.hiddenTeams) ? o.hiddenTeams : {};
  return {
    grassStyle: pick<GrassStyle>(
      o.grassStyle,
      oneOf(GRASS_STYLES),
      d.grassStyle,
    ),
    showGrid: pick(o.showGrid, isBool, d.showGrid),
    showZones: pick(o.showZones, isBool, d.showZones),
    showPlayerLabels: pick(o.showPlayerLabels, isBool, d.showPlayerLabels),
    showBuildOutLines: pick(o.showBuildOutLines, isBool, d.showBuildOutLines),
    drawingColor: pick(
      o.drawingColor,
      (v) => typeof v === "string" && v.length <= 32,
      d.drawingColor,
    ),
    drawingWidth: pick(
      o.drawingWidth,
      (v) => typeof v === "number" && v > 0 && v <= 20,
      d.drawingWidth,
    ),
    hiddenTeams: {
      A: pick(hidden.A, isBool, false),
      B: pick(hidden.B, isBool, false),
    },
    showPreviousFrame: pick(o.showPreviousFrame, isBool, d.showPreviousFrame),
  };
}

function parseV1Settings(o: Obj): DocumentSettings {
  const formations = isObj(o.selectedFormations)
    ? (o.selectedFormations as SelectedFormations)
    : DEFAULT_SELECTED_FORMATIONS;
  const validFormations = MATCH_FORMATS.every(
    (f) =>
      isObj(formations[f]) &&
      [formations[f].teamA, formations[f].teamB].every(
        (t) => t === null || typeof t === "string",
      ),
  );
  return {
    pitchType: pick<PitchType>(o.pitchType, oneOf(PITCH_TYPES), "full"),
    matchFormat: pick<MatchFormat>(
      o.matchFormat,
      oneOf(MATCH_FORMATS),
      "11v11",
    ),
    halfPitchTeam: pick<"A" | "B">(o.halfPitchTeam, oneOf(["A", "B"]), "B"),
    selectedFormations: validFormations
      ? formations
      : DEFAULT_SELECTED_FORMATIONS,
  };
}

function readKey(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function parseV2(raw: string): LoadedState | StorageProblem {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { raw, reason: "The saved board is damaged and could not be read." };
  }
  if (!isObj(data) || typeof data.storageVersion !== "number") {
    return { raw, reason: "The saved board is damaged and could not be read." };
  }
  if (data.storageVersion > STORAGE_VERSION) {
    return {
      raw,
      reason: "The saved board was created by a newer version of the app.",
    };
  }
  const doc = parseDocument(data.document);
  if (!doc.ok) {
    return {
      raw,
      reason: `The saved board could not be read (${doc.error}).`,
    };
  }
  const { frames, title, settings } = doc.value;
  const selected =
    typeof data.selectedFrameId === "string" &&
    frames.some((f) => f.id === data.selectedFrameId)
      ? data.selectedFrameId
      : frames[0].id;
  return {
    sequence: { title, frames },
    selectedFrameId: selected,
    settings,
    preferences: parsePreferences(data.preferences),
    source: "v2",
  };
}

/** Reads v2 first, otherwise migrates v1. Never writes. */
export function loadStoredState(storage?: Storage): LoadedState {
  const store =
    storage ??
    (typeof window !== "undefined" ? window.localStorage : undefined);
  const empty: LoadedState = {
    sequence: null,
    selectedFrameId: null,
    settings: DEFAULT_SETTINGS,
    preferences: DEFAULT_PREFERENCES,
    source: "none",
  };
  if (!store) return empty;

  const v2 = readKey(store, STORAGE_KEY_V2);
  let problem: StorageProblem | undefined;
  if (v2 !== null) {
    const parsed = parseV2(v2);
    if ("source" in parsed) return parsed;
    problem = parsed;
  }

  const v1 = readKey(store, STORAGE_KEY_V1);
  if (v1 !== null) {
    try {
      const data: unknown = JSON.parse(v1);
      if (isObj(data)) {
        const sequence = sequenceFromV1Cache(data);
        return {
          sequence,
          selectedFrameId: sequence?.frames[0].id ?? null,
          settings: parseV1Settings(data),
          preferences: parsePreferences(data),
          source: "v1",
          problem,
        };
      }
    } catch {
      // Unreadable v1 data falls back to the default board.
    }
  }
  return { ...empty, problem };
}

export function buildStoredState(
  sequence: SequenceState,
  selectedFrameId: string,
  settings: DocumentSettings,
  preferences: Preferences,
): StoredState {
  return {
    storageVersion: STORAGE_VERSION,
    document: toDocument(sequence, settings),
    selectedFrameId,
    preferences,
  };
}

export type SaveResult =
  | { ok: true }
  | { ok: false; reason: "quota" | "unavailable" };

export function saveStoredState(
  state: StoredState,
  storage?: Storage,
): SaveResult {
  const store =
    storage ??
    (typeof window !== "undefined" ? window.localStorage : undefined);
  if (!store) return { ok: false, reason: "unavailable" };
  try {
    store.setItem(STORAGE_KEY_V2, JSON.stringify(state));
    return { ok: true };
  } catch (e) {
    const quota =
      e instanceof DOMException &&
      (e.name === "QuotaExceededError" || e.code === 22 || e.code === 1014);
    return { ok: false, reason: quota ? "quota" : "unavailable" };
  }
}

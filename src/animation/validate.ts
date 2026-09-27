import type {
  ArrowHead,
  Ball,
  DrawingLine,
  Equipment,
  EquipmentType,
  LineStyle,
  MatchFormat,
  PitchType,
  Player,
  Point,
  TacticalShape,
  TeamSide,
  TextAnnotation,
} from "../types/tactics";
import type { BoardState } from "../hooks/useTacticsState";
import {
  DEFAULT_SELECTED_FORMATIONS,
  DOCUMENT_KIND,
  DOCUMENT_SCHEMA_VERSION,
  LIMITS,
  SUPPORTED_SCHEMA_VERSIONS,
  type AnimationFrame,
  type DocumentSettings,
  type SelectedFormations,
  type TacticsDocument,
} from "./model";
import { totalDurationMs } from "./timeline";

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

class ValidationError extends Error {}

type Obj = Record<string, unknown>;

const TEAMS = [
  "A",
  "B",
  "neutral",
  "custom",
] as const satisfies readonly TeamSide[];
const EQUIPMENT_TYPES = [
  "cone-orange",
  "cone-yellow",
  "cone-blue",
  "mannequin",
  "mini-goal",
  "ladder",
  "pole",
] as const satisfies readonly EquipmentType[];
const LINE_TYPES = [
  "straight",
  "pass",
  "dribble",
  "curve",
  "block",
  "freehand",
] as const satisfies readonly DrawingLine["type"][];
const LINE_STYLES = [
  "solid",
  "dashed",
  "dotted",
  "wavy",
] as const satisfies readonly LineStyle[];
const ARROW_HEADS = [
  "none",
  "arrow",
  "t-bar",
  "ball",
  "double-arrow",
] as const satisfies readonly ArrowHead[];
const SHAPE_TYPES = [
  "rectangle",
  "circle",
  "polygon",
] as const satisfies readonly TacticalShape["type"][];
const TEXT_ALIGNS = ["left", "center", "right"] as const;
const BORDER_STYLES = ["none", "solid", "dashed"] as const;
const PITCH_TYPES = [
  "full",
  "half",
  "blank",
] as const satisfies readonly PitchType[];
const MATCH_FORMATS = [
  "11v11",
  "9v9",
  "7v7",
] as const satisfies readonly MatchFormat[];

function fail(path: string, message: string): never {
  throw new ValidationError(`${path}: ${message}`);
}

function obj(v: unknown, path: string): Obj {
  if (typeof v !== "object" || v === null || Array.isArray(v)) {
    fail(path, "expected an object");
  }
  return v as Obj;
}

function arr(v: unknown, path: string, max: number): unknown[] {
  if (!Array.isArray(v)) fail(path, "expected an array");
  if (v.length > max) fail(path, `too many items (max ${max})`);
  return v;
}

function str(
  v: unknown,
  path: string,
  max: number = LIMITS.maxStringLength,
): string {
  if (typeof v !== "string") fail(path, "expected a string");
  if (v.length > max) fail(path, `too long (max ${max} characters)`);
  return v;
}

function id(v: unknown, path: string): string {
  const s = str(v, path);
  if (s.length === 0) fail(path, "must not be empty");
  return s;
}

function num(v: unknown, path: string): number {
  if (typeof v !== "number" || !Number.isFinite(v)) {
    fail(path, "expected a finite number");
  }
  return v;
}

function int(v: unknown, path: string, min: number, max: number): number {
  const n = num(v, path);
  if (!Number.isInteger(n)) fail(path, "expected an integer");
  if (n < min || n > max) fail(path, `must be between ${min} and ${max}`);
  return n;
}

function bool(v: unknown, path: string): boolean {
  if (typeof v !== "boolean") fail(path, "expected a boolean");
  return v;
}

function oneOf<T extends string>(
  v: unknown,
  path: string,
  values: readonly T[],
): T {
  if (typeof v !== "string" || !(values as readonly string[]).includes(v)) {
    fail(path, `expected one of ${values.join(", ")}`);
  }
  return v as T;
}

function opt<T>(
  o: Obj,
  key: string,
  path: string,
  parse: (v: unknown, path: string) => T,
): T | undefined {
  const v = o[key];
  return v === undefined ? undefined : parse(v, `${path}.${key}`);
}

// Drops undefined optional fields so validated objects round-trip unchanged.
function compact<T extends object>(o: T): T {
  for (const k of Object.keys(o) as (keyof T)[]) {
    if (o[k] === undefined) delete o[k];
  }
  return o;
}

function point(v: unknown, path: string): Point {
  const o = obj(v, path);
  return { x: num(o.x, `${path}.x`), y: num(o.y, `${path}.y`) };
}

function player(v: unknown, path: string): Player {
  const o = obj(v, path);
  return compact({
    id: id(o.id, `${path}.id`),
    team: oneOf(o.team, `${path}.team`, TEAMS),
    number: str(o.number, `${path}.number`),
    name: opt(o, "name", path, str),
    x: num(o.x, `${path}.x`),
    y: num(o.y, `${path}.y`),
    color: str(o.color, `${path}.color`),
    textColor: str(o.textColor, `${path}.textColor`),
    isGoalkeeper: opt(o, "isGoalkeeper", path, bool),
    radius: opt(o, "radius", path, num),
    facingAngle: opt(o, "facingAngle", path, num),
    showVisionCone: opt(o, "showVisionCone", path, bool),
  });
}

function ball(v: unknown, path: string): Ball {
  const o = obj(v, path);
  return compact({
    id: id(o.id, `${path}.id`),
    x: num(o.x, `${path}.x`),
    y: num(o.y, `${path}.y`),
    size: opt(o, "size", path, num),
    rotation: opt(o, "rotation", path, num),
  });
}

function equipment(v: unknown, path: string): Equipment {
  const o = obj(v, path);
  return compact({
    id: id(o.id, `${path}.id`),
    type: oneOf(o.type, `${path}.type`, EQUIPMENT_TYPES),
    x: num(o.x, `${path}.x`),
    y: num(o.y, `${path}.y`),
    rotation: opt(o, "rotation", path, num),
    scale: opt(o, "scale", path, num),
  });
}

function line(v: unknown, path: string): DrawingLine {
  const o = obj(v, path);
  return compact({
    id: id(o.id, `${path}.id`),
    type: oneOf(o.type, `${path}.type`, LINE_TYPES),
    points: arr(o.points, `${path}.points`, LIMITS.maxFreehandPoints).map(
      (p, i) => point(p, `${path}.points[${i}]`),
    ),
    controlPoint: opt(o, "controlPoint", path, point),
    color: str(o.color, `${path}.color`),
    width: num(o.width, `${path}.width`),
    style: oneOf(o.style, `${path}.style`, LINE_STYLES),
    arrowStart: opt(o, "arrowStart", path, (x, p) => oneOf(x, p, ARROW_HEADS)),
    arrowEnd: opt(o, "arrowEnd", path, (x, p) => oneOf(x, p, ARROW_HEADS)),
    label: opt(o, "label", path, str),
  });
}

function shape(v: unknown, path: string): TacticalShape {
  const o = obj(v, path);
  return compact({
    id: id(o.id, `${path}.id`),
    type: oneOf(o.type, `${path}.type`, SHAPE_TYPES),
    x: num(o.x, `${path}.x`),
    y: num(o.y, `${path}.y`),
    width: num(o.width, `${path}.width`),
    height: num(o.height, `${path}.height`),
    color: str(o.color, `${path}.color`),
    fillOpacity: num(o.fillOpacity, `${path}.fillOpacity`),
    strokeColor: str(o.strokeColor, `${path}.strokeColor`),
    strokeWidth: num(o.strokeWidth, `${path}.strokeWidth`),
    label: opt(o, "label", path, str),
  });
}

function text(v: unknown, path: string): TextAnnotation {
  const o = obj(v, path);
  return compact({
    id: id(o.id, `${path}.id`),
    x: num(o.x, `${path}.x`),
    y: num(o.y, `${path}.y`),
    text: str(o.text, `${path}.text`, LIMITS.maxTextLength),
    fontSize: num(o.fontSize, `${path}.fontSize`),
    color: str(o.color, `${path}.color`),
    bgColor: opt(o, "bgColor", path, str),
    bgOpacity: opt(o, "bgOpacity", path, num),
    isBold: opt(o, "isBold", path, bool),
    isItalic: opt(o, "isItalic", path, bool),
    align: opt(o, "align", path, (x, p) => oneOf(x, p, TEXT_ALIGNS)),
    borderStyle: opt(o, "borderStyle", path, (x, p) =>
      oneOf(x, p, BORDER_STYLES),
    ),
    borderColor: opt(o, "borderColor", path, str),
  });
}

type BoardContent = Pick<
  BoardState,
  "players" | "balls" | "equipments" | "lines" | "shapes" | "texts"
>;

function list<T>(
  o: Obj,
  key: string,
  path: string,
  max: number,
  parse: (v: unknown, path: string) => T,
  required: boolean,
): T[] {
  if (o[key] === undefined && !required) return [];
  return arr(o[key], `${path}.${key}`, max).map((item, i) =>
    parse(item, `${path}.${key}[${i}]`),
  );
}

function content(o: Obj, path: string, requireEntities: boolean): BoardContent {
  const max = LIMITS.maxItemsPerCollection;
  const result: BoardContent = {
    players: list(
      o,
      "players",
      path,
      LIMITS.maxPlayers,
      player,
      requireEntities,
    ),
    balls: list(o, "balls", path, LIMITS.maxBalls, ball, requireEntities),
    equipments: list(o, "equipments", path, max, equipment, false),
    lines: list(o, "lines", path, max, line, false),
    shapes: list(o, "shapes", path, max, shape, false),
    texts: list(o, "texts", path, max, text, false),
  };
  const seen = new Set<string>();
  for (const items of Object.values(result) as { id: string }[][]) {
    for (const item of items) {
      if (seen.has(item.id)) fail(path, `duplicate id "${item.id}"`);
      seen.add(item.id);
    }
  }
  return result;
}

function run<T>(fn: () => T): Result<T> {
  try {
    return { ok: true, value: fn() };
  } catch (e) {
    if (e instanceof ValidationError) return { ok: false, error: e.message };
    throw e;
  }
}

/** Validates a legacy `BoardState` (exported JSON or the v1 cache's `boardState`). */
export function parseBoardState(input: unknown): Result<BoardState> {
  return run(() => {
    const o = obj(input, "board");
    return {
      ...content(o, "board", true),
      title:
        opt(o, "title", "board", (v, p) => str(v, p, LIMITS.maxTitleLength)) ??
        "",
      notes:
        opt(o, "notes", "board", (v, p) => str(v, p, LIMITS.maxNotesLength)) ??
        "",
    };
  });
}

function paths(v: unknown, path: string): Record<string, Point> {
  const o = obj(v, path);
  const entries = Object.keys(o);
  if (entries.length > LIMITS.maxPlayers + LIMITS.maxBalls) {
    fail(path, "too many curved paths");
  }
  // fromEntries defines own properties, so an ID like "__proto__" stays plain data.
  return Object.fromEntries(
    entries.map((key) => [key, point(o[key], `${path}.${key}`)]),
  );
}

function frame(v: unknown, path: string): AnimationFrame {
  const o = obj(v, path);
  return compact({
    id: id(o.id, `${path}.id`),
    title: str(o.title, `${path}.title`, LIMITS.maxTitleLength),
    ...content(o, path, true),
    notes: opt(o, "notes", path, (x, p) => str(x, p, LIMITS.maxNotesLength)),
    holdMs: int(o.holdMs, `${path}.holdMs`, 0, LIMITS.maxHoldMs),
    durationMs: int(
      o.durationMs,
      `${path}.durationMs`,
      LIMITS.minDurationMs,
      LIMITS.maxDurationMs,
    ),
    paths: opt(o, "paths", path, paths),
  });
}

function selectedFormations(v: unknown, path: string): SelectedFormations {
  const o = obj(v, path);
  const teamId = (x: unknown, p: string) => (x === null ? null : str(x, p));
  const result = { ...DEFAULT_SELECTED_FORMATIONS };
  for (const format of MATCH_FORMATS) {
    if (o[format] === undefined) continue;
    const f = obj(o[format], `${path}.${format}`);
    result[format] = {
      teamA: teamId(f.teamA ?? null, `${path}.${format}.teamA`),
      teamB: teamId(f.teamB ?? null, `${path}.${format}.teamB`),
    };
  }
  return result;
}

function settings(v: unknown, path: string): DocumentSettings {
  const o = obj(v, path);
  return {
    pitchType: oneOf(o.pitchType, `${path}.pitchType`, PITCH_TYPES),
    matchFormat: oneOf(o.matchFormat, `${path}.matchFormat`, MATCH_FORMATS),
    halfPitchTeam: oneOf(o.halfPitchTeam, `${path}.halfPitchTeam`, [
      "A",
      "B",
    ] as const),
    selectedFormations:
      opt(o, "selectedFormations", path, selectedFormations) ??
      DEFAULT_SELECTED_FORMATIONS,
  };
}

function idSet(items: { id: string }[]): string {
  return items
    .map((i) => i.id)
    .sort()
    .join("\u0000");
}

/** Checks cross-frame invariants: unique frame IDs, shared player/ball IDs, total duration. */
export function checkFrames(
  frames: AnimationFrame[],
  path = "frames",
): Result<true> {
  return run(() => {
    if (frames.length === 0) fail(path, "at least one frame is required");
    if (frames.length > LIMITS.maxFrames)
      fail(path, `too many frames (max ${LIMITS.maxFrames})`);
    const ids = new Set<string>();
    const players = idSet(frames[0].players);
    const balls = idSet(frames[0].balls);
    frames.forEach((f, i) => {
      if (ids.has(f.id)) fail(`${path}[${i}]`, `duplicate frame id "${f.id}"`);
      ids.add(f.id);
      if (idSet(f.players) !== players || idSet(f.balls) !== balls) {
        fail(
          `${path}[${i}]`,
          "every frame must contain the same players and balls",
        );
      }
      if (f.paths) {
        const movers = new Set([...f.players, ...f.balls].map((e) => e.id));
        for (const key of Object.keys(f.paths)) {
          if (!movers.has(key)) {
            fail(`${path}[${i}].paths`, `"${key}" is not a player or ball`);
          }
        }
      }
    });
    if (totalDurationMs(frames) > LIMITS.maxTotalMs) {
      fail(
        path,
        `total duration exceeds ${LIMITS.maxTotalMs / 60_000} minutes`,
      );
    }
    return true as const;
  });
}

export function parseDocument(input: unknown): Result<TacticsDocument> {
  return run(() => {
    const o = obj(input, "document");
    if (o.kind !== DOCUMENT_KIND)
      fail("document.kind", "not a tactical board document");
    const version = num(o.schemaVersion, "document.schemaVersion");
    if (version > DOCUMENT_SCHEMA_VERSION) {
      fail("document.schemaVersion", "created by a newer version of the app");
    }
    if (!SUPPORTED_SCHEMA_VERSIONS.includes(version)) {
      fail("document.schemaVersion", `unsupported version ${version}`);
    }
    const frames = arr(o.frames, "document.frames", LIMITS.maxFrames).map(
      (f, i) => frame(f, `document.frames[${i}]`),
    );
    const check = checkFrames(frames, "document.frames");
    if (!check.ok) fail("document", check.error);
    return {
      kind: DOCUMENT_KIND,
      schemaVersion: DOCUMENT_SCHEMA_VERSION,
      title: str(o.title, "document.title", LIMITS.maxTitleLength),
      settings: settings(o.settings, "document.settings"),
      frames,
    };
  });
}

import type {
  MatchFormat,
  PitchType,
  Point,
  TacticFrame,
} from "../types/tactics";

export const EASINGS = ["linear", "easeInOut"] as const;
export type Easing = (typeof EASINGS)[number];

export interface AnimationFrame extends TacticFrame {
  holdMs: number;
  /** Outgoing transition to the next frame; unused on the last frame. */
  durationMs: number;
  /**
   * Quadratic Bézier control points (absolute pitch units) for curved outgoing
   * moves, keyed by player or ball ID. Missing entries move in a straight line.
   */
  paths?: Record<string, Point>;
  /** Pacing of the outgoing move. Stored only as "easeInOut"; absent means linear. */
  easing?: Easing;
}

export interface SequenceState {
  title: string;
  frames: AnimationFrame[];
}

export type SelectedFormations = Record<
  MatchFormat,
  { teamA: string | null; teamB: string | null }
>;

export const DEFAULT_SELECTED_FORMATIONS: SelectedFormations = {
  "11v11": { teamA: "4-3-3", teamB: "4-4-2" },
  "9v9": { teamA: "3-2-3", teamB: "3-3-2" },
  "7v7": { teamA: "2-3-1", teamB: "3-2-1" },
};

export interface DocumentSettings {
  pitchType: PitchType;
  matchFormat: MatchFormat;
  halfPitchTeam: "A" | "B";
  selectedFormations: SelectedFormations;
}

export const DOCUMENT_KIND = "tactical-board-document";
/**
 * v3 added curved paths and v4 added easing. Older documents are read as
 * having neither.
 */
export const DOCUMENT_SCHEMA_VERSION = 4;
export const SUPPORTED_SCHEMA_VERSIONS: readonly number[] = [2, 3, 4];

export interface TacticsDocument {
  kind: typeof DOCUMENT_KIND;
  schemaVersion: typeof DOCUMENT_SCHEMA_VERSION;
  title: string;
  settings: DocumentSettings;
  frames: AnimationFrame[];
}

export type PlaybackRate = 0.25 | 0.5 | 1 | 1.5 | 2;
export const PLAYBACK_RATES: readonly PlaybackRate[] = [0.25, 0.5, 1, 1.5, 2];

export interface PlaybackState {
  status: "paused" | "playing";
  timeMs: number;
  rate: PlaybackRate;
  loop: boolean;
}

export interface SampledFrame {
  frame: TacticFrame;
  sourceFrameId: string;
  targetFrameId?: string;
  phase: "hold" | "move" | "end";
  progress: number;
}

export const LIMITS = {
  maxFrames: 100,
  minDurationMs: 100,
  maxDurationMs: 30_000,
  maxHoldMs: 30_000,
  maxTotalMs: 600_000,
  maxPlayers: 100,
  maxBalls: 50,
  maxItemsPerCollection: 500,
  maxFreehandPoints: 5_000,
  maxTitleLength: 200,
  maxNotesLength: 10_000,
  maxTextLength: 2_000,
  maxStringLength: 200,
  maxImportBytes: 5 * 1024 * 1024,
} as const;

export const DEFAULT_DURATION_MS = 1_000;
export const DEFAULT_HOLD_MS = 0;

/** Pose properties vary per frame; every other player/ball property is sequence-wide. */
export const PLAYER_POSE_KEYS = [
  "x",
  "y",
  "facingAngle",
  "showVisionCone",
] as const;
export const BALL_POSE_KEYS = ["x", "y", "rotation"] as const;

export function isAnimated(seq: SequenceState): boolean {
  return seq.frames.length > 1;
}

export function frameLabel(frame: TacticFrame, index: number): string {
  return frame.title.trim() || `Frame ${index + 1}`;
}

/** Curve control point for an entity's outgoing move, if it has one. */
export function pathControl(
  frame: Pick<AnimationFrame, "paths">,
  entityId: string,
): Point | undefined {
  const { paths } = frame;
  return paths && Object.hasOwn(paths, entityId) ? paths[entityId] : undefined;
}

/** Durations are stored in ms and shown as seconds with two decimals. */
export function toSeconds(ms: number): string {
  return (ms / 1000).toFixed(2);
}

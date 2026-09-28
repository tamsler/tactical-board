import type { BoardState } from "../hooks/useTacticsState";
import type { Ball, Equipment, Player, Point } from "../types/tactics";
import { createId } from "../utils/id";
import {
  BALL_POSE_KEYS,
  DEFAULT_DURATION_MS,
  DEFAULT_HOLD_MS,
  LIMITS,
  PLAYER_POSE_KEYS,
  type AnimationFrame,
  type SequenceState,
} from "./model";
import { totalDurationMs } from "./timeline";
import type { Result } from "./validate";

export function frameFromBoard(
  board: BoardState,
  id = createId("frame"),
): AnimationFrame {
  return {
    id,
    title: "",
    players: board.players,
    balls: board.balls,
    equipments: board.equipments,
    lines: board.lines,
    shapes: board.shapes,
    texts: board.texts,
    notes: board.notes,
    holdMs: DEFAULT_HOLD_MS,
    durationMs: DEFAULT_DURATION_MS,
  };
}

export function sequenceFromBoard(board: BoardState): SequenceState {
  return { title: board.title, frames: [frameFromBoard(board)] };
}

export function frameIndex(seq: SequenceState, frameId: string): number {
  const i = seq.frames.findIndex((f) => f.id === frameId);
  return i === -1 ? 0 : i;
}

export function boardFromSequence(
  seq: SequenceState,
  frameId: string,
): BoardState {
  const f = seq.frames[frameIndex(seq, frameId)];
  return {
    players: f.players,
    balls: f.balls,
    equipments: f.equipments,
    lines: f.lines,
    shapes: f.shapes,
    texts: f.texts,
    title: seq.title,
    notes: f.notes ?? "",
  };
}

// Applies sequence-wide changes (additions, removals, non-pose properties) made
// in one frame to the same entities in another frame.
function propagate<T extends Player | Ball>(
  prevList: T[],
  nextList: T[],
  otherList: T[],
  poseKeys: readonly string[],
): T[] {
  const prevById = new Map(prevList.map((e) => [e.id, e]));
  const nextIds = new Set(nextList.map((e) => e.id));
  const otherIds = new Set(otherList.map((e) => e.id));

  const changes = new Map<string, Record<string, unknown>>();
  for (const n of nextList) {
    const p = prevById.get(n.id);
    if (!p || p === n) continue;
    const diff: Record<string, unknown> = {};
    for (const k of new Set([...Object.keys(p), ...Object.keys(n)])) {
      if (poseKeys.includes(k)) continue;
      const nv = (n as unknown as Record<string, unknown>)[k];
      if ((p as unknown as Record<string, unknown>)[k] !== nv) diff[k] = nv;
    }
    if (Object.keys(diff).length > 0) changes.set(n.id, diff);
  }

  const removed = prevList.some((e) => !nextIds.has(e.id));
  const added = nextList.filter(
    (e) => !prevById.has(e.id) && !otherIds.has(e.id),
  );
  if (!removed && added.length === 0 && changes.size === 0) return otherList;

  const kept = otherList
    .filter((e) => !(prevById.has(e.id) && !nextIds.has(e.id)))
    .map((e) => {
      const diff = changes.get(e.id);
      if (!diff) return e;
      const merged = { ...e, ...diff } as Record<string, unknown>;
      for (const [k, v] of Object.entries(diff))
        if (v === undefined) delete merged[k];
      return merged as unknown as T;
    });
  return added.length > 0 ? [...kept, ...added] : kept;
}

/**
 * Writes an edited board into the selected frame. Player/ball additions,
 * removals and sequence-wide property changes are applied to every frame.
 */
export function applyBoardEdit(
  seq: SequenceState,
  frameId: string,
  prev: BoardState,
  next: BoardState,
): SequenceState {
  const index = frameIndex(seq, frameId);
  const frames = seq.frames.map((f, i) => {
    if (i === index) {
      return {
        ...f,
        players: next.players,
        balls: next.balls,
        equipments: next.equipments,
        lines: next.lines,
        shapes: next.shapes,
        texts: next.texts,
        notes: next.notes,
      };
    }
    const players =
      prev.players === next.players
        ? f.players
        : propagate(prev.players, next.players, f.players, PLAYER_POSE_KEYS);
    const balls =
      prev.balls === next.balls
        ? f.balls
        : propagate(prev.balls, next.balls, f.balls, BALL_POSE_KEYS);
    return players === f.players && balls === f.balls
      ? f
      : { ...f, players, balls };
  });
  const removed = [...prev.players, ...prev.balls]
    .map((e) => e.id)
    .filter(
      (id) =>
        !next.players.some((p) => p.id === id) &&
        !next.balls.some((b) => b.id === id),
    );
  return {
    title: next.title,
    frames:
      removed.length > 0 ? frames.map((f) => withoutPaths(f, removed)) : frames,
  };
}

function withPaths(
  frame: AnimationFrame,
  paths: Record<string, Point> | undefined,
): AnimationFrame {
  const next: AnimationFrame = { ...frame };
  delete next.paths;
  return paths && Object.keys(paths).length > 0 ? { ...next, paths } : next;
}

function withoutPaths(frame: AnimationFrame, ids: string[]): AnimationFrame {
  if (!frame.paths || !ids.some((id) => Object.hasOwn(frame.paths!, id))) {
    return frame;
  }
  return withPaths(
    frame,
    Object.fromEntries(
      Object.entries(frame.paths).filter(([id]) => !ids.includes(id)),
    ),
  );
}

// A curve belongs to one source/target pair; drop it when a frame's next frame changes.
function reconcilePaths(
  before: AnimationFrame[],
  after: AnimationFrame[],
): AnimationFrame[] {
  const nextBefore = new Map(before.map((f, i) => [f.id, before[i + 1]?.id]));
  return after.map((f, i) =>
    f.paths && nextBefore.get(f.id) !== after[i + 1]?.id
      ? withPaths(f, undefined)
      : f,
  );
}

/** Sets or clears (`control: null`) the curve of one entity's outgoing move. */
export function setPathControl(
  seq: SequenceState,
  frameId: string,
  entityId: string,
  control: Point | null,
): SequenceState {
  const index = frameIndex(seq, frameId);
  const frame = seq.frames[index];
  const exists = [...frame.players, ...frame.balls].some(
    (e) => e.id === entityId,
  );
  if (!exists || index === seq.frames.length - 1) return seq;
  if (control && !(Number.isFinite(control.x) && Number.isFinite(control.y))) {
    return seq;
  }
  const rest = Object.fromEntries(
    Object.entries(frame.paths ?? {}).filter(([id]) => id !== entityId),
  );
  const paths = control
    ? {
        ...rest,
        ...Object.fromEntries([[entityId, { x: control.x, y: control.y }]]),
      }
    : rest;
  const frames = [...seq.frames];
  frames[index] = withPaths(frame, paths);
  return { ...seq, frames };
}

export function duplicateFrame(
  seq: SequenceState,
  frameId: string,
): { seq: SequenceState; frameId: string } | null {
  if (seq.frames.length >= LIMITS.maxFrames) return null;
  const index = frameIndex(seq, frameId);
  const source = seq.frames[index];
  // The copy has the source's pose, so the source's curves now start from the copy.
  const copy: AnimationFrame = withPaths(
    { ...source, id: createId("frame"), title: "" },
    source.paths,
  );
  const frames = [...seq.frames];
  frames[index] = withPaths(source, undefined);
  frames.splice(index + 1, 0, copy);
  if (totalDurationMs(frames) > LIMITS.maxTotalMs) return null;
  return { seq: { ...seq, frames }, frameId: copy.id };
}

export function deleteFrame(
  seq: SequenceState,
  frameId: string,
): { seq: SequenceState; frameId: string } | null {
  if (seq.frames.length <= 1) return null;
  const index = frameIndex(seq, frameId);
  const frames = reconcilePaths(
    seq.frames,
    seq.frames.filter((_, i) => i !== index),
  );
  return {
    seq: { ...seq, frames },
    frameId: frames[Math.max(0, index - 1)].id,
  };
}

export function moveFrame(
  seq: SequenceState,
  frameId: string,
  toIndex: number,
): SequenceState {
  const from = frameIndex(seq, frameId);
  const to = Math.max(0, Math.min(seq.frames.length - 1, toIndex));
  if (from === to) return seq;
  const frames = [...seq.frames];
  const [moved] = frames.splice(from, 1);
  frames.splice(to, 0, moved);
  return { ...seq, frames: reconcilePaths(seq.frames, frames) };
}

export function setFrameTiming(
  seq: SequenceState,
  frameId: string,
  timing: { holdMs?: number; durationMs?: number },
): Result<SequenceState> {
  const { holdMs, durationMs } = timing;
  if (
    holdMs !== undefined &&
    (!Number.isInteger(holdMs) || holdMs < 0 || holdMs > LIMITS.maxHoldMs)
  ) {
    return {
      ok: false,
      error: `Hold must be between 0 and ${LIMITS.maxHoldMs / 1000} seconds.`,
    };
  }
  if (
    durationMs !== undefined &&
    (!Number.isInteger(durationMs) ||
      durationMs < LIMITS.minDurationMs ||
      durationMs > LIMITS.maxDurationMs)
  ) {
    return {
      ok: false,
      error: `Duration must be between ${LIMITS.minDurationMs / 1000} and ${LIMITS.maxDurationMs / 1000} seconds.`,
    };
  }
  const index = frameIndex(seq, frameId);
  const frames = seq.frames.map((f, i) =>
    i === index
      ? {
          ...f,
          holdMs: holdMs ?? f.holdMs,
          durationMs: durationMs ?? f.durationMs,
        }
      : f,
  );
  if (totalDurationMs(frames) > LIMITS.maxTotalMs) {
    return {
      ok: false,
      error: `Total length cannot exceed ${LIMITS.maxTotalMs / 60_000} minutes.`,
    };
  }
  return { ok: true, value: { ...seq, frames } };
}

function sameEquipment(a: Equipment, b: Equipment): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].every(
    (k) => a[k as keyof Equipment] === b[k as keyof Equipment],
  );
}

/** How many frames already hold this equipment item exactly as it is in `frameId`. */
export function equipmentCopyCount(
  seq: SequenceState,
  frameId: string,
  equipmentId: string,
): number {
  const source = seq.frames[frameIndex(seq, frameId)].equipments.find(
    (e) => e.id === equipmentId,
  );
  if (!source) return 0;
  return seq.frames.filter((f) =>
    f.equipments.some((e) => e.id === equipmentId && sameEquipment(e, source)),
  ).length;
}

/**
 * Places one equipment item, exactly as it is in `frameId`, in every frame:
 * frames that already have it (same ID) are overwritten, the rest get it
 * appended. Returns null when a frame is at the equipment limit.
 */
export function copyEquipmentToAllFrames(
  seq: SequenceState,
  frameId: string,
  equipmentId: string,
): SequenceState | null {
  const source = seq.frames[frameIndex(seq, frameId)].equipments.find(
    (e) => e.id === equipmentId,
  );
  if (!source) return seq;
  let changed = false;
  const frames = seq.frames.map((f) => {
    const i = f.equipments.findIndex((e) => e.id === equipmentId);
    if (i !== -1 && sameEquipment(f.equipments[i], source)) return f;
    changed = true;
    const equipments = [...f.equipments];
    if (i === -1) equipments.push(source);
    else equipments[i] = source;
    return { ...f, equipments };
  });
  if (frames.some((f) => f.equipments.length > LIMITS.maxItemsPerCollection)) {
    return null;
  }
  return changed ? { ...seq, frames } : seq;
}

/** Removes one equipment item (by ID) from every frame. */
export function removeEquipmentFromAllFrames(
  seq: SequenceState,
  equipmentId: string,
): SequenceState {
  let changed = false;
  const frames = seq.frames.map((f) => {
    if (!f.equipments.some((e) => e.id === equipmentId)) return f;
    changed = true;
    return {
      ...f,
      equipments: f.equipments.filter((e) => e.id !== equipmentId),
    };
  });
  return changed ? { ...seq, frames } : seq;
}

export function renameFrame(
  seq: SequenceState,
  frameId: string,
  title: string,
): SequenceState {
  const index = frameIndex(seq, frameId);
  const frames = seq.frames.map((f, i) =>
    i === index ? { ...f, title: title.slice(0, LIMITS.maxTitleLength) } : f,
  );
  return { ...seq, frames };
}

/**
 * Moves a team's existing players onto formation slots while keeping their IDs:
 * goalkeepers first, then field players in their current order. Returns null
 * when the player count does not match the formation.
 */
export function assignFormationSlots(
  players: Player[],
  slots: (Point & { isGoalkeeper?: boolean })[],
): Player[] | null {
  if (players.length !== slots.length) return null;
  const byRole = <T extends { isGoalkeeper?: boolean }>(items: T[]) => [
    ...items.filter((i) => i.isGoalkeeper),
    ...items.filter((i) => !i.isGoalkeeper),
  ];
  const orderedSlots = byRole(slots);
  return byRole(players).map((p, i) => ({
    ...p,
    x: orderedSlots[i].x,
    y: orderedSlots[i].y,
  }));
}

import { PITCH_HEIGHT, PITCH_WIDTH } from "../constants/formations";
import type { BoardState } from "../hooks/useTacticsState";
import type { Point } from "../types/tactics";

export const NUDGE_STEP = 1;
export const NUDGE_STEP_LARGE = 10;

export type NudgeTarget =
  "player" | "ball" | "equipment" | "line" | "shape" | "text";

type NudgeKey = Pick<
  KeyboardEvent,
  "key" | "shiftKey" | "ctrlKey" | "metaKey" | "altKey"
>;

/** The move an arrow key asks for, or null when the key is not a nudge. */
export function nudgeDeltaForKey(e: NudgeKey): { dx: number; dy: number } | null {
  if (e.ctrlKey || e.metaKey || e.altKey) return null;
  const step = e.shiftKey ? NUDGE_STEP_LARGE : NUDGE_STEP;
  switch (e.key) {
    case "ArrowLeft":
      return { dx: -step, dy: 0 };
    case "ArrowRight":
      return { dx: step, dy: 0 };
    case "ArrowUp":
      return { dx: 0, dy: -step };
    case "ArrowDown":
      return { dx: 0, dy: step };
    default:
      return null;
  }
}

// Shortens a move so [min, max] stays within [0, limit]. A span already past
// an edge may not go further out but can always come back in.
function clampDelta(delta: number, min: number, max: number, limit: number) {
  const lowest = Math.min(0, -min);
  const highest = Math.max(0, limit - max);
  return Math.max(lowest, Math.min(highest, delta));
}

function clampMove(points: Point[], dx: number, dy: number): Point {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return {
    x: clampDelta(dx, Math.min(...xs), Math.max(...xs), PITCH_WIDTH),
    y: clampDelta(dy, Math.min(...ys), Math.max(...ys), PITCH_HEIGHT),
  };
}

function moveOne<T extends { id: string }>(
  items: T[],
  id: string,
  bounds: (item: T) => Point[],
  move: (item: T, by: Point) => T,
  dx: number,
  dy: number,
): T[] {
  const item = items.find((i) => i.id === id);
  if (!item) return items;
  const points = bounds(item);
  if (points.length === 0) return items;
  const by = clampMove(points, dx, dy);
  if (by.x === 0 && by.y === 0) return items;
  return items.map((i) => (i === item ? move(item, by) : i));
}

const position = (item: Point): Point[] => [{ x: item.x, y: item.y }];
const shift = <T extends Point>(item: T, by: Point): T => ({
  ...item,
  x: item.x + by.x,
  y: item.y + by.y,
});

/**
 * Moves one item by (dx, dy) pitch units, stopping at the canvas edge.
 * Returns the same board when nothing moved.
 */
export function nudgeBoard(
  board: BoardState,
  id: string,
  type: NudgeTarget,
  dx: number,
  dy: number,
): BoardState {
  switch (type) {
    case "player": {
      const players = moveOne(board.players, id, position, shift, dx, dy);
      return players === board.players ? board : { ...board, players };
    }
    case "ball": {
      const balls = moveOne(board.balls, id, position, shift, dx, dy);
      return balls === board.balls ? board : { ...board, balls };
    }
    case "equipment": {
      const equipments = moveOne(board.equipments, id, position, shift, dx, dy);
      return equipments === board.equipments ? board : { ...board, equipments };
    }
    case "text": {
      const texts = moveOne(board.texts, id, position, shift, dx, dy);
      return texts === board.texts ? board : { ...board, texts };
    }
    case "line": {
      // The control point moves with the line but does not limit it: it sits
      // off the curve and may lie off the canvas.
      const lines = moveOne(
        board.lines,
        id,
        (l) => l.points,
        (l, by) => ({
          ...l,
          points: l.points.map((p) => shift(p, by)),
          controlPoint: l.controlPoint && shift(l.controlPoint, by),
        }),
        dx,
        dy,
      );
      return lines === board.lines ? board : { ...board, lines };
    }
    case "shape": {
      const shapes = moveOne(
        board.shapes,
        id,
        (s) => [
          { x: s.x, y: s.y },
          { x: s.x + s.width, y: s.y + s.height },
        ],
        shift,
        dx,
        dy,
      );
      return shapes === board.shapes ? board : { ...board, shapes };
    }
  }
}

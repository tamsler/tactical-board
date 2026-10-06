import { PITCH_HEIGHT, PITCH_WIDTH } from "../constants/formations";
import type { MatchFormat, Point, TextAnnotation } from "../types/tactics";
import {
  BALL_POSE_KEYS,
  PLAYER_POSE_KEYS,
  type AnimationFrame,
  type TacticsDocument,
} from "./model";

const TEAM_SIZE: Record<MatchFormat, number> = {
  "11v11": 11,
  "9v9": 9,
  "7v7": 7,
};
/** Player tokens closer than this (centre to centre) visibly overlap. */
const MIN_PLAYER_GAP = 24;
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

/** Right edge of a text box, estimated the way PitchDrawings sizes it (no wrapping). */
function textRightEdge(t: TextAnnotation): number {
  const longest = Math.max(...t.text.split(/\r?\n/).map((l) => l.length), 1);
  const boxWidth = Math.max(50, Math.round(longest * t.fontSize * 0.58 + 24));
  return t.x - 12 + boxWidth;
}

function onPitch(p: Point): boolean {
  return p.x >= 0 && p.x <= PITCH_WIDTH && p.y >= 0 && p.y <= PITCH_HEIGHT;
}

/** The properties that must match in every frame, as a comparable string. */
function identity(entity: object, poseKeys: readonly string[]): string {
  const rest = Object.entries(entity)
    .filter(([key]) => !poseKeys.includes(key))
    .sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(rest);
}

function lintFrame(
  frame: AnimationFrame,
  path: string,
  warn: (message: string) => void,
) {
  const place = (kind: string, id: string, p: Point) => {
    if (!onPitch(p)) {
      warn(`${path}: ${kind} "${id}" is off the pitch at (${p.x}, ${p.y})`);
    }
  };
  const color = (kind: string, id: string, field: string, value: string) => {
    if (!HEX_COLOR.test(value)) {
      warn(`${path}: ${kind} "${id}" ${field} "${value}" is not #rrggbb`);
    }
  };

  for (const p of frame.players) {
    place("player", p.id, p);
    color("player", p.id, "color", p.color);
    color("player", p.id, "textColor", p.textColor);
  }
  for (const b of frame.balls) place("ball", b.id, b);
  for (const e of frame.equipments) place("equipment", e.id, e);
  for (const t of frame.texts) {
    place("text", t.id, t);
    color("text", t.id, "color", t.color);
    if (onPitch(t) && textRightEdge(t) > PITCH_WIDTH) {
      warn(`${path}: text "${t.id}" runs off the right edge; shorten it`);
    }
  }
  for (const s of frame.shapes) {
    place("shape", s.id, s);
    place("shape", s.id, { x: s.x + s.width, y: s.y + s.height });
    color("shape", s.id, "color", s.color);
    color("shape", s.id, "strokeColor", s.strokeColor);
  }
  for (const l of frame.lines) {
    if (l.points.length < 2) {
      warn(`${path}: line "${l.id}" needs at least two points to be drawn`);
    }
    l.points.forEach((p) => place("line", l.id, p));
    color("line", l.id, "color", l.color);
  }

  frame.players.forEach((a, i) => {
    for (const b of frame.players.slice(i + 1)) {
      if (Math.hypot(a.x - b.x, a.y - b.y) < MIN_PLAYER_GAP) {
        warn(`${path}: players "${a.id}" and "${b.id}" overlap`);
      }
    }
  });
}

/**
 * Advisory checks for a document that already passed `parseDocument`: things
 * the app accepts but that look wrong on the board. Returns one message per
 * finding; an empty list means nothing to report.
 */
export function lintDocument(doc: TacticsDocument): string[] {
  const warnings: string[] = [];
  const warn = (message: string) => warnings.push(message);
  const { frames } = doc;
  const first = frames[0];

  const teamSize = TEAM_SIZE[doc.settings.matchFormat];
  for (const team of ["A", "B"] as const) {
    const count = first.players.filter((p) => p.team === team).length;
    if (count > teamSize) {
      warn(
        `frames: team ${team} has ${count} players, more than a ${doc.settings.matchFormat} side`,
      );
    }
  }

  const playerIdentity = new Map(
    first.players.map((p) => [p.id, identity(p, PLAYER_POSE_KEYS)]),
  );
  const ballIdentity = new Map(
    first.balls.map((b) => [b.id, identity(b, BALL_POSE_KEYS)]),
  );

  frames.forEach((frame, i) => {
    const path = `frames[${i}]`;
    lintFrame(frame, path, warn);

    for (const p of frame.players) {
      if (identity(p, PLAYER_POSE_KEYS) !== playerIdentity.get(p.id)) {
        warn(
          `${path}: player "${p.id}" differs from frame 0 in more than position, facingAngle and showVisionCone`,
        );
      }
    }
    for (const b of frame.balls) {
      if (identity(b, BALL_POSE_KEYS) !== ballIdentity.get(b.id)) {
        warn(
          `${path}: ball "${b.id}" differs from frame 0 in more than position and rotation`,
        );
      }
    }

    const curved = Object.keys(frame.paths ?? {});
    if (curved.length > 0 && i === frames.length - 1) {
      warn(`${path}: paths on the last frame are never played`);
    }
    for (const id of curved) {
      if (!onPitch(frame.paths![id])) {
        warn(`${path}: the curved path for "${id}" bends off the pitch`);
      }
    }
  });

  return warnings;
}

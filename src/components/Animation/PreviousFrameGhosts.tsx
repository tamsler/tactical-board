import React from "react";
import type { Ball, Player, Point } from "../../types/tactics";
import { angle, getArrowHeadPath } from "../../utils/mathUtils";
import {
  curveLength,
  curveMidpoint,
  pointAtLength,
  straightControl,
} from "../../animation/path";

interface PreviousFrameGhostsProps {
  previousPlayers: Player[];
  previousBalls: Ball[];
  currentPlayers: Player[];
  currentBalls: Ball[];
  isPlayerVisible: (p: Player) => boolean;
  /** Curve control point of each entity's move into the current frame. */
  controlFor: (entityId: string) => Point | undefined;
  /** Enables bend handles; omit to hide them. */
  onHandlePointerDown?: (
    entityId: string,
    from: Point,
    to: Point,
    e: React.PointerEvent,
  ) => void;
  onHandleReset?: (entityId: string) => void;
}

interface Guide {
  id: string;
  from: Point;
  to: Point;
  control: Point;
  curved: boolean;
  arrowTip: Point;
  arrowAngle: number;
}

function guideFor(
  id: string,
  from: Point,
  to: Point,
  inset: number,
  control: Point | undefined,
): Guide | null {
  const c = control ?? straightControl(from, to);
  const length = curveLength(from, c, to);
  if (length <= inset * 1.5) return null;
  // Stop the arrow at the token's edge; the token hides the rest of the curve.
  const s = (length - inset) / length;
  const tip = pointAtLength(from, c, to, s);
  const behind = pointAtLength(from, c, to, Math.max(0, s - 0.05));
  return {
    id,
    from,
    to,
    control: c,
    curved: !!control,
    arrowTip: tip,
    arrowAngle: angle(behind, tip),
  };
}

/** Previous-frame positions, movement guides and bend handles; excluded from exports. */
export const PreviousFrameGhosts: React.FC<PreviousFrameGhostsProps> = ({
  previousPlayers,
  previousBalls,
  currentPlayers,
  currentBalls,
  isPlayerVisible,
  controlFor,
  onHandlePointerDown,
  onHandleReset,
}) => {
  const currentPlayerById = new Map(currentPlayers.map((p) => [p.id, p]));
  const currentBallById = new Map(currentBalls.map((b) => [b.id, b]));
  const players = previousPlayers.filter(isPlayerVisible);
  const guides: Guide[] = [];

  for (const p of players) {
    const now = currentPlayerById.get(p.id);
    const g =
      now && guideFor(p.id, p, now, (now.radius || 18) + 2, controlFor(p.id));
    if (g) guides.push(g);
  }
  for (const b of previousBalls) {
    const now = currentBallById.get(b.id);
    const g =
      now && guideFor(b.id, b, now, (now.size || 12) + 2, controlFor(b.id));
    if (g) guides.push(g);
  }

  return (
    <g data-editor-only="" className="pointer-events-none" aria-hidden="true">
      {players.map((p) => {
        const r = p.radius || 18;
        return (
          <g key={`ghost-${p.id}`} opacity={0.35}>
            <circle
              cx={p.x}
              cy={p.y}
              r={r}
              fill={p.color}
              fillOpacity={0.35}
              stroke={p.color}
              strokeWidth={2}
              strokeDasharray="4 3"
            />
            <text
              x={p.x}
              y={p.y + 4}
              textAnchor="middle"
              fontSize={11}
              fontWeight={700}
              fill="#ffffff"
            >
              {p.number}
            </text>
          </g>
        );
      })}
      {previousBalls.map((b) => (
        <circle
          key={`ghost-${b.id}`}
          cx={b.x}
          cy={b.y}
          r={b.size || 12}
          fill="#ffffff"
          fillOpacity={0.25}
          stroke="#ffffff"
          strokeOpacity={0.6}
          strokeWidth={1.5}
          strokeDasharray="3 3"
        />
      ))}
      {guides.map((g) => (
        <g key={`guide-${g.id}`} opacity={0.75}>
          <path
            d={`M ${g.from.x} ${g.from.y} Q ${g.control.x} ${g.control.y} ${g.to.x} ${g.to.y}`}
            fill="none"
            stroke={g.curved ? "#fcd34d" : "#f8fafc"}
            strokeWidth={1.5}
            strokeDasharray="6 5"
          />
          <path
            d={getArrowHeadPath(g.arrowTip, g.arrowAngle, 9)}
            fill={g.curved ? "#fcd34d" : "#f8fafc"}
          />
        </g>
      ))}
      {onHandlePointerDown &&
        guides.map((g) => {
          const m = curveMidpoint(g.from, g.control, g.to);
          return (
            <g
              key={`handle-${g.id}`}
              data-path-handle={g.id}
              style={{ pointerEvents: "all", cursor: "move" }}
              onPointerDown={(e) => onHandlePointerDown(g.id, g.from, g.to, e)}
              onDoubleClick={() => onHandleReset?.(g.id)}
            >
              <title>
                Drag to curve this move · double-click to straighten
              </title>
              <circle cx={m.x} cy={m.y} r={16} fill="transparent" />
              <circle
                cx={m.x}
                cy={m.y}
                r={6}
                fill={g.curved ? "#f59e0b" : "#0f172a"}
                stroke={g.curved ? "#fde68a" : "#f8fafc"}
                strokeWidth={2}
              />
            </g>
          );
        })}
    </g>
  );
};

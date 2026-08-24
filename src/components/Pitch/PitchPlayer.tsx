import React from "react";
import type { Player } from "../../types/tactics";
import { getContrastTextColor } from "../../utils/mathUtils";

interface PitchPlayerProps {
  player: Player;
  isSelected: boolean;
  showPlayerLabels?: boolean;
  onSelect: (id: string, e: React.MouseEvent | React.TouchEvent) => void;
  onPointerDown: (id: string, e: React.PointerEvent) => void;
}

export const PitchPlayer: React.FC<PitchPlayerProps> = ({
  player,
  isSelected,
  showPlayerLabels = true,
  onPointerDown,
}) => {
  const radius = player.radius || 18;
  const hasFacing = player.facingAngle !== undefined && player.showVisionCone;
  const contrastTextColor =
    player.textColor && player.textColor !== "#ffffff"
      ? player.textColor
      : getContrastTextColor(player.color);

  // Calculate vision cone polygon points if facing angle is active
  const renderVisionCone = () => {
    if (!hasFacing || player.facingAngle === undefined) return null;
    const rad = (player.facingAngle * Math.PI) / 180;
    const fov = (55 * Math.PI) / 180; // 55 degree field of view
    const length = 60;

    const leftAngle = rad - fov / 2;
    const rightAngle = rad + fov / 2;

    const x1 = player.x + length * Math.cos(leftAngle);
    const y1 = player.y + length * Math.sin(leftAngle);
    const x2 = player.x + length * Math.cos(rightAngle);
    const y2 = player.y + length * Math.sin(rightAngle);

    return (
      <g className="pointer-events-none">
        <path
          d={`M ${player.x} ${player.y} L ${x1} ${y1} A ${length} ${length} 0 0 1 ${x2} ${y2} Z`}
          fill={player.color}
          fillOpacity="0.22"
          stroke={player.color}
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        {/* Facing arrow pointer */}
        <line
          x1={player.x}
          y1={player.y}
          x2={player.x + (radius + 12) * Math.cos(rad)}
          y2={player.y + (radius + 12) * Math.sin(rad)}
          stroke={player.color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>
    );
  };

  return (
    <g
      className="cursor-grab active:cursor-grabbing transition-transform select-none"
      onPointerDown={(e) => {
        e.stopPropagation();
        onPointerDown(player.id, e);
      }}
    >
      {/* Vision / Body Orientation Cone */}
      {renderVisionCone()}

      {/* Selected Glow Ring */}
      {isSelected && (
        <circle
          cx={player.x}
          cy={player.y}
          r={radius + 6}
          fill="none"
          stroke="#38bdf8"
          strokeWidth="3"
          strokeDasharray="4 3"
          className="animate-pulse"
        />
      )}

      {/* Player Drop Shadow */}
      <circle
        cx={player.x}
        cy={player.y + 2.5}
        r={radius}
        fill="#000000"
        fillOpacity="0.35"
      />

      {/* Player Circle Token */}
      <circle
        cx={player.x}
        cy={player.y}
        r={radius}
        fill={player.color}
        stroke={
          contrastTextColor === "#0f172a"
            ? "#0f172a"
            : player.isGoalkeeper
              ? "#ffffff"
              : "#ffffff"
        }
        strokeWidth={player.isGoalkeeper ? "3" : "2.5"}
      />

      {/* GK Special Inner Ring */}
      {player.isGoalkeeper && (
        <circle
          cx={player.x}
          cy={player.y}
          r={radius - 4}
          fill="none"
          stroke={contrastTextColor === "#0f172a" ? "#0f172a" : "#ffffff"}
          strokeWidth="1"
          strokeDasharray="2 2"
          opacity="0.8"
        />
      )}

      {/* Player Number */}
      <text
        x={player.x}
        y={player.y + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fill={contrastTextColor}
        fontSize={radius > 16 ? "13" : "11"}
        fontWeight="800"
        fontFamily="system-ui, -apple-system, sans-serif"
        className="pointer-events-none"
      >
        {player.number}
      </text>

      {/* Optional Player Name or Role Tag Below */}
      {player.name && showPlayerLabels && (
        <g className="pointer-events-none">
          <rect
            x={player.x - 30}
            y={player.y + radius + 3}
            width="60"
            height="14"
            rx="3"
            fill="#0f172a"
            fillOpacity="0.85"
            stroke="#475569"
            strokeWidth="0.75"
          />
          <text
            x={player.x}
            y={player.y + radius + 10}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#f8fafc"
            fontSize="9"
            fontWeight="600"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            {player.name}
          </text>
        </g>
      )}
    </g>
  );
};

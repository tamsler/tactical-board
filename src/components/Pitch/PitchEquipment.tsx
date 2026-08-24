import React from "react";
import type { Equipment } from "../../types/tactics";

interface PitchEquipmentProps {
  equipment: Equipment;
  isSelected: boolean;
  onPointerDown: (id: string, e: React.PointerEvent) => void;
}

export const PitchEquipment: React.FC<PitchEquipmentProps> = ({
  equipment,
  isSelected,
  onPointerDown,
}) => {
  const { type, x, y, scale = 1.0 } = equipment;

  const renderItem = () => {
    switch (type) {
      case "cone-orange":
      case "cone-yellow":
      case "cone-blue": {
        const coneColor =
          type === "cone-orange"
            ? "#f97316"
            : type === "cone-yellow"
              ? "#facc15"
              : "#38bdf8";
        return (
          <g>
            {/* Cone base */}
            <ellipse
              cx={x}
              cy={y + 8}
              rx="12"
              ry="5"
              fill="#000000"
              fillOpacity="0.3"
            />
            <ellipse
              cx={x}
              cy={y + 6}
              rx="10"
              ry="4"
              fill={coneColor}
              stroke="#000000"
              strokeWidth="0.8"
            />
            {/* Cone triangle */}
            <polygon
              points={`${x},${y - 12} ${x - 8},${y + 6} ${x + 8},${y + 6}`}
              fill={coneColor}
              stroke="#000000"
              strokeWidth="0.8"
            />
            {/* White reflective stripe */}
            <polygon
              points={`${x - 3.5},${y - 2} ${x + 3.5},${y - 2} ${x + 5},${y + 2} ${x - 5},${y + 2}`}
              fill="#ffffff"
            />
          </g>
        );
      }
      case "mannequin": {
        return (
          <g>
            {/* Mannequin / Wall dummy */}
            <ellipse
              cx={x}
              cy={y + 16}
              rx="14"
              ry="5"
              fill="#000000"
              fillOpacity="0.35"
            />
            {/* Head */}
            <circle
              cx={x}
              cy={y - 16}
              r="6"
              fill="#cbd5e1"
              stroke="#334155"
              strokeWidth="1"
            />
            {/* Torso */}
            <rect
              x={x - 10}
              y={y - 9}
              width="20"
              height="20"
              rx="3"
              fill="#94a3b8"
              stroke="#334155"
              strokeWidth="1.2"
            />
            {/* Metal Base stand */}
            <line
              x1={x - 6}
              y1={y + 11}
              x2={x - 6}
              y2={y + 17}
              stroke="#475569"
              strokeWidth="2"
            />
            <line
              x1={x + 6}
              y1={y + 11}
              x2={x + 6}
              y2={y + 17}
              stroke="#475569"
              strokeWidth="2"
            />
          </g>
        );
      }
      case "mini-goal": {
        return (
          <g>
            {/* Mini training goal */}
            <rect
              x={x - 22}
              y={y - 14}
              width="44"
              height="28"
              fill="#ffffff"
              fillOpacity="0.15"
              stroke="#ef4444"
              strokeWidth="2"
              rx="2"
            />
            {/* Net mesh */}
            <line
              x1={x - 11}
              y1={y - 14}
              x2={x - 11}
              y2={y + 14}
              stroke="#ffffff"
              strokeWidth="0.8"
              strokeDasharray="2 2"
            />
            <line
              x1={x}
              y1={y - 14}
              x2={x}
              y2={y + 14}
              stroke="#ffffff"
              strokeWidth="0.8"
              strokeDasharray="2 2"
            />
            <line
              x1={x + 11}
              y1={y - 14}
              x2={x + 11}
              y2={y + 14}
              stroke="#ffffff"
              strokeWidth="0.8"
              strokeDasharray="2 2"
            />
            <line
              x1={x - 22}
              y1={y}
              x2={x + 22}
              y2={y}
              stroke="#ffffff"
              strokeWidth="0.8"
              strokeDasharray="2 2"
            />
          </g>
        );
      }
      case "ladder": {
        return (
          <g>
            <line
              x1={x - 30}
              y1={y - 10}
              x2={x + 30}
              y2={y - 10}
              stroke="#f59e0b"
              strokeWidth="2"
            />
            <line
              x1={x - 30}
              y1={y + 10}
              x2={x + 30}
              y2={y + 10}
              stroke="#f59e0b"
              strokeWidth="2"
            />
            {[-25, -15, -5, 5, 15, 25].map((lx) => (
              <line
                key={lx}
                x1={x + lx}
                y1={y - 10}
                x2={x + lx}
                y2={y + 10}
                stroke="#f59e0b"
                strokeWidth="1.5"
              />
            ))}
          </g>
        );
      }
      case "pole":
      default: {
        return (
          <g>
            <ellipse
              cx={x}
              cy={y + 10}
              rx="7"
              ry="3"
              fill="#000000"
              fillOpacity="0.3"
            />
            <line
              x1={x}
              y1={y - 18}
              x2={x}
              y2={y + 10}
              stroke="#e2e8f0"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx={x} cy={y - 18} r="4" fill="#ef4444" />
          </g>
        );
      }
    }
  };

  return (
    <g
      className="cursor-grab active:cursor-grabbing select-none"
      transform={`translate(${x}, ${y}) scale(${scale}) translate(${-x}, ${-y})`}
      onPointerDown={(e) => {
        e.stopPropagation();
        onPointerDown(equipment.id, e);
      }}
    >
      {isSelected && (
        <rect
          x={x - 26}
          y={y - 22}
          width="52"
          height="44"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="1.5"
          strokeDasharray="3 2"
          rx="4"
        />
      )}
      {renderItem()}
    </g>
  );
};

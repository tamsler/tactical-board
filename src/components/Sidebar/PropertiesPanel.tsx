import React from "react";
import type { useTacticsState } from "../../hooks/useTacticsState";
import { Trash2 } from "lucide-react";

interface PropertiesPanelProps {
  tactics: ReturnType<typeof useTacticsState>;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  tactics,
}) => {
  const {
    state,
    selectedId,
    selectedType,
    updatePlayer,
    updateBall,
    updateLine,
    updateShape,
    updateText,
    deleteSelected,
  } = tactics;

  if (!selectedId || !selectedType) {
    return (
      <div className="p-4 text-xs text-slate-400 text-center flex flex-col items-center justify-center h-48 border border-slate-800/80 rounded-xl bg-slate-900/50">
        <span className="text-2xl mb-2">👆</span>
        <div className="font-semibold text-slate-300">Nothing Selected</div>
        <p className="mt-1 text-[11px] text-slate-500">
          Click on any player, line, shape, or ball on the pitch to edit its
          properties.
        </p>
      </div>
    );
  }

  // 1. PLAYER PROPERTIES
  if (selectedType === "player") {
    const player = state.players.find((p) => p.id === selectedId);
    if (!player) return null;

    const playerColors = [
      "#ef4444",
      "#dc2626",
      "#3b82f6",
      "#2563eb",
      "#eab308",
      "#22c55e",
      "#10b981",
      "#a855f7",
      "#f97316",
      "#06b6d4",
      "#ffffff",
      "#1e293b",
    ];

    return (
      <div className="space-y-4 p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-200">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-100">
            <div
              className="w-4 h-4 rounded-full border border-white/50"
              style={{ backgroundColor: player.color }}
            />
            Player #{player.number}
          </div>
          <button
            onClick={deleteSelected}
            title="Delete Player"
            className="p-1.5 hover:bg-rose-950/60 text-rose-400 rounded-lg transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Number & Name Inputs */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Number / Label
            </label>
            <input
              type="text"
              value={player.number}
              onChange={(e) =>
                updatePlayer(player.id, { number: e.target.value })
              }
              maxLength={4}
              className="w-full bg-slate-800 border border-slate-700 px-2.5 py-1.5 rounded-lg text-slate-100 font-bold text-center focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Name / Role
            </label>
            <input
              type="text"
              value={player.name || ""}
              onChange={(e) =>
                updatePlayer(player.id, { name: e.target.value })
              }
              placeholder="e.g. RW / Messi"
              className="w-full bg-slate-800 border border-slate-700 px-2.5 py-1.5 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Color Palette */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">
            Jersey Color
          </label>
          <div className="grid grid-cols-6 gap-1.5">
            {playerColors.map((c) => (
              <button
                key={c}
                onClick={() => updatePlayer(player.id, { color: c })}
                style={{ backgroundColor: c }}
                className={`w-6 h-6 rounded-full border transition cursor-pointer ${
                  player.color === c
                    ? "border-white ring-2 ring-emerald-500 scale-110"
                    : "border-black/40 hover:scale-105"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Goalkeeper Toggle & Vision Cone */}
        <div className="space-y-2 pt-1 border-t border-slate-800">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-slate-300">Goalkeeper Styling</span>
            <input
              type="checkbox"
              checked={!!player.isGoalkeeper}
              onChange={(e) =>
                updatePlayer(player.id, { isGoalkeeper: e.target.checked })
              }
              className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-slate-300">Vision Cone / Body Angle</span>
            <input
              type="checkbox"
              checked={!!player.showVisionCone}
              onChange={(e) =>
                updatePlayer(player.id, { showVisionCone: e.target.checked })
              }
              className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
            />
          </label>
        </div>

        {/* Facing Rotation Slider */}
        {player.showVisionCone && (
          <div>
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>Facing Angle</span>
              <span>{player.facingAngle ?? 0}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              value={player.facingAngle ?? 0}
              onChange={(e) =>
                updatePlayer(player.id, { facingAngle: Number(e.target.value) })
              }
              className="w-full accent-emerald-500 bg-slate-800"
            />
          </div>
        )}
      </div>
    );
  }

  // 1b. BALL PROPERTIES
  if (selectedType === "ball") {
    const ball = state.balls.find((b) => b.id === selectedId);
    if (!ball) return null;

    return (
      <div className="space-y-4 p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-200">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
            <span>⚽</span> Soccer Ball
          </div>
          <button
            onClick={deleteSelected}
            title="Delete Ball"
            className="p-1.5 hover:bg-rose-950/60 text-rose-400 rounded-lg transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div>
          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
            <span>Ball Size</span>
            <span>{ball.size || 11}px</span>
          </div>
          <input
            type="range"
            min="8"
            max="20"
            value={ball.size || 11}
            onChange={(e) =>
              updateBall(ball.id, { size: Number(e.target.value) })
            }
            className="w-full accent-emerald-500 bg-slate-800"
          />
        </div>
      </div>
    );
  }

  // 2. LINE PROPERTIES
  if (selectedType === "line") {
    const line = state.lines.find((l) => l.id === selectedId);
    if (!line) return null;

    const lineColors = [
      "#facc15",
      "#ef4444",
      "#3b82f6",
      "#ffffff",
      "#10b981",
      "#a855f7",
      "#f97316",
    ];

    return (
      <div className="space-y-4 p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-200">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="font-bold text-sm text-slate-100 capitalize">
            {line.type} Line
          </div>
          <button
            onClick={deleteSelected}
            title="Delete Line"
            className="p-1.5 hover:bg-rose-950/60 text-rose-400 rounded-lg transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Line Color */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">
            Color
          </label>
          <div className="flex items-center gap-1.5">
            {lineColors.map((c) => (
              <button
                key={c}
                onClick={() => updateLine(line.id, { color: c })}
                style={{ backgroundColor: c }}
                className={`w-6 h-6 rounded-full border transition cursor-pointer ${
                  line.color === c
                    ? "border-white ring-2 ring-emerald-500 scale-110"
                    : "border-black/40 hover:scale-105"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Thickness */}
        <div>
          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
            <span>Line Width</span>
            <span>{line.width}px</span>
          </div>
          <input
            type="range"
            min="2"
            max="10"
            step="0.5"
            value={line.width}
            onChange={(e) =>
              updateLine(line.id, { width: Number(e.target.value) })
            }
            className="w-full accent-emerald-500 bg-slate-800"
          />
        </div>

        {/* Line Label */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
            Label Annotation
          </label>
          <input
            type="text"
            value={line.label || ""}
            onChange={(e) => updateLine(line.id, { label: e.target.value })}
            placeholder="e.g. Overlap run, Key pass"
            className="w-full bg-slate-800 border border-slate-700 px-2.5 py-1.5 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>
    );
  }

  // 3. TACTICAL SHAPE PROPERTIES
  if (selectedType === "shape") {
    const shape = state.shapes.find((s) => s.id === selectedId);
    if (!shape) return null;

    return (
      <div className="space-y-4 p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-200">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="font-bold text-sm text-slate-100 capitalize">
            Tactical {shape.type}
          </div>
          <button
            onClick={deleteSelected}
            title="Delete Zone"
            className="p-1.5 hover:bg-rose-950/60 text-rose-400 rounded-lg transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Opacity Slider */}
        <div>
          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
            <span>Fill Opacity</span>
            <span>{Math.round(shape.fillOpacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.05"
            max="0.8"
            step="0.05"
            value={shape.fillOpacity}
            onChange={(e) =>
              updateShape(shape.id, { fillOpacity: Number(e.target.value) })
            }
            className="w-full accent-emerald-500 bg-slate-800"
          />
        </div>

        {/* Shape Label */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
            Zone Title
          </label>
          <input
            type="text"
            value={shape.label || ""}
            onChange={(e) => updateShape(shape.id, { label: e.target.value })}
            placeholder="e.g. Pressing Trap, Half-space"
            className="w-full bg-slate-800 border border-slate-700 px-2.5 py-1.5 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>
    );
  }

  // 4. TEXT PROPERTIES
  if (selectedType === "text") {
    const textItem = state.texts.find((t) => t.id === selectedId);
    if (!textItem) return null;

    return (
      <div className="space-y-4 p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-200">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="font-bold text-sm text-slate-100">
            Text Annotation
          </div>
          <button
            onClick={deleteSelected}
            title="Delete Text"
            className="p-1.5 hover:bg-rose-950/60 text-rose-400 rounded-lg transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
            Note Content
          </label>
          <input
            type="text"
            value={textItem.text}
            onChange={(e) => updateText(textItem.id, { text: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 px-2.5 py-1.5 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
            <span>Font Size</span>
            <span>{textItem.fontSize}px</span>
          </div>
          <input
            type="range"
            min="10"
            max="32"
            value={textItem.fontSize}
            onChange={(e) =>
              updateText(textItem.id, { fontSize: Number(e.target.value) })
            }
            className="w-full accent-emerald-500 bg-slate-800"
          />
        </div>
      </div>
    );
  }

  return null;
};

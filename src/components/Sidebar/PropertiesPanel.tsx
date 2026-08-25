import React from "react";
import type { useTacticsState } from "../../hooks/useTacticsState";
import type { TextAnnotation } from "../../types/tactics";
import {
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  FileText,
} from "lucide-react";
import { getContrastTextColor } from "../../utils/mathUtils";
import { isFormatActive, toggleMarkdownFormat } from "../../utils/textUtils";

interface PropertiesPanelProps {
  tactics: ReturnType<typeof useTacticsState>;
}

const TextPropertiesEditor: React.FC<{
  textItem: TextAnnotation;
  updateText: (id: string, updates: Partial<TextAnnotation>) => void;
  deleteSelected: () => void;
}> = ({ textItem, updateText, deleteSelected }) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [selectionRange, setSelectionRange] = React.useState({
    start: 0,
    end: 0,
  });

  const isBoldActive = isFormatActive(
    textItem.text || "",
    selectionRange.start,
    selectionRange.end,
    "bold",
    textItem.isBold,
  );

  const isItalicActive = isFormatActive(
    textItem.text || "",
    selectionRange.start,
    selectionRange.end,
    "italic",
    textItem.isItalic,
  );

  const textColors = [
    "#ffffff",
    "#facc15",
    "#4ade80",
    "#38bdf8",
    "#f87171",
    "#c084fc",
    "#94a3b8",
    "#0f172a",
  ];

  const bgColors = [
    { label: "Dark Slate", value: "#0f172a" },
    { label: "High Danger", value: "#4c0519" },
    { label: "Transparent", value: "transparent" },
  ];

  const borderColors = ["#334155", "#38bdf8", "#10b981", "#f59e0b", "#ef4444"];

  const currentBg = textItem.bgColor ?? "#0f172a";
  const isTransparent = currentBg === "transparent";

  const handleFormat = (format: "bold" | "italic") => {
    const el = textareaRef.current;
    const currentText = textItem.text || "";
    const start = el ? (el.selectionStart ?? 0) : selectionRange.start;
    const end = el ? (el.selectionEnd ?? 0) : selectionRange.end;

    const { newText, newStart, newEnd } = toggleMarkdownFormat(
      currentText,
      start,
      end,
      format,
    );

    updateText(textItem.id, { text: newText });
    setSelectionRange({ start: newStart, end: newEnd });

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newStart, newEnd);
      }
    }, 0);
  };

  return (
    <div className="space-y-4 p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5 font-bold text-sm text-slate-100">
          <FileText className="w-4 h-4 text-emerald-400" />
          <span>Coaching Notes & Text</span>
        </div>
        <button
          onClick={deleteSelected}
          title="Delete Text"
          className="p-1.5 hover:bg-rose-950/60 text-rose-400 rounded-lg transition cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Multi-line Note Content */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-[10px] uppercase font-bold text-slate-400">
            Coaching Points (Multi-line)
          </label>
          <span className="text-[10px] text-slate-500">
            Select text & click B / I
          </span>
        </div>
        <textarea
          ref={textareaRef}
          rows={5}
          value={textItem.text}
          onChange={(e) => {
            updateText(textItem.id, { text: e.target.value });
            setSelectionRange({
              start: e.target.selectionStart ?? 0,
              end: e.target.selectionEnd ?? 0,
            });
          }}
          onSelect={(e) =>
            setSelectionRange({
              start: e.currentTarget.selectionStart ?? 0,
              end: e.currentTarget.selectionEnd ?? 0,
            })
          }
          onKeyUp={(e) =>
            setSelectionRange({
              start: e.currentTarget.selectionStart ?? 0,
              end: e.currentTarget.selectionEnd ?? 0,
            })
          }
          onMouseUp={(e) =>
            setSelectionRange({
              start: e.currentTarget.selectionStart ?? 0,
              end: e.currentTarget.selectionEnd ?? 0,
            })
          }
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === "b" || e.key === "B")) {
              e.preventDefault();
              handleFormat("bold");
            } else if (
              (e.ctrlKey || e.metaKey) &&
              (e.key === "i" || e.key === "I")
            ) {
              e.preventDefault();
              handleFormat("italic");
            }
          }}
          placeholder={
            "Enter coaching points or notes...\n• Point 1\n• Point 2"
          }
          className="w-full bg-slate-800 border border-slate-700 px-2.5 py-2 rounded-lg text-slate-100 font-medium leading-relaxed focus:outline-none focus:border-emerald-500 resize-y text-xs font-mono"
        />
        <div className="mt-1 text-[10px] text-slate-500 flex items-center justify-between">
          <span>Formatting: **bold**, *italic*</span>
          <span>Shortcuts: ⌘B / ⌘I</span>
        </div>
      </div>

      {/* Typography & Layout */}
      <div className="space-y-3 pt-2 border-t border-slate-800">
        <div>
          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
            <span className="font-bold uppercase">Font Size</span>
            <span className="font-semibold text-slate-300">
              {textItem.fontSize}px
            </span>
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

        {/* Alignment & Style Buttons */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            <button
              type="button"
              onClick={() => updateText(textItem.id, { align: "left" })}
              title="Align Left"
              className={`p-1.5 rounded-md transition cursor-pointer ${
                (textItem.align || "left") === "left"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => updateText(textItem.id, { align: "center" })}
              title="Align Center"
              className={`p-1.5 rounded-md transition cursor-pointer ${
                textItem.align === "center"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => updateText(textItem.id, { align: "right" })}
              title="Align Right"
              className={`p-1.5 rounded-md transition cursor-pointer ${
                textItem.align === "right"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleFormat("bold")}
              title="Toggle Bold (⌘B / **text**)"
              className={`p-1.5 px-2.5 rounded-lg border transition cursor-pointer font-bold ${
                isBoldActive
                  ? "bg-emerald-600 border-emerald-500 text-white"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleFormat("italic")}
              title="Toggle Italic (⌘I / *text*)"
              className={`p-1.5 px-2.5 rounded-lg border transition cursor-pointer italic ${
                isItalicActive
                  ? "bg-emerald-600 border-emerald-500 text-white"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Text Color */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">
            Text Color
          </label>
          <div className="flex items-center gap-1.5 flex-wrap">
            {textColors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => updateText(textItem.id, { color: c })}
                className={`w-6 h-6 rounded-full border transition cursor-pointer ${
                  textItem.color === c
                    ? "ring-2 ring-emerald-400 scale-110 border-white"
                    : "border-slate-700 hover:scale-105"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
            <input
              type="color"
              value={textItem.color || "#ffffff"}
              onChange={(e) =>
                updateText(textItem.id, { color: e.target.value })
              }
              className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
            />
          </div>
        </div>
      </div>

      {/* Card Background & Box Styling */}
      <div className="space-y-3 pt-2 border-t border-slate-800">
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">
            Card Background Theme
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {bgColors.map((bg) => {
              const isActive = currentBg === bg.value;
              return (
                <button
                  key={bg.label}
                  type="button"
                  onClick={() => updateText(textItem.id, { bgColor: bg.value })}
                  className={`px-2 py-1 rounded-md text-[10px] font-semibold transition border cursor-pointer ${
                    isActive
                      ? "border-emerald-400 text-emerald-300 bg-slate-800 shadow"
                      : "border-slate-700 text-slate-400 hover:text-slate-200 bg-slate-800/60"
                  }`}
                >
                  {bg.label}
                </button>
              );
            })}
          </div>
        </div>

        {!isTransparent && (
          <div>
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span className="font-bold uppercase">Background Opacity</span>
              <span className="font-semibold text-slate-300">
                {Math.round((textItem.bgOpacity ?? 0.88) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={textItem.bgOpacity ?? 0.88}
              onChange={(e) =>
                updateText(textItem.id, {
                  bgOpacity: Number(e.target.value),
                })
              }
              className="w-full accent-emerald-500 bg-slate-800"
            />
          </div>
        )}

        {/* Border Style & Color */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-[10px] uppercase font-bold text-slate-400">
              Card Border
            </label>
            <div className="flex items-center gap-1">
              {(["none", "solid", "dashed"] as const).map((bStyle) => (
                <button
                  key={bStyle}
                  type="button"
                  onClick={() =>
                    updateText(textItem.id, { borderStyle: bStyle })
                  }
                  className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize transition cursor-pointer ${
                    (textItem.borderStyle ||
                      (isTransparent ? "none" : "solid")) === bStyle
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {bStyle}
                </button>
              ))}
            </div>
          </div>

          {textItem.borderStyle !== "none" && (
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 mr-1">Color:</span>
              {borderColors.map((bc) => (
                <button
                  key={bc}
                  type="button"
                  onClick={() => updateText(textItem.id, { borderColor: bc })}
                  className={`w-5 h-5 rounded-full border transition cursor-pointer ${
                    textItem.borderColor === bc
                      ? "ring-2 ring-emerald-400 scale-110 border-white"
                      : "border-slate-700 hover:scale-105"
                  }`}
                  style={{ backgroundColor: bc }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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
      <div className="p-4 text-xs text-slate-400 text-center flex flex-col items-center justify-center h-48 border border-slate-800 rounded-xl bg-slate-900">
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
      <div className="space-y-4 p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200">
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
                onClick={() =>
                  updatePlayer(player.id, {
                    color: c,
                    textColor: getContrastTextColor(c),
                  })
                }
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
      <div className="space-y-4 p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200">
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
            max="24"
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

  // 1c. EQUIPMENT PROPERTIES (Cones, Mannequins, Goals)
  if (selectedType === "equipment") {
    const eq = state.equipments.find((item) => item.id === selectedId);
    if (!eq) return null;

    const currentScale = eq.scale ?? 1.0;

    const getEquipmentTitle = () => {
      switch (eq.type) {
        case "cone-orange":
          return "Orange Cone";
        case "cone-yellow":
          return "Yellow Cone";
        case "cone-blue":
          return "Blue Cone";
        case "mannequin":
          return "Wall Mannequin";
        case "mini-goal":
          return "Mini Goal";
        case "ladder":
          return "Agility Ladder";
        case "pole":
          return "Agility Pole";
        default:
          return "Equipment";
      }
    };

    return (
      <div className="space-y-4 p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5 capitalize">
            <span>
              {eq.type.startsWith("cone")
                ? "🔶"
                : eq.type === "mannequin"
                  ? "🧍"
                  : eq.type === "mini-goal"
                    ? "🥅"
                    : "🎯"}
            </span>{" "}
            {getEquipmentTitle()}
          </div>
          <button
            onClick={deleteSelected}
            title="Delete Equipment"
            className="p-1.5 hover:bg-rose-950/60 text-rose-400 rounded-lg transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Scale / Size Slider */}
        <div>
          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
            <span>Size Scale</span>
            <span>{Math.round(currentScale * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.5"
            step="0.1"
            value={currentScale}
            onChange={(e) =>
              tactics.updateEquipment(eq.id, {
                scale: Number(e.target.value),
              })
            }
            className="w-full accent-emerald-500 bg-slate-800"
          />
        </div>

        {/* Preset Size Buttons */}
        <div className="flex items-center gap-1.5 pt-1">
          {[
            { label: "Small (70%)", val: 0.7 },
            { label: "Normal (100%)", val: 1.0 },
            { label: "Large (140%)", val: 1.4 },
            { label: "Extra (180%)", val: 1.8 },
          ].map((preset) => (
            <button
              key={preset.val}
              onClick={() =>
                tactics.updateEquipment(eq.id, { scale: preset.val })
              }
              className={`flex-1 py-1 px-1 rounded text-[10px] font-semibold transition cursor-pointer ${
                Math.abs(currentScale - preset.val) < 0.05
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300"
              }`}
            >
              {preset.label.split(" ")[0]}
            </button>
          ))}
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
      <div className="space-y-4 p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200">
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
      <div className="space-y-4 p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200">
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
      <TextPropertiesEditor
        textItem={textItem}
        updateText={updateText}
        deleteSelected={deleteSelected}
      />
    );
  }

  return null;
};

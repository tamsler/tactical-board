import React from "react";
import type { ToolType } from "../../types/tactics";
import { Undo2, Redo2, Trash2 } from "lucide-react";

interface BottomQuickBarProps {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  onAddPlayer: (team: "A" | "B" | "neutral" | "custom", isGk?: boolean) => void;
  onAddBall: () => void;
  onAddEquipment: (
    type:
      | "cone-orange"
      | "cone-yellow"
      | "cone-blue"
      | "mannequin"
      | "mini-goal",
  ) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const BottomQuickBar: React.FC<BottomQuickBarProps> = ({
  activeTool,
  setActiveTool,
  onAddPlayer,
  onAddBall,
  onAddEquipment,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) => {
  // Preset colored player chips (like in tactical-board.com reference)
  const playerChips = [
    { team: "A" as const, label: "1", color: "#dc2626", name: "Red Team" },
    {
      team: "A" as const,
      label: "1",
      color: "#eab308",
      name: "Yellow GK",
      isGk: true,
    },
    { team: "neutral" as const, label: "1", color: "#a855f7", name: "Purple" },
    { team: "neutral" as const, label: "1", color: "#22c55e", name: "Green" },
    { team: "B" as const, label: "1", color: "#2563eb", name: "Blue Team" },
    { team: "B" as const, label: "1", color: "#f97316", name: "Orange" },
    { team: "neutral" as const, label: "1", color: "#06b6d4", name: "Cyan" },
    {
      team: "neutral" as const,
      label: "1",
      color: "#ffffff",
      textColor: "#0f172a",
      name: "White",
    },
    { team: "neutral" as const, label: "1", color: "#1e293b", name: "Black" },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-2 py-1 md:px-3 md:py-2 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl md:rounded-2xl shadow-2xl flex items-center justify-between gap-1.5 md:gap-2 z-20 overflow-x-auto scrollbar-none">
      {/* Quick Player Tokens (Click to add or select placement tool) */}
      <div className="flex items-center gap-1 md:gap-1.5 overflow-x-auto py-0.5 scrollbar-none shrink-0">
        <span className="text-[10px] uppercase font-bold text-slate-400 mr-1 hidden sm:inline">
          Players:
        </span>
        {playerChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => onAddPlayer(chip.team, chip.isGk)}
            title={`Add ${chip.name} Player`}
            style={{
              backgroundColor: chip.color,
              color: chip.textColor || "#ffffff",
            }}
            className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-black text-[10px] sm:text-xs shadow-md border-2 border-white/80 hover:scale-115 active:scale-95 transition cursor-pointer shrink-0"
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="h-5 md:h-6 w-[1px] bg-slate-800 shrink-0" />

      {/* Equipment & Ball Section */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Ball */}
        <button
          onClick={onAddBall}
          title="Add Soccer Ball"
          className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white flex items-center justify-center text-sm md:text-base shadow hover:scale-115 active:scale-95 transition cursor-pointer border border-slate-300 shrink-0"
        >
          ⚽
        </button>

        {/* Orange Cone */}
        <button
          onClick={() => onAddEquipment("cone-orange")}
          title="Add Training Cone"
          className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-xs sm:text-sm shadow hover:scale-110 active:scale-95 transition cursor-pointer border border-slate-700 shrink-0"
        >
          🔶
        </button>

        {/* Dummy / Mannequin */}
        <button
          onClick={() => onAddEquipment("mannequin")}
          title="Add Defensive Wall Mannequin"
          className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 shadow hover:scale-110 active:scale-95 transition cursor-pointer border border-slate-700 shrink-0"
        >
          🧍
        </button>

        {/* Mini Goal */}
        <button
          onClick={() => onAddEquipment("mini-goal")}
          title="Add Mini Goal"
          className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-xs font-bold text-red-400 shadow hover:scale-110 active:scale-95 transition cursor-pointer border border-slate-700 shrink-0"
        >
          🥅
        </button>
      </div>

      <div className="h-5 md:h-6 w-[1px] bg-slate-800 shrink-0" />

      {/* Quick Eraser / Undo / Redo */}
      <div className="flex items-center gap-1 md:gap-1.5 shrink-0">
        <button
          onClick={() =>
            setActiveTool(activeTool === "eraser" ? "select" : "eraser")
          }
          title="Eraser Tool"
          className={`p-1.5 md:p-2 rounded-lg transition text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0 ${
            activeTool === "eraser"
              ? "bg-rose-600 text-white ring-2 ring-rose-400"
              : "bg-slate-800 hover:bg-slate-700 text-rose-400"
          }`}
        >
          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Erase</span>
        </button>

        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo"
          className={`p-1.5 md:p-2 rounded-lg transition shrink-0 ${
            canUndo
              ? "bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
              : "bg-slate-800/40 text-slate-600 cursor-not-allowed opacity-50"
          }`}
        >
          <Undo2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo"
          className={`p-1.5 md:p-2 rounded-lg transition shrink-0 ${
            canRedo
              ? "bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
              : "bg-slate-800/40 text-slate-600 cursor-not-allowed opacity-50"
          }`}
        >
          <Redo2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>
  );
};

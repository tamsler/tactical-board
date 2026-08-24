import React from "react";
import {
  MousePointer,
  MoveUpRight,
  Spline,
  PenTool,
  Square,
  Circle,
  Type,
  Eraser,
  MinusSquare,
} from "lucide-react";
import type { ToolType } from "../../types/tactics";

interface ToolSelectorProps {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  drawingColor: string;
  setDrawingColor: (color: string) => void;
  drawingWidth: number;
  setDrawingWidth: (w: number) => void;
}

export const ToolSelector: React.FC<ToolSelectorProps> = ({
  activeTool,
  setActiveTool,
  drawingColor,
  setDrawingColor,
  drawingWidth,
  setDrawingWidth,
}) => {
  const tools: {
    id: ToolType;
    label: string;
    icon: React.ReactNode;
    tooltip: string;
  }[] = [
    {
      id: "select",
      label: "Select / Move",
      icon: <MousePointer className="w-5 h-5" />,
      tooltip: "Select and drag players, balls, and lines (V)",
    },
    {
      id: "line-run",
      label: "Player Run",
      icon: <MoveUpRight className="w-5 h-5" />,
      tooltip: "Solid Arrow: Player movement line",
    },
    {
      id: "line-pass",
      label: "Ball Pass",
      icon: <span className="font-mono text-sm tracking-tighter">⇢</span>,
      tooltip: "Dashed Arrow: Ball pass trajectory",
    },
    {
      id: "line-dribble",
      label: "Dribble",
      icon: <span className="text-base leading-none font-bold">〰️</span>,
      tooltip: "Wavy Arrow: Player dribbling with ball",
    },
    {
      id: "line-curve",
      label: "Curved Run / Pass",
      icon: <Spline className="w-5 h-5" />,
      tooltip: "Arched Bézier curve pass or overlapping run",
    },
    {
      id: "line-block",
      label: "Screen / Block",
      icon: <MinusSquare className="w-5 h-5" />,
      tooltip: "Block / Screen with perpendicular T-end",
    },
    {
      id: "draw-freehand",
      label: "Freehand Pen",
      icon: <PenTool className="w-5 h-5" />,
      tooltip: "Draw custom freehand lines and sketches",
    },
    {
      id: "shape-rect",
      label: "Tactical Zone",
      icon: <Square className="w-5 h-5" />,
      tooltip: "Highlight tactical pressing zone / box",
    },
    {
      id: "shape-circle",
      label: "Zone Circle",
      icon: <Circle className="w-5 h-5" />,
      tooltip: "Highlight circular zone / trap area",
    },
    {
      id: "text",
      label: "Text Label",
      icon: <Type className="w-5 h-5" />,
      tooltip: "Click anywhere to add text annotation",
    },
    {
      id: "eraser",
      label: "Quick Eraser",
      icon: <Eraser className="w-5 h-5 text-rose-400" />,
      tooltip: "Click on any entity to delete it immediately",
    },
  ];

  const quickColors = [
    "#facc15",
    "#ef4444",
    "#3b82f6",
    "#ffffff",
    "#10b981",
    "#a855f7",
    "#f97316",
  ];

  return (
    <div className="flex flex-col gap-2 items-center w-full">
      {/* Tool items */}
      <div className="flex flex-col gap-1 w-full items-center">
        {tools.map((t) => {
          const isActive = activeTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTool(t.id)}
              title={t.tooltip}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all cursor-pointer relative group ${
                isActive
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/50 scale-105"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {t.icon}

              {/* Hover Tooltip */}
              <div className="absolute left-full ml-2.5 px-2.5 py-1 bg-slate-950 text-slate-200 text-xs rounded-md shadow-xl border border-slate-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-50">
                <div className="font-semibold">{t.label}</div>
                <div className="text-[10px] text-slate-400">{t.tooltip}</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="w-full h-[1px] bg-slate-800 my-1" />

      {/* Quick Color Palette for Lines */}
      <div className="flex flex-col gap-1.5 items-center">
        {quickColors.map((c) => (
          <button
            key={c}
            onClick={() => setDrawingColor(c)}
            style={{ backgroundColor: c }}
            title={`Drawing Color: ${c}`}
            className={`w-5 h-5 rounded-full transition cursor-pointer border ${
              drawingColor === c
                ? "border-white scale-125 ring-2 ring-emerald-500"
                : "border-black/40 hover:scale-110"
            }`}
          />
        ))}
      </div>

      <div className="w-full h-[1px] bg-slate-800 my-1" />

      {/* Thickness switcher */}
      <div className="flex flex-col gap-1 items-center">
        {[2, 3.5, 6].map((w) => (
          <button
            key={w}
            onClick={() => setDrawingWidth(w)}
            title={`Line Width: ${w}px`}
            className={`w-8 h-4 rounded flex items-center justify-center transition ${
              drawingWidth === w
                ? "bg-slate-700 ring-1 ring-emerald-500"
                : "hover:bg-slate-800/60"
            }`}
          >
            <div
              style={{
                height: `${w}px`,
                width: "18px",
                backgroundColor: drawingColor,
              }}
              className="rounded-full"
            />
          </button>
        ))}
      </div>
    </div>
  );
};

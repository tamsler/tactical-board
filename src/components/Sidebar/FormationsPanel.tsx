import React from "react";
import type { useTacticsState } from "../../hooks/useTacticsState";
import {
  FORMATIONS_11V11_TEAM_A,
  FORMATIONS_9V9_TEAM_A,
  FORMATIONS_7V7_TEAM_A,
} from "../../constants/formations";
import type { GrassStyle, MatchFormat, PitchType } from "../../types/tactics";
import {
  Shield,
  Grid,
  Sliders,
  StickyNote,
  Layout,
  Users,
  Maximize2,
  Tag,
} from "lucide-react";

interface FormationsPanelProps {
  tactics: ReturnType<typeof useTacticsState>;
}

export const FormationsPanel: React.FC<FormationsPanelProps> = ({
  tactics,
}) => {
  const {
    state,
    pushState,
    loadFormation,
    matchFormat,
    switchFormat,
    showBuildOutLines,
    setShowBuildOutLines,
    pitchType,
    switchPitchType,
    grassStyle,
    setGrassStyle,
    showGrid,
    setShowGrid,
    showZones,
    setShowZones,
    showPlayerLabels,
    setShowPlayerLabels,
  } = tactics;

  // Active formations list depending on format
  const currentFormations =
    matchFormat === "7v7"
      ? FORMATIONS_7V7_TEAM_A
      : matchFormat === "9v9"
        ? FORMATIONS_9V9_TEAM_A
        : FORMATIONS_11V11_TEAM_A;

  const pitchLayoutOptions: {
    id: PitchType;
    label: string;
    desc: string;
    renderIcon: (active: boolean) => React.ReactNode;
  }[] = [
    {
      id: "full",
      label: "Full Pitch",
      desc: "Standard full field",
      renderIcon: (active) => (
        <svg
          viewBox="0 0 32 20"
          className={`w-7 h-4.5 transition-colors ${active ? "stroke-emerald-400" : "stroke-slate-400"}`}
          fill="none"
          strokeWidth="1.5"
        >
          {/* Outer Boundary */}
          <rect
            x="1"
            y="1"
            width="30"
            height="18"
            rx="1.5"
            className={active ? "fill-emerald-950/40" : "fill-slate-900/60"}
          />
          {/* Halfway Line */}
          <line x1="16" y1="1" x2="16" y2="19" />
          {/* Center Circle & Spot */}
          <circle cx="16" cy="10" r="3.5" />
          <circle cx="16" cy="10" r="0.75" fill="currentColor" />
          {/* Left Penalty Box & Goal Box */}
          <rect x="1" y="4.5" width="5.5" height="11" />
          <rect x="1" y="7" width="2" height="6" />
          {/* Right Penalty Box & Goal Box */}
          <rect x="25.5" y="4.5" width="5.5" height="11" />
          <rect x="29" y="7" width="2" height="6" />
        </svg>
      ),
    },
    {
      id: "half",
      label: "Half Pitch",
      desc: "Attacking half with goal on top",
      renderIcon: (active) => (
        <svg
          viewBox="0 0 32 20"
          className={`w-7 h-4.5 transition-colors ${active ? "stroke-emerald-400" : "stroke-slate-400"}`}
          fill="none"
          strokeWidth="1.5"
        >
          {/* Boundary */}
          <rect
            x="1"
            y="1"
            width="30"
            height="18"
            rx="1.5"
            className={active ? "fill-emerald-950/40" : "fill-slate-900/60"}
          />
          {/* Top Goal Net indicator */}
          <rect x="11" y="0.5" width="10" height="1.5" strokeDasharray="1 1" />
          {/* Top Penalty Box */}
          <rect x="7" y="1" width="18" height="7.5" />
          {/* Top 6-Yard Box */}
          <rect x="11.5" y="1" width="9" height="3" />
          {/* Penalty Spot */}
          <circle cx="16" cy="5.5" r="0.75" fill="currentColor" />
          {/* Penalty Arc */}
          <path d="M 13.5 8.5 A 3.5 3.5 0 0 0 18.5 8.5" />
          {/* Bottom Halfway Line */}
          <line x1="1" y1="19" x2="31" y2="19" strokeWidth="2" />
          {/* Bottom Center Circle Arc */}
          <path d="M 11 19 A 5 5 0 0 1 21 19" />
          <circle cx="16" cy="19" r="0.75" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: "blank",
      label: "Just Grass",
      desc: "No pitch lines",
      renderIcon: (active) => (
        <svg
          viewBox="0 0 32 20"
          className={`w-7 h-4.5 transition-colors ${active ? "stroke-emerald-400/80" : "stroke-slate-500"}`}
          fill="none"
          strokeWidth="1.2"
        >
          {/* Subtle perimeter dashes */}
          <rect
            x="1"
            y="1"
            width="30"
            height="18"
            rx="1.5"
            strokeDasharray="3 2"
            className={active ? "fill-emerald-950/40" : "fill-slate-900/60"}
          />
          {/* Grass texture blades */}
          <path
            d="M 11 13 L 13 8 L 15 13"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 17 13 L 19 7 L 21 13"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  ];

  const formatOptions: { id: MatchFormat; label: string; desc: string }[] = [
    { id: "11v11", label: "11 v 11", desc: "Full pitch match" },
    { id: "9v9", label: "9 v 9", desc: "U11-U12 Youth" },
    { id: "7v7", label: "7 v 7", desc: "U9-U10 with Build-Out" },
  ];

  const grassStyles: { id: GrassStyle; label: string; preview: string }[] = [
    { id: "stripes", label: "Classic FIFA Stripes", preview: "bg-emerald-600" },
    { id: "plain", label: "Pure Grass Green", preview: "bg-green-700" },
    { id: "slate", label: "Dark Tactical Slate", preview: "bg-slate-800" },
    { id: "blueprint", label: "Tactical Blueprint", preview: "bg-blue-900" },
  ];

  return (
    <div className="space-y-4 text-xs text-slate-200">
      {/* 0. GAME FORMAT SELECTOR (11v11, 9v9, 7v7) */}
      <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2.5">
        <div className="flex items-center gap-2 font-bold text-sm text-slate-100">
          <Users className="w-4 h-4 text-emerald-400" />
          <span>Game Format</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 bg-slate-950/60 p-1 rounded-lg border border-slate-800">
          {formatOptions.map((fmt) => (
            <button
              key={fmt.id}
              onClick={() => switchFormat(fmt.id)}
              className={`py-1.5 px-2 rounded-md font-bold text-center transition cursor-pointer ${
                matchFormat === fmt.id
                  ? "bg-emerald-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <div className="text-xs">{fmt.label}</div>
            </button>
          ))}
        </div>

        {/* 7v7 Build Out Line Toggle */}
        {matchFormat === "7v7" && (
          <div className="pt-2 border-t border-slate-800">
            <label className="flex items-center justify-between cursor-pointer p-1.5 rounded-lg bg-sky-950/40 border border-sky-800/60">
              <span className="text-sky-300 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                Show Build-Out Lines
              </span>
              <input
                type="checkbox"
                checked={showBuildOutLines}
                onChange={(e) => setShowBuildOutLines(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0 cursor-pointer"
              />
            </label>
          </div>
        )}
      </div>

      {/* 1. FORMATIONS SELECTOR */}
      <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center justify-between font-bold text-sm text-slate-100">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>{matchFormat} Formations</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
            {currentFormations.length} Presets
          </span>
        </div>

        {/* Team A (Home / Red) */}
        <div>
          <div className="text-[11px] font-semibold text-red-400 mb-1.5 flex items-center justify-between">
            <span>Team Red (Attacking Right)</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {currentFormations.map((f) => (
              <button
                key={`team-a-${f.id}`}
                onClick={() => loadFormation(f, "A")}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 font-medium text-[11px] transition text-left cursor-pointer active:scale-95 truncate"
                title={f.name}
              >
                {f.system}
              </button>
            ))}
          </div>
        </div>

        {/* Team B (Away / Blue) */}
        <div className="pt-2 border-t border-slate-800">
          <div className="text-[11px] font-semibold text-sky-400 mb-1.5 flex items-center justify-between">
            <span>Team Blue (Attacking Left)</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {currentFormations.map((f) => (
              <button
                key={`team-b-${f.id}`}
                onClick={() => loadFormation(f, "B")}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 font-medium text-[11px] transition text-left cursor-pointer active:scale-95 truncate"
                title={f.name}
              >
                {f.system}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. PITCH STYLES & OVERLAYS */}
      <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center gap-2 font-bold text-sm text-slate-100">
          <Sliders className="w-4 h-4 text-sky-400" />
          <span>Pitch Layout & Overlays</span>
        </div>

        {/* Pitch Layout Mode (Full Pitch, Half Pitch, Just Grass) */}
        <div>
          <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Field Layout</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 bg-slate-950/60 p-1.5 rounded-lg border border-slate-800">
            {pitchLayoutOptions.map((layout) => {
              const isActive = pitchType === layout.id;
              return (
                <button
                  key={layout.id}
                  onClick={() => switchPitchType(layout.id)}
                  title={layout.desc}
                  className={`py-2 px-1 rounded-lg text-center transition cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                    isActive
                      ? "bg-slate-800 text-emerald-400 ring-1 ring-emerald-500 shadow"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center justify-center">
                    {layout.renderIcon(isActive)}
                  </div>
                  <span className="text-[10px] font-bold tracking-tight truncate w-full">
                    {layout.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Grass Style Grid */}
        <div className="pt-2 border-t border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 mb-1.5">
            Grass Visual Texture
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {grassStyles.map((style) => (
              <button
                key={style.id}
                onClick={() => setGrassStyle(style.id)}
                className={`p-2 rounded-lg border text-left transition cursor-pointer flex items-center gap-2 ${
                  grassStyle === style.id
                    ? "border-emerald-500 bg-slate-800/90 text-white ring-1 ring-emerald-500"
                    : "border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800"
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full ${style.preview} shrink-0`}
                />
                <span className="truncate text-[11px]">{style.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tactical Overlays & Display Toggles */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-sky-400" />
              Player Name / Role Labels
            </span>
            <input
              type="checkbox"
              checked={showPlayerLabels}
              onChange={(e) => setShowPlayerLabels(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Grid className="w-3.5 h-3.5 text-amber-400" />
              18 Tactical Zones (Half-Spaces)
            </span>
            <input
              type="checkbox"
              checked={showZones}
              onChange={(e) => setShowZones(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Layout className="w-3.5 h-3.5 text-slate-400" />
              Coordinate Fine Grid
            </span>
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* 3. COACHING NOTES */}
      <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2">
        <div className="flex items-center gap-2 font-bold text-sm text-slate-100">
          <StickyNote className="w-4 h-4 text-amber-400" />
          <span>Coaching Notes</span>
        </div>
        <textarea
          rows={4}
          value={state.notes}
          onChange={(e) =>
            pushState((prev) => ({ ...prev, notes: e.target.value }))
          }
          placeholder="Add tactical briefing notes (these will also appear on the PDF export)..."
          className="w-full bg-slate-800 border border-slate-700 p-2 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-emerald-500 resize-none"
        />
      </div>
    </div>
  );
};

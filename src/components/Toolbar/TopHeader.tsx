import React, { useState, useRef, useEffect } from "react";
import {
  Download,
  RotateCcw,
  RotateCw,
  Trash2,
  FileText,
  Image,
  FileDown,
  Upload,
  HelpCircle,
  History,
  Shield,
} from "lucide-react";
import type { useTacticsState, BoardState } from "../../hooks/useTacticsState";
import {
  exportAsImage,
  exportAsPDF,
  exportAsSVG,
  exportAsJSON,
} from "../../utils/exportUtils";
import confetti from "canvas-confetti";
import wsfcLogo from "../../assets/wsfc-logo.png";
import { APP_INFO } from "../../constants/appInfo";

interface TopHeaderProps {
  tactics: ReturnType<typeof useTacticsState>;
  boardRef: React.RefObject<SVGSVGElement | null>;
  onToggleSidebar?: () => void;
  onOpenFormations?: () => void;
  onOpenHelp?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  tactics,
  boardRef,
  onOpenFormations,
  onOpenHelp,
}) => {
  const {
    state,
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    clearDrawings,
    resetBoard,
    isRestoredFromCache,
  } = tactics;

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const exportDropdownRef = useRef<HTMLDivElement | null>(null);

  // Click outside to close export menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        exportDropdownRef.current &&
        !exportDropdownRef.current.contains(e.target as Node)
      ) {
        setShowExportMenu(false);
      }
    };
    if (showExportMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showExportMenu]);

  const handleExportPNG = async () => {
    if (!boardRef.current) return;
    setIsExporting(true);
    setShowExportMenu(false);
    try {
      await exportAsImage(
        boardRef.current,
        `${(state.title || "soccer-tactics").toLowerCase().replace(/\s+/g, "-")}.png`,
        "image/png",
        2.5,
      );
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.1 } });
    } catch (err) {
      console.error("Export PNG failed:", err);
      alert("Failed to export image.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJPG = async () => {
    if (!boardRef.current) return;
    setIsExporting(true);
    setShowExportMenu(false);
    try {
      await exportAsImage(
        boardRef.current,
        `${(state.title || "soccer-tactics").toLowerCase().replace(/\s+/g, "-")}.jpg`,
        "image/jpeg",
        2.5,
      );
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.1 } });
    } catch (err) {
      console.error("Export JPG failed:", err);
      alert("Failed to export JPEG.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!boardRef.current) return;
    setIsExporting(true);
    setShowExportMenu(false);
    try {
      await exportAsPDF(
        boardRef.current,
        state,
        `${(state.title || "tactical-sheet").toLowerCase().replace(/\s+/g, "-")}.pdf`,
      );
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.1 } });
    } catch (err) {
      console.error("Export PDF failed:", err);
      alert("Failed to export PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSVG = () => {
    if (!boardRef.current) return;
    setShowExportMenu(false);
    exportAsSVG(
      boardRef.current,
      `${(state.title || "soccer-tactics").toLowerCase().replace(/\s+/g, "-")}.svg`,
    );
  };

  const handleExportJSON = () => {
    setShowExportMenu(false);
    exportAsJSON(
      state,
      `${(state.title || "tactics-data").toLowerCase().replace(/\s+/g, "-")}.json`,
    );
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string) as BoardState;
        if (parsed.players && parsed.balls) {
          pushState(parsed);
          alert("Tactics loaded successfully!");
        } else {
          alert("Invalid tactics file format.");
        }
      } catch {
        alert("Could not parse JSON file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <header className="w-full bg-slate-900 border-b border-slate-800 px-2 sm:px-4 py-1.5 md:py-2 flex items-center justify-between gap-1 sm:gap-2 z-40 sticky top-0 shadow-md min-w-0 overflow-x-auto scrollbar-none touch-pan-x">
      {/* App Logo & Title */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <div className="flex items-center justify-center h-7 sm:h-10 w-auto shrink-0">
          <img
            src={wsfcLogo}
            alt="West Sacramento Futbol Club"
            className="h-7 sm:h-10 w-auto object-contain filter drop-shadow-md hover:scale-105 transition-transform"
            width="32"
            height="36"
          />
        </div>
        <div>
          <div className="flex items-center gap-1 sm:gap-2">
            <input
              type="text"
              value={state.title}
              onChange={(e) =>
                pushState((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Tactics Title..."
              className="text-xs sm:text-sm md:text-base font-bold bg-transparent hover:bg-slate-800/80 focus:bg-slate-800 text-slate-100 px-1 py-0.5 rounded border border-transparent focus:border-slate-600 outline-none transition w-20 sm:w-36 md:w-64 focus:w-28 sm:focus:w-48 md:focus:w-72"
            />
            <span
              title={`Tactical Board v${APP_INFO.version}`}
              className="hidden sm:inline-block text-[10px] font-mono text-slate-400 bg-slate-800/80 border border-slate-700/60 px-1.5 py-0.5 rounded-md shrink-0 cursor-default"
            >
              v{APP_INFO.version}
            </span>
            {isRestoredFromCache && (
              <span
                title="Board state automatically restored from local browser storage"
                className="hidden md:inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-800/70 px-1.5 py-0.5 rounded-full shrink-0"
              >
                <History className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-400" />
                <span className="hidden sm:inline">Restored</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Center Actions: Undo / Redo / Clear / Reset */}
      <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-950/60 p-0.5 sm:p-1 rounded-lg border border-slate-800 shrink-0">
        <button
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className={`p-1.5 sm:p-2 rounded-md transition flex items-center gap-1 text-xs font-semibold ${
            canUndo
              ? "hover:bg-slate-800 text-slate-200 cursor-pointer active:scale-95"
              : "text-slate-600 cursor-not-allowed opacity-50"
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden lg:inline">Undo</span>
        </button>

        <button
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className={`p-1.5 sm:p-2 rounded-md transition flex items-center gap-1 text-xs font-semibold ${
            canRedo
              ? "hover:bg-slate-800 text-slate-200 cursor-pointer active:scale-95"
              : "text-slate-600 cursor-not-allowed opacity-50"
          }`}
        >
          <RotateCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden lg:inline">Redo</span>
        </button>

        <div className="w-[1px] h-4 sm:h-5 bg-slate-800 mx-0.5" />

        <button
          onClick={clearDrawings}
          title="Clear Lines & Annotations"
          className="p-1.5 sm:p-2 rounded-md hover:bg-slate-800 text-amber-400 hover:text-amber-300 transition flex items-center gap-1 text-xs font-semibold"
        >
          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden lg:inline">Clear Lines</span>
        </button>

        <button
          onClick={() => {
            if (confirm("Reset the board to standard positions?")) {
              resetBoard();
            }
          }}
          title="Reset Whole Board"
          className="p-1.5 sm:p-2 rounded-md hover:bg-red-950/50 text-red-400 hover:text-red-300 transition flex items-center gap-1 text-xs font-semibold"
        >
          <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden lg:inline">Reset</span>
        </button>
      </div>

      {/* Right Actions: Export / Save & Load */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Hidden JSON file input for Load */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImportJSON}
          accept=".json"
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          title="Load Tactic JSON"
          className="flex items-center gap-1 px-2 py-1.5 sm:px-3 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition shrink-0 cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Load</span>
        </button>

        {/* Export Dropdown */}
        <div className="relative" ref={exportDropdownRef}>
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-lg shadow-emerald-900/30 transition cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">
              {isExporting ? "Exporting..." : "Save / Export"}
            </span>
            <span className="sm:hidden">{isExporting ? "..." : "Export"}</span>
          </button>

          {showExportMenu && (
            <div className="fixed sm:absolute right-2 sm:right-0 top-12 sm:top-full mt-1.5 w-52 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 p-1.5 z-70 text-slate-200 text-xs animate-in fade-in zoom-in-95">
              <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Export Board
              </div>

              <button
                onClick={handleExportPNG}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-700 transition text-left cursor-pointer"
              >
                <Image className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="font-semibold">Export Image (PNG)</div>
                  <div className="text-[10px] text-slate-400">
                    High-res crystal clear
                  </div>
                </div>
              </button>

              <button
                onClick={handleExportJPG}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-700 transition text-left cursor-pointer"
              >
                <Image className="w-4 h-4 text-sky-400" />
                <div>
                  <div className="font-semibold">Export Image (JPEG)</div>
                  <div className="text-[10px] text-slate-400">
                    Compressed picture format
                  </div>
                </div>
              </button>

              <button
                onClick={handleExportPDF}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-700 transition text-left cursor-pointer"
              >
                <FileText className="w-4 h-4 text-rose-400" />
                <div>
                  <div className="font-semibold">Export PDF Sheet</div>
                  <div className="text-[10px] text-slate-400">
                    Tactics plan with notes
                  </div>
                </div>
              </button>

              <button
                onClick={handleExportSVG}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-700 transition text-left cursor-pointer"
              >
                <FileDown className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="font-semibold">Export Vector (SVG)</div>
                  <div className="text-[10px] text-slate-400">
                    Scalable vector graphics
                  </div>
                </div>
              </button>

              <div className="my-1 border-t border-slate-700" />

              <button
                onClick={handleExportJSON}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-700 transition text-left cursor-pointer"
              >
                <FileDown className="w-4 h-4 text-purple-400" />
                <div>
                  <div className="font-semibold">Save Project File (JSON)</div>
                  <div className="text-[10px] text-slate-400">
                    Backup & reload later
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Formations & Settings button (Mobile / Quick access) */}
        {onOpenFormations && (
          <button
            onClick={onOpenFormations}
            title="Formations & Pitch Settings"
            className="flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition cursor-pointer shrink-0 md:hidden"
          >
            <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
            <span className="hidden sm:inline text-[11px]">Formations</span>
          </button>
        )}

        {/* Help button */}
        {onOpenHelp && (
          <button
            onClick={onOpenHelp}
            title="Shortcuts & Instructions"
            className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition shrink-0 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}
      </div>
    </header>
  );
};

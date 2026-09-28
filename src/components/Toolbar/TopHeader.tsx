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
  Save,
  Link2,
  Film,
} from "lucide-react";
import type { useTacticsState, BoardState } from "../../hooks/useTacticsState";
import { useProjectFile } from "../../hooks/useProjectFile";
import {
  exportAsImage,
  exportAsPDF,
  exportAsSVG,
  exportAsJSON,
} from "../../utils/exportUtils";
import {
  PROJECT_ACCEPT,
  PROJECT_EXTENSION,
  PROJECT_MIME,
  downloadBlob,
  slugify,
} from "../../utils/fileAccess";
import type { VideoFormat } from "../../animation/videoExport";
import { track } from "../../utils/analytics";
import { showToast } from "../../utils/toast";

interface TopHeaderProps {
  tactics: ReturnType<typeof useTacticsState>;
  boardRef: React.RefObject<SVGSVGElement | null>;
  onToggleSidebar?: () => void;
  onOpenFormations?: () => void;
  onOpenHelp?: () => void;
  /** Freezes animation playback so exports capture a single pose. */
  onBeforeExport?: () => void;
  /** Board shown on screen (the sampled pose while previewing), used for PDF notes and counts. */
  getExportBoard?: () => BoardState;
  onShare?: () => void;
  onExportVideo?: (format: VideoFormat) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  tactics,
  boardRef,
  onOpenFormations,
  onOpenHelp,
  onBeforeExport,
  getExportBoard,
  onShare,
  onExportVideo,
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
    saveStatus,
    retrySave,
    projectDocument,
  } = tactics;
  const projectFile = useProjectFile(tactics);

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMenuPos, setExportMenuPos] = useState({ top: 0, right: 0 });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const exportDropdownRef = useRef<HTMLDivElement | null>(null);
  const exportButtonRef = useRef<HTMLButtonElement | null>(null);

  // The header clips overflow, so the menu is positioned fixed against the button instead.
  const toggleExportMenu = () => {
    if (showExportMenu) {
      setShowExportMenu(false);
      return;
    }
    onBeforeExport?.();
    const rect = exportButtonRef.current?.getBoundingClientRect();
    if (rect) {
      setExportMenuPos({
        top: rect.bottom + 6,
        right: window.innerWidth - rect.right,
      });
    }
    setShowExportMenu(true);
  };

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
    const handleResize = () => setShowExportMenu(false);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowExportMenu(false);
    };
    if (showExportMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      window.addEventListener("resize", handleResize);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [showExportMenu]);

  const handleExportPNG = async () => {
    if (!boardRef.current) return;
    setIsExporting(true);
    setShowExportMenu(false);
    const filename = `${slugify(state.title, "soccer-tactics")}.png`;
    try {
      await exportAsImage(boardRef.current, filename, "image/png", 2.5);
      track("export", { format: "png" });
      showToast(`Exported ${filename}`);
    } catch (err) {
      console.error("Export PNG failed:", err);
      showToast("Couldn't export the image. Please try again.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJPG = async () => {
    if (!boardRef.current) return;
    setIsExporting(true);
    setShowExportMenu(false);
    const filename = `${slugify(state.title, "soccer-tactics")}.jpg`;
    try {
      await exportAsImage(boardRef.current, filename, "image/jpeg", 2.5);
      track("export", { format: "jpg" });
      showToast(`Exported ${filename}`);
    } catch (err) {
      console.error("Export JPG failed:", err);
      showToast("Couldn't export the JPEG. Please try again.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!boardRef.current) return;
    setIsExporting(true);
    setShowExportMenu(false);
    const filename = `${slugify(state.title, "tactical-sheet")}.pdf`;
    try {
      await exportAsPDF(
        boardRef.current,
        getExportBoard?.() ?? state,
        filename,
      );
      track("export", { format: "pdf" });
      showToast(`Exported ${filename}`);
    } catch (err) {
      console.error("Export PDF failed:", err);
      showToast("Couldn't export the PDF. Please try again.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSVG = () => {
    if (!boardRef.current) return;
    setShowExportMenu(false);
    const filename = `${slugify(state.title, "soccer-tactics")}.svg`;
    exportAsSVG(boardRef.current, filename);
    track("export", { format: "svg" });
    showToast(`Exported ${filename}`);
  };

  const handleExportLegacyJSON = () => {
    setShowExportMenu(false);
    const filename = `${slugify(state.title, "tactics-frame")}-frame.json`;
    exportAsJSON(state, filename);
    track("export", { format: "json-legacy" });
    showToast(`Exported ${filename}`);
  };

  const handleSave = (saveAs: boolean) => {
    setShowExportMenu(false);
    void (saveAs ? projectFile.saveAs() : projectFile.save());
  };

  const handleOpen = async () => {
    setShowExportMenu(false);
    if (!(await projectFile.open())) fileInputRef.current?.click();
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const message = await projectFile.importFile(file);
    if (message) showToast(message, "error");
    else showToast(`Opened ${file.name}`);
  };

  const downloadProject = () =>
    downloadBlob(
      new Blob([JSON.stringify(projectDocument, null, 2)], {
        type: PROJECT_MIME,
      }),
      `${slugify(projectDocument.title, "tactics")}${PROJECT_EXTENSION}`,
    );

  return (
    <header className="w-full bg-slate-900 border-b border-slate-800 px-1.5 sm:px-4 py-1.5 md:py-2 flex items-center justify-between gap-1 sm:gap-2 z-40 sticky top-0 shadow-md min-w-0 overflow-x-auto scrollbar-none touch-pan-x">
      {/* App Logo & Title */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <div className="flex items-center justify-center h-7 sm:h-10 w-auto shrink-0">
          <img
            src="/logo.svg"
            alt="Tactical Soccer Board"
            className="h-7 sm:h-10 w-auto object-contain filter drop-shadow-md hover:scale-105 transition-transform"
            width="40"
            height="40"
          />
        </div>
        <div>
          <div className="flex items-center gap-1 sm:gap-2">
            <input
              type="text"
              value={state.title}
              readOnly={tactics.isPreviewing}
              onChange={(e) =>
                pushState((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Tactics Title..."
              className="text-xs sm:text-sm md:text-base font-bold bg-transparent hover:bg-slate-800/80 focus:bg-slate-800 text-slate-100 px-1 py-0.5 rounded border border-transparent focus:border-slate-600 outline-none transition w-16 sm:w-36 md:w-64 focus:w-28 sm:focus:w-48 md:focus:w-72"
            />
            {isRestoredFromCache && saveStatus.state === "saved" && (
              <span
                title="Board state automatically restored from local browser storage"
                className="hidden md:inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-800/70 px-1.5 py-0.5 rounded-full shrink-0"
              >
                <History className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-400" />
                <span className="hidden sm:inline">Restored</span>
              </span>
            )}
            {saveStatus.state === "error" && (
              <span
                role="alert"
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-300 bg-rose-950/70 border border-rose-800/70 px-1.5 py-0.5 rounded-full shrink-0"
              >
                {saveStatus.reason === "quota"
                  ? "Browser storage is full — not saved"
                  : "Not saved"}
                <button
                  type="button"
                  onClick={retrySave}
                  className="underline cursor-pointer"
                >
                  Retry
                </button>
                <button
                  type="button"
                  onClick={downloadProject}
                  className="underline cursor-pointer"
                >
                  Download
                </button>
              </span>
            )}
            {projectFile.fileName && (
              <span
                title="Ctrl/Cmd+S saves to this file"
                className="hidden md:inline-block text-[10px] text-slate-400 bg-slate-800/80 border border-slate-700/60 px-1.5 py-0.5 rounded-md shrink-0 max-w-40 truncate"
              >
                {projectFile.fileName}
              </span>
            )}
            {projectFile.error && (
              <span
                role="alert"
                className="inline-flex items-center gap-1 text-[10px] text-amber-300 bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.5 rounded-full shrink-0"
              >
                {projectFile.error}
                <button
                  type="button"
                  onClick={projectFile.clearError}
                  className="underline cursor-pointer"
                >
                  Dismiss
                </button>
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
          disabled={tactics.isPreviewing}
          title={
            tactics.isAnimated
              ? "Clear Lines & Annotations in this frame"
              : "Clear Lines & Annotations"
          }
          className="p-1.5 sm:p-2 rounded-md hover:bg-slate-800 text-amber-400 hover:text-amber-300 transition flex items-center gap-1 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden lg:inline">Clear Lines</span>
        </button>

        <button
          onClick={() => {
            if (
              confirm(
                tactics.isAnimated
                  ? "Reset the entire board and remove the animation?"
                  : "Reset the board to standard positions?",
              )
            ) {
              resetBoard();
            }
          }}
          title="Reset Whole Board"
          disabled={tactics.isPreviewing}
          className="p-1.5 sm:p-2 rounded-md hover:bg-red-950/50 text-red-400 hover:text-red-300 transition flex items-center gap-1 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
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
          accept={PROJECT_ACCEPT}
          className="hidden"
        />

        <button
          onClick={handleOpen}
          disabled={tactics.isPreviewing}
          title="Open a project file"
          className="hidden sm:flex items-center gap-1 px-2 py-1.5 sm:px-3 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Load</span>
        </button>

        {/* Export Dropdown */}
        <div className="relative" ref={exportDropdownRef}>
          <button
            ref={exportButtonRef}
            onClick={toggleExportMenu}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-lg shadow-emerald-900/30 transition cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">
              {isExporting ? "Exporting..." : "Save / Export"}
            </span>
            <span className="sm:hidden">{isExporting ? "..." : "File"}</span>
          </button>

          {showExportMenu && (
            <div
              style={{ top: exportMenuPos.top, right: exportMenuPos.right }}
              className="fixed w-52 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 p-1.5 z-70 text-slate-200 text-xs animate-in fade-in zoom-in-95"
            >
              <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Project
              </div>

              <button
                onClick={() => handleSave(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-700 transition text-left cursor-pointer"
              >
                <Save className="w-4 h-4 text-purple-400" />
                <div className="min-w-0">
                  <div className="font-semibold">Save (Ctrl/Cmd+S)</div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {projectFile.fileName
                      ? `To ${projectFile.fileName}`
                      : "All frames, as a .tacticalboard file"}
                  </div>
                </div>
              </button>

              {projectFile.canPick && (
                <button
                  onClick={() => handleSave(true)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-700 transition text-left cursor-pointer"
                >
                  <Save className="w-4 h-4 text-slate-400" />
                  <div className="font-semibold">Save As…</div>
                </button>
              )}

              {onShare && (
                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    onShare();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-700 transition text-left cursor-pointer"
                >
                  <Link2 className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="font-semibold">Share Link…</div>
                    <div className="text-[10px] text-slate-400">
                      Board stored in the link
                    </div>
                  </div>
                </button>
              )}

              <div className="my-1 border-t border-slate-700" />

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

              {onExportVideo && tactics.isAnimated && (
                <>
                  <button
                    onClick={() => {
                      setShowExportMenu(false);
                      onExportVideo("mp4");
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-700 transition text-left cursor-pointer"
                  >
                    <Film className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="font-semibold">Export Video (MP4)</div>
                      <div className="text-[10px] text-slate-400">
                        Plays on phones and in chat apps
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setShowExportMenu(false);
                      onExportVideo("mov");
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-700 transition text-left cursor-pointer"
                  >
                    <Film className="w-4 h-4 text-sky-400" />
                    <div>
                      <div className="font-semibold">Export Video (MOV)</div>
                      <div className="text-[10px] text-slate-400">
                        QuickTime movie
                      </div>
                    </div>
                  </button>
                </>
              )}

              <div className="my-1 border-t border-slate-700" />

              <button
                onClick={handleExportLegacyJSON}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-700 transition text-left cursor-pointer"
              >
                <FileDown className="w-4 h-4 text-purple-400" />
                <div>
                  <div className="font-semibold">
                    Current Frame (legacy JSON)
                  </div>
                  <div className="text-[10px] text-slate-400">
                    For older versions; no animation
                  </div>
                </div>
              </button>

              {/* Actions that don't fit in the header on small screens */}
              <div className="sm:hidden">
                <div className="my-1 border-t border-slate-700" />

                <button
                  onClick={handleOpen}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-700 transition text-left cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-slate-300" />
                  <div>
                    <div className="font-semibold">Load Project File</div>
                    <div className="text-[10px] text-slate-400">
                      Open a .tacticalboard or .json board
                    </div>
                  </div>
                </button>

                {onOpenHelp && (
                  <button
                    onClick={() => {
                      setShowExportMenu(false);
                      onOpenHelp();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-700 transition text-left cursor-pointer"
                  >
                    <HelpCircle className="w-4 h-4 text-slate-300" />
                    <div>
                      <div className="font-semibold">Help & Shortcuts</div>
                      <div className="text-[10px] text-slate-400">
                        How to use the board
                      </div>
                    </div>
                  </button>
                )}
              </div>
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
            className="hidden sm:block p-1.5 sm:p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition shrink-0 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}
      </div>
    </header>
  );
};

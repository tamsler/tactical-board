import React, { useEffect } from "react";
import {
  X,
  Keyboard,
  MousePointer,
  HelpCircle,
  Bug,
  Code2,
  ExternalLink,
  Mail,
} from "lucide-react";
import { APP_INFO } from "../../constants/appInfo";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-5 space-y-4 text-slate-200 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2 font-bold text-base text-slate-100">
            <HelpCircle className="w-5 h-5 text-emerald-400" />
            <span>Tactical Soccer Board</span>
            <span className="text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 px-1.5 py-0.5 rounded-full">
              v{APP_INFO.version}
            </span>
          </div>
          <button
            onClick={onClose}
            title="Close"
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="space-y-4 text-xs overflow-y-auto pr-1">
          {/* Shortcuts grid */}
          <div className="space-y-2">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Keyboard className="w-4 h-4 text-sky-400" />
              Keyboard Shortcuts
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Select Mode</span>
                <kbd className="px-2 py-0.5 bg-slate-800 rounded font-mono text-emerald-400 font-bold">
                  V
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Delete Selected</span>
                <kbd className="px-2 py-0.5 bg-slate-800 rounded font-mono text-rose-400 font-bold">
                  Del / ⌫
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Undo</span>
                <kbd className="px-2 py-0.5 bg-slate-800 rounded font-mono text-slate-200">
                  ⌘/Ctrl + Z
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Redo</span>
                <kbd className="px-2 py-0.5 bg-slate-800 rounded font-mono text-slate-200">
                  ⌘/Ctrl + Y
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Deselect / Cancel</span>
                <kbd className="px-2 py-0.5 bg-slate-800 rounded font-mono text-slate-200">
                  Esc
                </kbd>
              </div>
            </div>
          </div>

          {/* Tools guide */}
          <div className="space-y-2">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <MousePointer className="w-4 h-4 text-emerald-400" />
              Tactical Tools Guide
            </div>

            <ul className="space-y-1.5 text-slate-400 list-disc list-inside bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <li>
                <strong className="text-slate-200">Move & Drag:</strong> Switch
                to Select mode (V) to drag any player, ball, or equipment
                freely.
              </li>
              <li>
                <strong className="text-slate-200">Player Runs (↗️):</strong>{" "}
                Click & drag on pitch to draw solid movement arrows.
              </li>
              <li>
                <strong className="text-slate-200">Ball Passes (⇢):</strong>{" "}
                Click & drag to draw dashed passing vectors.
              </li>
              <li>
                <strong className="text-slate-200">Dribbles (〰️):</strong> Click
                & drag to draw squiggly dribble paths.
              </li>
              <li>
                <strong className="text-slate-200">Curved Passes (⌒):</strong>{" "}
                Draw an arched pass with Bézier curvature handle.
              </li>
              <li>
                <strong className="text-slate-200">Tactical Zones (🔲):</strong>{" "}
                Drag to highlight pressing zones, overloads, or half-spaces.
              </li>
              <li>
                <strong className="text-slate-200">Export:</strong> Click "Save
                / Export" to download high-res PNG, JPEG, SVG, or full PDF sheet
                with your coaching notes.
              </li>
            </ul>
          </div>

          {/* About & GitHub Info */}
          <div className="space-y-2">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-purple-400" />
              About & Feedback
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between text-slate-400">
                <span>Created by</span>
                <span className="font-semibold text-slate-200">
                  {APP_INFO.author}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Version</span>
                <span className="font-mono text-emerald-400 font-semibold">
                  v{APP_INFO.version}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 text-slate-400">
                <span>Contact</span>
                <a
                  href={`mailto:${APP_INFO.contactEmail}`}
                  className="flex items-center gap-1.5 font-semibold text-sky-400 hover:text-sky-300 transition cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{APP_INFO.contactEmail}</span>
                </a>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row gap-2">
                <a
                  href={APP_INFO.githubRepo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                  <span>GitHub Repository</span>
                </a>

                <a
                  href={APP_INFO.issuesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 rounded-lg font-medium transition cursor-pointer"
                >
                  <Bug className="w-3.5 h-3.5 text-rose-400" />
                  <span>Submit Issue / Bug</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition cursor-pointer"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

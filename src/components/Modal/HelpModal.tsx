import React from "react";
import { X, Keyboard, MousePointer, HelpCircle } from "lucide-react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-5 space-y-4 text-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 font-bold text-base text-slate-100">
            <HelpCircle className="w-5 h-5 text-emerald-400" />
            Tactical Soccer Board - User Guide
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts grid */}
        <div className="space-y-3 text-xs">
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

          <div className="font-semibold text-slate-300 flex items-center gap-1.5 pt-2">
            <MousePointer className="w-4 h-4 text-emerald-400" />
            Tactical Tools Guide
          </div>

          <ul className="space-y-1.5 text-slate-400 list-disc list-inside">
            <li>
              <strong className="text-slate-200">Move & Drag:</strong> Switch to
              Select mode (V) to drag any player, ball, or equipment freely.
            </li>
            <li>
              <strong className="text-slate-200">Player Runs (↗️):</strong>{" "}
              Click & drag on pitch to draw solid movement arrows.
            </li>
            <li>
              <strong className="text-slate-200">Ball Passes (⇢):</strong> Click
              & drag to draw dashed passing vectors.
            </li>
            <li>
              <strong className="text-slate-200">Dribbles (〰️):</strong> Click &
              drag to draw squiggly dribble paths.
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
              <strong className="text-slate-200">Export:</strong> Click "Save /
              Export" to download high-res PNG, JPEG, SVG, or full PDF sheet
              with your coaching notes.
            </li>
          </ul>
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

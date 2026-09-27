import React from "react";
import { AlertTriangle } from "lucide-react";
import type { StorageProblem } from "../../animation/storage";
import { downloadBlob } from "../../utils/fileAccess";

interface StorageRecoveryBannerProps {
  problem: StorageProblem;
  onDiscard: () => void;
}

/** Shown when saved data can't be read; autosave stays paused until the user chooses. */
export const StorageRecoveryBanner: React.FC<StorageRecoveryBannerProps> = ({
  problem,
  onDiscard,
}) => (
  <div
    role="alert"
    className="w-full bg-amber-950/80 border-b border-amber-800 text-amber-100 text-xs px-3 py-2 flex flex-wrap items-center gap-2"
  >
    <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
    <span className="flex-1 min-w-48">
      {problem.reason} Autosave is paused so it isn't overwritten.
    </span>
    <button
      type="button"
      onClick={() =>
        downloadBlob(
          new Blob([problem.raw], { type: "application/json" }),
          "tactical-board-backup.json",
        )
      }
      className="h-8 px-3 rounded-lg bg-amber-800 hover:bg-amber-700 font-semibold cursor-pointer"
    >
      Download backup
    </button>
    <button
      type="button"
      onClick={() => {
        if (
          confirm(
            "Replace the unreadable saved board with the board on screen? Download a backup first if you may need it.",
          )
        ) {
          onDiscard();
        }
      }}
      className="h-8 px-3 rounded-lg border border-amber-700 hover:bg-amber-900 font-semibold cursor-pointer"
    >
      Discard and resume saving
    </button>
  </div>
);

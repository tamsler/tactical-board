import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";
import type { ImportedProject } from "../../animation/migrate";
import { checkPastedDocument, feedbackFor } from "../../animation/pasteImport";
import { track } from "../../utils/analytics";

interface PasteImportDialogProps {
  /** `warnings` is the number of advisory warnings the opened drill had. */
  onImport: (project: ImportedProject, warnings: number) => void;
  onClose: () => void;
}

/** Where the prompt and instructions for writing documents with an assistant live. */
export const AI_GUIDE_URL = "/ai/";

export const PasteImportDialog: React.FC<PasteImportDialogProps> = ({
  onImport,
  onClose,
}) => {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const check = useMemo(
    () => (text.trim() === "" ? null : checkPastedDocument(text)),
    [text],
  );
  const hasFeedback =
    check !== null && (!check.ok || check.warnings.length > 0);
  const warningCount = check?.ok ? check.warnings.length : 0;
  // How far the coach got, for usage events. Never the pasted text itself.
  const result =
    check === null
      ? "empty"
      : !check.ok
        ? "invalid"
        : warningCount > 0
          ? "warnings"
          : "valid";

  // The ref keeps Strict Mode's second mount from reporting a second open.
  const reportedOpen = useRef(false);
  useEffect(() => {
    if (reportedOpen.current) return;
    reportedOpen.current = true;
    track("ai_paste_opened");
  }, []);

  // Every way out that does not open a board.
  const close = useCallback(() => {
    track("ai_paste_abandoned", { result });
    onClose();
  }, [onClose, result]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [close]);

  const copyFeedback = async () => {
    if (!check) return;
    try {
      await navigator.clipboard.writeText(feedbackFor(check));
      setCopied(true);
      track("ai_paste_feedback_copied", { result, warnings: warningCount });
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      onClick={close}
      className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="paste-import-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 space-y-3 text-slate-200 text-xs"
      >
        <div className="flex items-center justify-between">
          <h2
            id="paste-import-title"
            className="flex items-center gap-2 font-bold text-base text-slate-100"
          >
            <Sparkles className="w-5 h-5 text-emerald-400" />
            Paste from AI
          </h2>
          <button
            type="button"
            onClick={close}
            title="Close"
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        <p className="text-slate-400">
          Paste a drill written by an AI assistant. You can paste the whole
          reply; the board is checked before anything is replaced.{" "}
          <a
            href={AI_GUIDE_URL}
            target="_blank"
            rel="noreferrer"
            className="text-emerald-400 hover:text-emerald-300 underline"
          >
            How to create drills with AI
          </a>
        </p>

        <textarea
          aria-label="Drill from the assistant"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setCopied(false);
          }}
          autoFocus
          spellCheck={false}
          placeholder='{ "kind": "tactical-board-document", … }'
          className="w-full h-36 bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono text-[11px] resize-y"
        />

        {check && !check.ok && (
          <div role="alert" className="flex gap-2 text-rose-300">
            <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="min-w-0 break-words">{check.error}</p>
          </div>
        )}

        {check?.ok && (
          <div role="status" className="space-y-2">
            <div className="flex gap-2 text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="min-w-0 break-words">Valid. {check.summary}</p>
            </div>
            {check.warnings.length > 0 && (
              <div className="flex gap-2 text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p>
                    {check.warnings.length === 1
                      ? "1 warning. You can open the board anyway."
                      : `${check.warnings.length} warnings. You can open the board anyway.`}
                  </p>
                  <ul className="mt-1 max-h-32 overflow-y-auto list-disc pl-4 space-y-0.5 text-amber-200/90">
                    {check.warnings.map((w) => (
                      <li key={w} className="break-words">
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2 pt-1">
          {hasFeedback && (
            <button
              type="button"
              onClick={copyFeedback}
              title="Copy these messages to send back to the assistant"
              className="h-10 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-bold flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? "Copied" : "Copy feedback for the AI"}
            </button>
          )}
          <button
            type="button"
            disabled={!check?.ok}
            onClick={() => {
              if (check?.ok) onImport(check.project, warningCount);
            }}
            title="Replaces the current board; you can undo"
            className="h-10 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Open on board
          </button>
        </div>
      </div>
    </div>
  );
};

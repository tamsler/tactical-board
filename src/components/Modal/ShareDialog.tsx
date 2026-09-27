import React, { useEffect, useRef, useState } from "react";
import { Check, Copy, Link2, X } from "lucide-react";
import type { TacticsDocument } from "../../animation/model";
import {
  LONG_LINK_WARNING,
  createShareLink,
  supportsShareLinks,
} from "../../animation/shareLink";

interface ShareDialogProps {
  document: TacticsDocument;
  onClose: () => void;
}

export const ShareDialog: React.FC<ShareDialogProps> = ({
  document: doc,
  onClose,
}) => {
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(
    supportsShareLinks() ? null : "This browser cannot create share links.",
  );
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!supportsShareLinks()) return;
    let cancelled = false;
    createShareLink(doc).then(
      (url) => !cancelled && setLink(url),
      () => !cancelled && setError("The share link could not be created."),
    );
    return () => {
      cancelled = true;
    };
  }, [doc]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      inputRef.current?.select();
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-5 space-y-3 text-slate-200 text-xs"
      >
        <div className="flex items-center justify-between">
          <h2
            id="share-title"
            className="flex items-center gap-2 font-bold text-base text-slate-100"
          >
            <Link2 className="w-5 h-5 text-emerald-400" />
            Share link
          </h2>
          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        <p className="text-slate-400">
          The whole board, including every frame, is stored inside the link.
          Nothing is uploaded, but anyone with the link can open the board.
        </p>

        {error ? (
          <p role="alert" className="text-rose-400">
            {error}
          </p>
        ) : (
          <>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                readOnly
                aria-label="Share link"
                value={link ?? "Creating link…"}
                onFocus={(e) => e.currentTarget.select()}
                className="flex-1 min-w-0 h-10 bg-slate-800 border border-slate-700 rounded-lg px-2 text-slate-100 font-mono text-[11px]"
              />
              <button
                type="button"
                onClick={copy}
                disabled={!link}
                className="h-10 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            {link && link.length > LONG_LINK_WARNING && (
              <p className="text-amber-300">
                This link is {link.length.toLocaleString()} characters long.
                Some messaging apps shorten long links; send a project file
                instead if it doesn't open.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

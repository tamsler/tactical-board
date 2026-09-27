import React, { useSyncExternalStore } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { dismissToast, toastStore } from "../../utils/toast";

/** Stack of short confirmations below the header; announced politely to screen readers. */
export const Toaster: React.FC = () => {
  const toasts = useSyncExternalStore(
    toastStore.subscribe,
    toastStore.getSnapshot,
  );

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-14 sm:top-16 left-1/2 -translate-x-1/2 z-90 flex flex-col items-center gap-2 pointer-events-none w-[min(92vw,26rem)]"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto w-full flex items-center gap-2 px-3 py-2 rounded-xl border shadow-2xl text-xs font-semibold animate-in fade-in slide-in-from-top-2 ${
            t.tone === "success"
              ? "bg-slate-900/95 border-emerald-700/70 text-slate-100"
              : "bg-rose-950/95 border-rose-700/70 text-rose-100"
          }`}
        >
          {t.tone === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
          )}
          <span className="flex-1 min-w-0 break-words">{t.message}</span>
          <button
            type="button"
            onClick={() => dismissToast(t.id)}
            title="Dismiss"
            className="p-0.5 rounded text-slate-400 hover:text-slate-100 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span className="sr-only">Dismiss</span>
          </button>
        </div>
      ))}
    </div>
  );
};

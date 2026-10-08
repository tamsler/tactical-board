import React, { useId, useState } from "react";
import type { AnimationFrame, Easing } from "../../animation/model";
import { EASINGS, LIMITS, frameLabel, toSeconds } from "../../animation/model";

const EASING_LABELS: Record<Easing, string> = {
  linear: "Steady speed",
  easeInOut: "Natural (speeds up, then slows)",
};

interface FrameInspectorProps {
  frame: AnimationFrame;
  index: number;
  isLast: boolean;
  onRename: (title: string) => void;
  /** Returns an error message when the value is rejected. */
  onSetTiming: (timing: {
    holdMs?: number;
    durationMs?: number;
  }) => string | null;
  onSetEasing: (easing: Easing) => void;
}

/** Remount with a key built from the frame's stored values to reset local drafts. */
export const FrameInspector: React.FC<FrameInspectorProps> = ({
  frame,
  index,
  isLast,
  onRename,
  onSetTiming,
  onSetEasing,
}) => {
  const id = useId();
  const [title, setTitle] = useState(frame.title);
  const [hold, setHold] = useState(toSeconds(frame.holdMs));
  const [duration, setDuration] = useState(toSeconds(frame.durationMs));
  const [error, setError] = useState<{
    field: "holdMs" | "durationMs";
    message: string;
  } | null>(null);

  const commitTitle = () => {
    const next = title.trim();
    if (next !== frame.title) onRename(next);
  };

  const commitTiming = (field: "holdMs" | "durationMs", value: string) => {
    const seconds = Number(value);
    if (value.trim() === "" || !Number.isFinite(seconds)) {
      setError({ field, message: "Enter a time in seconds." });
      return;
    }
    const ms = Math.round(seconds * 1000);
    if (ms === frame[field]) {
      setError(null);
      return;
    }
    const message = onSetTiming({ [field]: ms });
    setError(message ? { field, message } : null);
  };

  const onKeyDown =
    (revert: () => void) => (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") e.currentTarget.blur();
      if (e.key === "Escape") {
        revert();
        setError(null);
      }
    };

  const inputClass =
    "bg-slate-800 border border-slate-700 rounded-lg px-2 h-9 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 aria-invalid:border-rose-500";

  return (
    <div className="flex flex-wrap items-end gap-x-3 gap-y-2 text-[11px] text-slate-300">
      <div className="flex flex-col gap-1 min-w-0 flex-1 basis-40">
        <label htmlFor={`${id}-title`} className="font-semibold text-slate-400">
          Editing {frameLabel(frame, index)} — label
        </label>
        <input
          id={`${id}-title`}
          type="text"
          value={title}
          maxLength={LIMITS.maxTitleLength}
          placeholder={`Frame ${index + 1}`}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={onKeyDown(() => setTitle(frame.title))}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-hold`} className="font-semibold text-slate-400">
          Hold this frame (s)
        </label>
        <input
          id={`${id}-hold`}
          type="number"
          inputMode="decimal"
          min={0}
          max={LIMITS.maxHoldMs / 1000}
          step={0.1}
          value={hold}
          aria-invalid={error?.field === "holdMs"}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(e) => setHold(e.target.value)}
          onBlur={(e) => commitTiming("holdMs", e.target.value)}
          onKeyDown={onKeyDown(() => setHold(toSeconds(frame.holdMs)))}
          className={`${inputClass} w-20`}
        />
      </div>

      {isLast ? (
        <p className="text-slate-500 h-9 flex items-center">
          Last frame — no move after it.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <label
              htmlFor={`${id}-duration`}
              className="font-semibold text-slate-400"
            >
              Move to next frame (s)
            </label>
            <input
              id={`${id}-duration`}
              type="number"
              inputMode="decimal"
              min={LIMITS.minDurationMs / 1000}
              max={LIMITS.maxDurationMs / 1000}
              step={0.1}
              value={duration}
              aria-invalid={error?.field === "durationMs"}
              aria-describedby={error ? `${id}-error` : undefined}
              onChange={(e) => setDuration(e.target.value)}
              onBlur={(e) => commitTiming("durationMs", e.target.value)}
              onKeyDown={onKeyDown(() =>
                setDuration(toSeconds(frame.durationMs)),
              )}
              className={`${inputClass} w-20`}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor={`${id}-easing`}
              className="font-semibold text-slate-400"
            >
              Move pacing
            </label>
            <select
              id={`${id}-easing`}
              value={frame.easing ?? "linear"}
              onChange={(e) => onSetEasing(e.target.value as Easing)}
              className={`${inputClass} cursor-pointer`}
            >
              {EASINGS.map((easing) => (
                <option key={easing} value={easing}>
                  {EASING_LABELS[easing]}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      <p
        id={`${id}-error`}
        role="status"
        className="basis-full text-rose-400 min-h-0 empty:hidden"
      >
        {error?.message ?? ""}
      </p>
    </div>
  );
};

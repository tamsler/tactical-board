import React, {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  Film,
  Plus,
  Route,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import type { useTacticsState } from "../../hooks/useTacticsState";
import { LIMITS, frameLabel, toSeconds } from "../../animation/model";
import { segmentIndexAt } from "../../animation/timeline";
import type { AnimationPlayback } from "../../animation/useAnimationPlayback";
import { track } from "../../utils/analytics";
import { FrameInspector } from "./FrameInspector";
import { PlaybackControls } from "./PlaybackControls";

interface FrameTimelineProps {
  tactics: ReturnType<typeof useTacticsState>;
  playback: AnimationPlayback;
  /** Hides the editor; only offered while the board still has one frame. */
  onClose: () => void;
}

const NOTICE_MS = 6000;

const iconButton =
  "h-10 w-10 shrink-0 flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 disabled:cursor-not-allowed transition cursor-pointer";

export const FrameTimeline: React.FC<FrameTimelineProps> = ({
  tactics,
  playback,
  onClose,
}) => {
  const {
    frames,
    selectedFrameId,
    isAnimated,
    isPreviewing,
    addFrame,
    deleteFrame,
    moveFrame,
    renameFrame,
    setFrameTiming,
    undo,
    showPreviousFrame,
    setShowPreviousFrame,
  } = tactics;
  const { controller, timeline, editFrame } = playback;

  const [collapsed, setCollapsed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const listRef = useRef<HTMLOListElement | null>(null);

  const index = Math.max(
    0,
    frames.findIndex((f) => f.id === selectedFrameId),
  );
  const frame = frames[index];
  const isLast = index === frames.length - 1;
  const label = frameLabel(frame, index);
  const totalMs = timeline.totalMs;
  // Re-renders only when the playhead crosses into another frame, not per tick.
  const playheadIndex = useSyncExternalStore(controller.subscribe, () =>
    segmentIndexAt(timeline, controller.getSnapshot().timeMs),
  );

  useEffect(() => {
    listRef.current
      ?.querySelector(
        isPreviewing ? '[data-playhead="true"]' : '[aria-current="true"]',
      )
      ?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }, [selectedFrameId, collapsed, isPreviewing, playheadIndex]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  const handleAdd = () => {
    if (frames.length === 1) track("animation_created");
    addFrame();
    track("animation_frame_added", { frames: frames.length + 1 });
    setNotice(null);
  };

  const handleDelete = () => {
    deleteFrame(frame.id);
    setNotice(`${label} deleted. The sequence is now shorter.`);
  };

  const handleMove = (delta: -1 | 1) => {
    moveFrame(frame.id, index + delta);
    setNotice(`${label} moved ${delta < 0 ? "earlier" : "later"}.`);
  };

  const handleUndo = () => {
    undo();
    setNotice(null);
  };

  return (
    <section
      aria-label="Animation frames"
      className="w-full max-w-5xl mx-auto bg-slate-900 border border-slate-800 rounded-xl md:rounded-2xl shadow-2xl px-2 py-1.5 md:px-3 md:py-2 space-y-2"
    >
      {/* Header */}
      <div className="flex items-center gap-2 text-xs">
        <Film className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="font-bold text-slate-100">Animation</span>
        <span className="text-slate-400 truncate">
          {frames.length} {frames.length === 1 ? "frame" : "frames"} ·{" "}
          {toSeconds(totalMs)} s
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowPreviousFrame(!showPreviousFrame)}
            aria-pressed={showPreviousFrame}
            title="Show where players and the ball were in the previous frame. Drag the dot on an arrow to curve a move."
            className={`h-8 px-2 rounded-lg flex items-center gap-1.5 text-[11px] font-semibold transition cursor-pointer ${
              showPreviousFrame
                ? "bg-slate-800 text-emerald-300 ring-1 ring-emerald-500/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Route className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Show moves</span>
            <span className="sr-only sm:hidden">Show moves</span>
          </button>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-expanded={!collapsed}
            title={collapsed ? "Show frames" : "Hide frames"}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer"
          >
            {collapsed ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            <span className="sr-only">
              {collapsed ? "Show frames" : "Hide frames"}
            </span>
          </button>
          {!isAnimated && (
            <button
              type="button"
              onClick={onClose}
              title="Close animation editor"
              className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span className="sr-only">Close animation editor</span>
            </button>
          )}
        </div>
      </div>

      <PlaybackControls
        playback={playback}
        frameCount={frames.length}
        selectedIndex={index}
      />

      {!collapsed && (
        <>
          {/* Frame strip and actions */}
          <div className="flex items-stretch gap-2">
            <ol
              ref={listRef}
              className="flex-1 min-w-0 flex items-stretch gap-1.5 overflow-x-auto scrollbar-none touch-pan-x py-0.5"
            >
              {frames.map((f, i) => {
                const selected = f.id === selectedFrameId && !isPreviewing;
                const atPlayhead = isPreviewing && i === playheadIndex;
                const last = i === frames.length - 1;
                return (
                  <li key={f.id} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => editFrame(f.id)}
                      aria-current={selected}
                      data-playhead={atPlayhead}
                      aria-label={`${frameLabel(f, i)}, hold ${toSeconds(f.holdMs)} seconds${
                        last
                          ? ""
                          : `, then move for ${toSeconds(f.durationMs)} seconds`
                      }`}
                      className={`min-h-11 min-w-24 max-w-40 px-2.5 py-1 rounded-lg border text-left flex flex-col justify-center transition cursor-pointer ${
                        selected
                          ? "bg-emerald-600/20 border-emerald-500 ring-1 ring-emerald-500 text-white"
                          : atPlayhead
                            ? "bg-sky-600/20 border-sky-500 ring-1 ring-sky-500 text-white"
                            : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      <span className="flex items-center gap-1.5 text-[11px] font-bold">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                            selected
                              ? "bg-emerald-500 text-white"
                              : "bg-slate-700"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span className="truncate">{frameLabel(f, i)}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 tabular-nums">
                        {f.holdMs > 0 && `hold ${toSeconds(f.holdMs)} s`}
                        {f.holdMs > 0 && !last && " · "}
                        {!last && `→ ${toSeconds(f.durationMs)} s`}
                        {last && f.holdMs === 0 && "end"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => handleMove(-1)}
                disabled={isPreviewing || index === 0}
                title="Move frame earlier"
                className={iconButton}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="sr-only">Move frame earlier</span>
              </button>
              <button
                type="button"
                onClick={() => handleMove(1)}
                disabled={isPreviewing || isLast}
                title="Move frame later"
                className={iconButton}
              >
                <ChevronRight className="w-4 h-4" />
                <span className="sr-only">Move frame later</span>
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPreviewing || frames.length === 1}
                title="Delete frame"
                className={`${iconButton} text-rose-400`}
              >
                <Trash2 className="w-4 h-4" />
                <span className="sr-only">Delete frame</span>
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={isPreviewing || frames.length >= LIMITS.maxFrames}
                title="Add a copy of this frame after it"
                className="h-10 px-3 shrink-0 flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold disabled:opacity-40 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add frame</span>
              </button>
            </div>
          </div>

          {frames.length === 1 ? (
            <p className="text-[11px] text-slate-400">
              Add a frame, then drag players and the ball to their next
              positions.
            </p>
          ) : (
            !isPreviewing &&
            showPreviousFrame && (
              <p className="text-[11px] text-slate-400">
                {index === 0
                  ? "Moves appear from Frame 2."
                  : "Drag the dot on an arrow to curve a move; double-click it to straighten."}
              </p>
            )
          )}

          {isPreviewing ? (
            <p className="flex items-center gap-1.5 text-[11px] text-sky-300 h-9">
              <Eye className="w-3.5 h-3.5" />
              Preview — select a frame to edit it.
            </p>
          ) : (
            <FrameInspector
              key={`${frame.id}:${frame.title}:${frame.holdMs}:${frame.durationMs}:${isLast}`}
              frame={frame}
              index={index}
              isLast={isLast}
              onRename={(title) => renameFrame(frame.id, title)}
              onSetTiming={(timing) => setFrameTiming(frame.id, timing)}
            />
          )}
        </>
      )}

      <div role="status" aria-live="polite" className="empty:hidden">
        {notice && (
          <div className="flex items-center gap-2 text-[11px] text-slate-300 bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1">
            <span>{notice}</span>
            <button
              type="button"
              onClick={handleUndo}
              className="ml-auto flex items-center gap-1 font-bold text-emerald-300 hover:text-emerald-200 cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Undo
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

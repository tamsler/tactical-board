import React, { useSyncExternalStore } from "react";
import {
  Pause,
  Play,
  Repeat,
  RotateCcw,
  SkipBack,
  SkipForward,
} from "lucide-react";
import {
  PLAYBACK_RATES,
  toSeconds,
  type PlaybackRate,
} from "../../animation/model";
import type { AnimationPlayback } from "../../animation/useAnimationPlayback";

interface PlaybackControlsProps {
  playback: AnimationPlayback;
  frameCount: number;
  selectedIndex: number;
}

const button =
  "h-10 w-9 @xs:w-10 shrink-0 flex items-center justify-center rounded-lg text-slate-200 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition cursor-pointer";

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  playback,
  frameCount,
  selectedIndex,
}) => {
  const { controller, timeline, canPlay, isPreviewing } = playback;
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
  );
  const isPlaying = state.status === "playing";
  const total = timeline.totalMs;
  const playTitle = !canPlay
    ? total === 0
      ? "Add a frame to animate"
      : "Finish the current drag first"
    : isPlaying
      ? "Pause (Space)"
      : "Play (Space)";

  // Sized by its own width, not the screen's: the panel is also narrow on a
  // tablet with the sidebar open. When the controls do not fit on one line the
  // seek slider takes a second, full-width line.
  return (
    <div className="@container min-w-0">
      <div className="flex flex-wrap items-center gap-1 min-w-0">
        <button
          type="button"
          onClick={playback.restart}
          title="Restart from Frame 1"
          className={button}
        >
          <RotateCcw className="w-4 h-4" />
          <span className="sr-only">Restart from Frame 1</span>
        </button>
        <button
          type="button"
          onClick={() => playback.step(-1)}
          disabled={!isPreviewing && selectedIndex === 0}
          title="Previous frame (,)"
          className={button}
        >
          <SkipBack className="w-4 h-4" />
          <span className="sr-only">Previous frame</span>
        </button>
        <button
          type="button"
          onClick={playback.togglePlay}
          disabled={!canPlay}
          title={playTitle}
          className="h-10 w-9 @xs:w-10 shrink-0 flex items-center justify-center rounded-full bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 disabled:hover:bg-emerald-600 disabled:cursor-not-allowed transition cursor-pointer"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          <span className="sr-only">{isPlaying ? "Pause" : "Play"}</span>
        </button>
        <button
          type="button"
          onClick={() => playback.step(1)}
          disabled={!isPreviewing && selectedIndex === frameCount - 1}
          title="Next frame (.)"
          className={button}
        >
          <SkipForward className="w-4 h-4" />
          <span className="sr-only">Next frame</span>
        </button>

        <input
          type="range"
          min={0}
          max={Math.max(total, 1)}
          step={10}
          value={state.timeMs}
          disabled={total === 0}
          onChange={(e) => playback.seek(Number(e.target.value))}
          aria-label="Playback position"
          aria-valuetext={`${toSeconds(state.timeMs)} of ${toSeconds(total)} seconds`}
          className="order-last basis-full @sm:order-none @sm:flex-1 min-w-16 accent-emerald-500 h-10 cursor-pointer disabled:cursor-not-allowed"
        />
        <span className="text-[11px] text-slate-400 tabular-nums shrink-0 hidden @md:inline">
          {toSeconds(state.timeMs)} / {toSeconds(total)} s
        </span>

        <button
          type="button"
          onClick={() => playback.setLoop(!state.loop)}
          aria-pressed={state.loop}
          title="Loop playback"
          className={`${button} ml-auto @sm:ml-0 ${state.loop ? "text-emerald-300 bg-slate-800" : "text-slate-400"}`}
        >
          <Repeat className="w-4 h-4" />
          <span className="sr-only">Loop playback</span>
        </button>
        <label className="sr-only" htmlFor="playback-rate">
          Playback speed
        </label>
        <select
          id="playback-rate"
          value={state.rate}
          onChange={(e) =>
            playback.setRate(Number(e.target.value) as PlaybackRate)
          }
          title="Playback speed"
          className="h-10 shrink-0 bg-slate-800 border border-slate-700 rounded-lg px-1.5 text-xs text-slate-100 cursor-pointer"
        >
          {PLAYBACK_RATES.map((r) => (
            <option key={r} value={r}>
              {r}×
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

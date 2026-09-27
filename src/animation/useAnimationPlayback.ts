import { useCallback, useEffect, useMemo, useState } from "react";
import type { useTacticsState } from "../hooks/useTacticsState";
import { track } from "../utils/analytics";
import type { PlaybackRate } from "./model";
import {
  PlaybackController,
  browserClock,
  type PlaybackClock,
} from "./playback";
import { compileTimeline, segmentIndexAt } from "./timeline";

type Tactics = ReturnType<typeof useTacticsState>;

/**
 * Connects the playback controller to the editor: Play and scrubbing enter a
 * read-only preview, selecting a frame returns to editing it.
 */
export function useAnimationPlayback(
  tactics: Tactics,
  clock: PlaybackClock = browserClock,
) {
  const {
    frames,
    selectedFrameId,
    selectFrame,
    isPreviewing,
    setPreviewing,
    hasDraft,
  } = tactics;
  const timeline = useMemo(() => compileTimeline(frames), [frames]);
  const [controller] = useState(
    () => new PlaybackController(timeline.totalMs, clock),
  );
  const selectedIndex = Math.max(
    0,
    frames.findIndex((f) => f.id === selectedFrameId),
  );

  useEffect(() => {
    controller.setTotal(timeline.totalMs);
  }, [controller, timeline.totalMs]);

  // While editing, the playhead sits at the start of the selected frame's hold.
  useEffect(() => {
    if (!isPreviewing) controller.seek(timeline.starts[selectedIndex] ?? 0);
  }, [controller, isPreviewing, timeline, selectedIndex]);

  // Pause when the tab is hidden and on unmount; resuming is always explicit.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") controller.pause();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      controller.pause();
    };
  }, [controller]);

  const canPlay = timeline.totalMs > 0 && !hasDraft;

  const editFrame = useCallback(
    (frameId: string) => {
      controller.pause();
      setPreviewing(false);
      selectFrame(frameId);
    },
    [controller, setPreviewing, selectFrame],
  );

  const play = useCallback(() => {
    if (timeline.totalMs <= 0 || hasDraft) return;
    setPreviewing(true);
    controller.play();
    track("animation_played", { frames: frames.length });
  }, [controller, setPreviewing, timeline.totalMs, hasDraft, frames.length]);

  const pause = useCallback(() => controller.pause(), [controller]);

  const togglePlay = useCallback(() => {
    if (controller.getSnapshot().status === "playing") pause();
    else play();
  }, [controller, play, pause]);

  const seek = useCallback(
    (timeMs: number) => {
      if (hasDraft) return;
      controller.pause();
      setPreviewing(true);
      controller.seek(timeMs);
    },
    [controller, setPreviewing, hasDraft],
  );

  const restart = useCallback(() => {
    editFrame(frames[0].id);
    controller.seek(0);
  }, [controller, editFrame, frames]);

  /** Neighbouring authored frame; within a move, previous is its source and next its target. */
  const step = useCallback(
    (direction: -1 | 1) => {
      let target = selectedIndex + direction;
      if (isPreviewing) {
        const t = controller.getSnapshot().timeMs;
        const source = segmentIndexAt(timeline, t);
        const inMove =
          source < frames.length - 1 &&
          t >= timeline.starts[source] + timeline.holds[source];
        target = inMove
          ? direction < 0
            ? source
            : source + 1
          : source + direction;
      }
      if (target >= 0 && target < frames.length) editFrame(frames[target].id);
    },
    [controller, editFrame, frames, isPreviewing, selectedIndex, timeline],
  );

  const setRate = useCallback(
    (rate: PlaybackRate) => controller.setRate(rate),
    [controller],
  );
  const setLoop = useCallback(
    (loop: boolean) => controller.setLoop(loop),
    [controller],
  );

  return {
    controller,
    timeline,
    isPreviewing,
    canPlay,
    play,
    pause,
    togglePlay,
    seek,
    restart,
    step,
    editFrame,
    setRate,
    setLoop,
  };
}

export type AnimationPlayback = ReturnType<typeof useAnimationPlayback>;

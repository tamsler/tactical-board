import React, { useMemo, useSyncExternalStore } from "react";
import type { Player } from "../../types/tactics";
import type { AnimationFrame } from "../../animation/model";
import type { PlaybackController } from "../../animation/playback";
import { sampleAt } from "../../animation/sample";
import type { Timeline } from "../../animation/timeline";
import { StaticBoardEntities } from "./StaticBoardEntities";

interface SampledBoardLayerProps {
  controller: PlaybackController;
  frames: AnimationFrame[];
  timeline: Timeline;
  isPlayerVisible: (p: Player) => boolean;
  showPlayerLabels: boolean;
}

/** The only component that re-renders per playback tick; it never writes to frames. */
export const SampledBoardLayer: React.FC<SampledBoardLayerProps> = ({
  controller,
  frames,
  timeline,
  isPlayerVisible,
  showPlayerLabels,
}) => {
  const { timeMs } = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
  );
  const { frame } = useMemo(
    () => sampleAt(frames, timeline, timeMs),
    [frames, timeline, timeMs],
  );

  return (
    <StaticBoardEntities
      frame={frame}
      isPlayerVisible={isPlayerVisible}
      showPlayerLabels={showPlayerLabels}
    />
  );
};

import React from "react";
import type { Player, TacticFrame } from "../../types/tactics";
import { PitchDrawings } from "../Pitch/PitchDrawings";
import { PitchEquipment } from "../Pitch/PitchEquipment";
import { PitchBall } from "../Pitch/PitchBall";
import { PitchPlayer } from "../Pitch/PitchPlayer";

interface StaticBoardEntitiesProps {
  frame: TacticFrame;
  isPlayerVisible: (p: Player) => boolean;
  showPlayerLabels: boolean;
}

const noop = () => {};

/** Non-interactive board content for playback and offline video rendering. */
export const StaticBoardEntities: React.FC<StaticBoardEntitiesProps> = ({
  frame,
  isPlayerVisible,
  showPlayerLabels,
}) => (
  <g pointerEvents="none">
    <PitchDrawings
      lines={frame.lines}
      shapes={frame.shapes}
      texts={frame.texts}
      selectedId={null}
      onLinePointerDown={noop}
      onShapePointerDown={noop}
      onTextPointerDown={noop}
    />
    {frame.equipments.map((eq) => (
      <PitchEquipment
        key={eq.id}
        equipment={eq}
        isSelected={false}
        onPointerDown={noop}
      />
    ))}
    {frame.balls.map((b) => (
      <PitchBall key={b.id} ball={b} isSelected={false} onPointerDown={noop} />
    ))}
    {frame.players.filter(isPlayerVisible).map((p) => (
      <PitchPlayer
        key={p.id}
        player={p}
        isSelected={false}
        showPlayerLabels={showPlayerLabels}
        onSelect={noop}
        onPointerDown={noop}
      />
    ))}
  </g>
);

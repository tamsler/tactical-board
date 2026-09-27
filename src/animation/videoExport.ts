import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  BufferTarget,
  CanvasSource,
  MovOutputFormat,
  Mp4OutputFormat,
  Output,
  QUALITY_HIGH,
  canEncodeVideo,
} from "mediabunny";
import type {
  GrassStyle,
  MatchFormat,
  PitchType,
  Player,
} from "../types/tactics";
import { PITCH_HEIGHT, PITCH_WIDTH } from "../constants/formations";
import { SoccerPitch } from "../components/Pitch/SoccerPitch";
import { StaticBoardEntities } from "../components/Animation/StaticBoardEntities";
import type { AnimationFrame } from "./model";
import { sampleAt } from "./sample";
import { compileTimeline } from "./timeline";

export type VideoFormat = "mp4" | "mov";

export interface VideoView {
  grassStyle: GrassStyle;
  pitchType: PitchType;
  matchFormat: MatchFormat;
  showBuildOutLines: boolean;
  showGrid: boolean;
  showZones: boolean;
  showPlayerLabels: boolean;
  hiddenTeams: { A: boolean; B: boolean };
}

export interface VideoExportOptions {
  frames: AnimationFrame[];
  view: VideoView;
  format: VideoFormat;
  fps?: number;
  width?: number;
  /** Extra time on the final pose so players do not stop on the last frame. */
  endHoldMs?: number;
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
}

export class VideoExportUnsupportedError extends Error {}

const BACKGROUND = "#0f172a";

function svgMarkup(child: ReactElement, width: number, height: number): string {
  return renderToStaticMarkup(
    createElement(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: `0 0 ${PITCH_WIDTH} ${PITCH_HEIGHT}`,
        width,
        height,
      },
      child,
    ),
  );
}

async function loadSvg(markup: string): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(
    new Blob([markup], { type: "image/svg+xml;charset=utf-8" }),
  );
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

const even = (n: number) => Math.max(2, Math.round(n / 2) * 2);

/** Renders the sequence offline, frame by frame, and encodes it as H.264. */
export async function exportAnimationVideo({
  frames,
  view,
  format,
  fps = 30,
  width: requestedWidth = 1920,
  endHoldMs = 1000,
  onProgress,
  signal,
}: VideoExportOptions): Promise<Blob> {
  const width = even(requestedWidth);
  const height = even((requestedWidth * PITCH_HEIGHT) / PITCH_WIDTH);
  if (!(await canEncodeVideo("avc", { width, height }))) {
    throw new VideoExportUnsupportedError(
      "This browser cannot encode H.264 video. Try a recent Chrome, Edge or Safari.",
    );
  }

  const timeline = compileTimeline(frames);
  const totalFrames = Math.max(
    1,
    Math.ceil(((timeline.totalMs + endHoldMs) / 1000) * fps),
  );
  const isPlayerVisible = (p: Player) =>
    view.pitchType !== "full" ||
    (p.team !== "A" && p.team !== "B") ||
    !view.hiddenTeams[p.team];

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable.");

  const pitch = await loadSvg(
    svgMarkup(
      createElement(SoccerPitch, {
        grassStyle: view.grassStyle,
        pitchType: view.pitchType,
        matchFormat: view.matchFormat,
        showBuildOutLines: view.showBuildOutLines,
        showGrid: view.showGrid,
        showZones: view.showZones,
      }),
      width,
      height,
    ),
  );

  const output = new Output({
    format: format === "mov" ? new MovOutputFormat() : new Mp4OutputFormat(),
    target: new BufferTarget(),
  });
  const source = new CanvasSource(canvas, {
    codec: "avc",
    quality: QUALITY_HIGH,
  });
  output.addVideoTrack(source, { frameRate: fps });
  await output.start();

  try {
    for (let i = 0; i < totalFrames; i++) {
      if (signal?.aborted)
        throw new DOMException("Export cancelled", "AbortError");
      const { frame } = sampleAt(frames, timeline, (i * 1000) / fps);
      const entities = await loadSvg(
        svgMarkup(
          createElement(StaticBoardEntities, {
            frame,
            isPlayerVisible,
            showPlayerLabels: view.showPlayerLabels,
          }),
          width,
          height,
        ),
      );
      ctx.fillStyle = BACKGROUND;
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(pitch, 0, 0, width, height);
      ctx.drawImage(entities, 0, 0, width, height);
      await source.add(i / fps, 1 / fps);
      onProgress?.((i + 1) / totalFrames);
    }
    source.close();
    await output.finalize();
  } catch (e) {
    await output.cancel();
    throw e;
  }

  const buffer = output.target.buffer;
  if (!buffer) throw new Error("The video could not be created.");
  return new Blob([buffer], { type: output.format.mimeType });
}

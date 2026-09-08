import React from "react";
import type { GrassStyle, PitchType, MatchFormat } from "../../types/tactics";
import { PITCH_WIDTH, PITCH_HEIGHT } from "../../constants/formations";

interface SoccerPitchProps {
  grassStyle?: GrassStyle;
  pitchType?: PitchType;
  matchFormat?: MatchFormat;
  showBuildOutLines?: boolean;
  showGrid?: boolean;
  showZones?: boolean;
}

export const SoccerPitch: React.FC<SoccerPitchProps> = ({
  grassStyle = "stripes",
  pitchType = "full",
  matchFormat = "11v11",
  showBuildOutLines = true,
  showGrid = false,
  showZones = false,
}) => {
  // Pitch outer padding inside standard coordinate system
  const padX = 40;
  const padY = 30;
  const fieldW = PITCH_WIDTH - padX * 2; // 970
  const fieldH = PITCH_HEIGHT - padY * 2; // 620
  const centerX = PITCH_WIDTH / 2;
  const centerY = PITCH_HEIGHT / 2;

  // Real proportion dimensions for Full Pitch (scaled to fieldW x fieldH)
  const penaltyBoxW = fieldW * 0.165; // ~160px (16.5m)
  const penaltyBoxH = fieldH * 0.6; // ~372px (40.3m)
  const goalAreaW = fieldW * 0.055; // ~53px (5.5m)
  const goalAreaH = fieldH * 0.28; // ~173px (18.3m)
  const centerCircleR = fieldH * 0.145; // ~90px (9.15m)
  const penaltySpotDist = fieldW * 0.11; // ~107px (11m)
  const cornerArcR = 18;
  const goalDepth = 24;
  const goalWidth = goalAreaH * 0.45; // ~78px (7.32m)

  // Half Pitch dimensions (Goal on TOP, Halfway Line on BOTTOM)
  const halfTopGoalWidth = fieldW * 0.14; // ~136px (7.32m goal)
  const halfTopPenaltyBoxW = fieldW * 0.58; // ~562px (40.3m penalty box)
  const halfTopPenaltyBoxH = fieldH * 0.32; // ~198px (16.5m penalty box depth)
  const halfTopGoalAreaW = fieldW * 0.27; // ~262px (18.3m 6-yard box)
  const halfTopGoalAreaH = fieldH * 0.11; // ~68px (5.5m 6-yard box depth)
  const halfTopPenaltySpotDist = fieldH * 0.21; // ~130px (11m penalty spot from top goal line)
  const halfTopCenterCircleR = fieldH * 0.22; // ~136px (9.15m center circle radius)
  const halfTopPenaltyArcR = fieldH * 0.16; // ~100px (penalty arc radius)
  const halfTopArcDx = Math.sqrt(
    Math.max(
      0,
      halfTopPenaltyArcR ** 2 -
        (halfTopPenaltyBoxH - halfTopPenaltySpotDist) ** 2,
    ),
  ); // ~75px

  // Build Out Lines positions (equidistant between penalty box and halfway line, or standard ~1/3 mark)
  const leftBuildOutX = padX + fieldW * 0.28;
  const rightBuildOutX = padX + fieldW * 0.72;
  // Half pitch shows only one build out line (0.28 of a full pitch = 0.56 of a half)
  const halfBuildOutY = padY + fieldH * 0.56;

  // Color schemes based on grassStyle
  const getGrassColors = () => {
    switch (grassStyle) {
      case "slate":
        return {
          stripe1: "#1e293b",
          stripe2: "#0f172a",
          line: "#94a3b8",
          border: "#334155",
          net: "#64748b",
        };
      case "blueprint":
        return {
          stripe1: "#1e3a8a",
          stripe2: "#172554",
          line: "#93c5fd",
          border: "#1d4ed8",
          net: "#60a5fa",
        };
      case "plain":
        return {
          stripe1: "#439744",
          stripe2: "#439744",
          line: "#ffffff",
          border: "#368037",
          net: "#e2e8f0",
        };
      case "stripes":
      default:
        // Match the reference image's vibrant grass stripes
        return {
          stripe1: "#5ba346",
          stripe2: "#68b550",
          line: "#ffffff",
          border: "#4d8c3b",
          net: "#f8fafc",
        };
    }
  };

  const colors = getGrassColors();
  const stripeCount = 10;
  const stripeWidth = PITCH_WIDTH / stripeCount;

  return (
    <g className="soccer-pitch-background select-none pointer-events-none">
      <defs>
        {/* Goal net pattern */}
        <pattern
          id="goalNet"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 0 0 L 6 6 M 6 0 L 0 6"
            fill="none"
            stroke={colors.net}
            strokeWidth="0.8"
            opacity="0.6"
          />
        </pattern>
        {/* Grass texture gradient */}
        <linearGradient id="grassHighlight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* Base Pitch Background with Grass Stripes */}
      <rect
        x="0"
        y="0"
        width={PITCH_WIDTH}
        height={PITCH_HEIGHT}
        fill={colors.stripe1}
      />

      {/* Alternating vertical grass stripes */}
      {Array.from({ length: stripeCount }).map((_, i) => {
        if (i % 2 === 1) {
          return (
            <rect
              key={`stripe-${i}`}
              x={i * stripeWidth}
              y="0"
              width={stripeWidth}
              height={PITCH_HEIGHT}
              fill={colors.stripe2}
            />
          );
        }
        return null;
      })}

      {/* Subtle lighting overlay */}
      <rect
        x="0"
        y="0"
        width={PITCH_WIDTH}
        height={PITCH_HEIGHT}
        fill="url(#grassHighlight)"
      />

      {/* Main Pitch Graphics (Lines, Nets, Arcs) - only rendered if pitchType !== 'blank' */}
      {pitchType === "blank" && (
        <>
          {/* Subtle perimeter boundary line for canvas bounds */}
          <rect
            x={padX}
            y={padY}
            width={fieldW}
            height={fieldH}
            fill="none"
            stroke={colors.line}
            strokeWidth="1.5"
            strokeDasharray="6 6"
            opacity="0.35"
          />
        </>
      )}

      {pitchType === "half" && (
        <g className="half-pitch-markings">
          {/* Top Goal Net */}
          <rect
            x={centerX - halfTopGoalWidth / 2}
            y={padY - goalDepth}
            width={halfTopGoalWidth}
            height={goalDepth}
            fill="url(#goalNet)"
            stroke={colors.line}
            strokeWidth="2.5"
            rx="2"
          />

          {/* Half Pitch Boundary (Top Goal Line, Left/Right Touchlines, Bottom Halfway Line) */}
          <rect
            x={padX}
            y={padY}
            width={fieldW}
            height={fieldH}
            fill="none"
            stroke={colors.line}
            strokeWidth="3.5"
          />

          {/* Center Circle Arc (opening upwards from bottom halfway line) */}
          <path
            d={`M ${centerX - halfTopCenterCircleR} ${padY + fieldH} A ${halfTopCenterCircleR} ${halfTopCenterCircleR} 0 0 1 ${centerX + halfTopCenterCircleR} ${padY + fieldH}`}
            fill="none"
            stroke={colors.line}
            strokeWidth="3"
          />
          {/* Center Spot on Bottom Halfway Line */}
          <circle cx={centerX} cy={padY + fieldH} r="5" fill={colors.line} />

          {/* Half Pitch Penalty Box (Top Center) */}
          <rect
            x={centerX - halfTopPenaltyBoxW / 2}
            y={padY}
            width={halfTopPenaltyBoxW}
            height={halfTopPenaltyBoxH}
            fill="none"
            stroke={colors.line}
            strokeWidth="3"
          />

          {/* Half Pitch Goal Box (6-yard box at Top Center) */}
          <rect
            x={centerX - halfTopGoalAreaW / 2}
            y={padY}
            width={halfTopGoalAreaW}
            height={halfTopGoalAreaH}
            fill="none"
            stroke={colors.line}
            strokeWidth="3"
          />

          {/* Penalty Spot */}
          <circle
            cx={centerX}
            cy={padY + halfTopPenaltySpotDist}
            r="4.5"
            fill={colors.line}
          />

          {/* Penalty Arc (D) (Curving downwards outside penalty box) */}
          <path
            d={`M ${centerX - halfTopArcDx} ${padY + halfTopPenaltyBoxH} A ${halfTopPenaltyArcR} ${halfTopPenaltyArcR} 0 0 0 ${centerX + halfTopArcDx} ${padY + halfTopPenaltyBoxH}`}
            fill="none"
            stroke={colors.line}
            strokeWidth="3"
          />

          {/* Corner Arcs (Top-Left and Top-Right Goal Line Corners) */}
          <path
            d={`M ${padX} ${padY + cornerArcR * 1.3} A ${cornerArcR * 1.3} ${cornerArcR * 1.3} 0 0 0 ${padX + cornerArcR * 1.3} ${padY}`}
            fill="none"
            stroke={colors.line}
            strokeWidth="3"
          />
          <path
            d={`M ${padX + fieldW - cornerArcR * 1.3} ${padY} A ${cornerArcR * 1.3} ${cornerArcR * 1.3} 0 0 0 ${padX + fieldW} ${padY + cornerArcR * 1.3}`}
            fill="none"
            stroke={colors.line}
            strokeWidth="3"
          />

          {/* 7v7 Build Out Line (US Soccer Regulation for U9-U10 7v7 youth soccer) */}
          {matchFormat === "7v7" && showBuildOutLines && (
            <g className="build-out-lines">
              <line
                x1={padX}
                y1={halfBuildOutY}
                x2={padX + fieldW}
                y2={halfBuildOutY}
                stroke="#38bdf8"
                strokeWidth="3.5"
                strokeDasharray="10 8"
              />
              {/* Badge / Label outside the left touchline */}
              <g opacity="0.95">
                <rect
                  x={padX - 40}
                  y={halfBuildOutY - 8}
                  width="36"
                  height="16"
                  rx="4"
                  fill="#0f172a"
                  fillOpacity="0.85"
                  stroke="#38bdf8"
                  strokeWidth="1"
                />
                <text
                  x={padX - 22}
                  y={halfBuildOutY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#38bdf8"
                  fontSize="10"
                  fontWeight="bold"
                  letterSpacing="0.5"
                >
                  BOL
                </text>
              </g>
            </g>
          )}
        </g>
      )}

      {pitchType === "full" && (
        <g className="full-pitch-markings">
          {/* Physical Goal Nets Behind Goal Lines */}
          {/* Left Goal Net */}
          <rect
            x={padX - goalDepth}
            y={centerY - goalWidth / 2}
            width={goalDepth}
            height={goalWidth}
            fill="url(#goalNet)"
            stroke={colors.line}
            strokeWidth="2.5"
            rx="2"
          />
          {/* Right Goal Net */}
          <rect
            x={padX + fieldW}
            y={centerY - goalWidth / 2}
            width={goalDepth}
            height={goalWidth}
            fill="url(#goalNet)"
            stroke={colors.line}
            strokeWidth="2.5"
            rx="2"
          />

          {/* Main Pitch Outer Boundary */}
          <rect
            x={padX}
            y={padY}
            width={fieldW}
            height={fieldH}
            fill="none"
            stroke={colors.line}
            strokeWidth="3.5"
          />

          {/* Halfway Line */}
          <line
            x1={centerX}
            y1={padY}
            x2={centerX}
            y2={padY + fieldH}
            stroke={colors.line}
            strokeWidth="3.5"
          />

          {/* Center Circle & Spot */}
          <circle
            cx={centerX}
            cy={centerY}
            r={centerCircleR}
            fill="none"
            stroke={colors.line}
            strokeWidth="3"
          />
          <circle cx={centerX} cy={centerY} r="4.5" fill={colors.line} />

          {/* LEFT SIDE (Team A / Home Box) */}
          {/* Penalty Box */}
          <rect
            x={padX}
            y={centerY - penaltyBoxH / 2}
            width={penaltyBoxW}
            height={penaltyBoxH}
            fill="none"
            stroke={colors.line}
            strokeWidth="3"
          />
          {/* 6-Yard Goal Box */}
          <rect
            x={padX}
            y={centerY - goalAreaH / 2}
            width={goalAreaW}
            height={goalAreaH}
            fill="none"
            stroke={colors.line}
            strokeWidth="3"
          />
          {/* Penalty Spot */}
          <circle
            cx={padX + penaltySpotDist}
            cy={centerY}
            r="4"
            fill={colors.line}
          />
          {/* Penalty Arc (D) */}
          <path
            d={`M ${padX + penaltyBoxW} ${centerY - centerCircleR * 0.72} A ${centerCircleR} ${centerCircleR} 0 0 1 ${padX + penaltyBoxW} ${centerY + centerCircleR * 0.72}`}
            fill="none"
            stroke={colors.line}
            strokeWidth="3"
          />

          {/* RIGHT SIDE (Team B / Away Box) */}
          {/* Penalty Box */}
          <rect
            x={padX + fieldW - penaltyBoxW}
            y={centerY - penaltyBoxH / 2}
            width={penaltyBoxW}
            height={penaltyBoxH}
            fill="none"
            stroke={colors.line}
            strokeWidth="3"
          />
          {/* 6-Yard Goal Box */}
          <rect
            x={padX + fieldW - goalAreaW}
            y={centerY - goalAreaH / 2}
            width={goalAreaW}
            height={goalAreaH}
            fill="none"
            stroke={colors.line}
            strokeWidth="3"
          />
          {/* Penalty Spot */}
          <circle
            cx={padX + fieldW - penaltySpotDist}
            cy={centerY}
            r="4"
            fill={colors.line}
          />
          {/* Penalty Arc (D) */}
          <path
            d={`M ${padX + fieldW - penaltyBoxW} ${centerY - centerCircleR * 0.72} A ${centerCircleR} ${centerCircleR} 0 0 0 ${padX + fieldW - penaltyBoxW} ${centerY + centerCircleR * 0.72}`}
            fill="none"
            stroke={colors.line}
            strokeWidth="3"
          />

          {/* Corner Arcs */}
          {/* Top-Left */}
          <path
            d={`M ${padX} ${padY + cornerArcR} A ${cornerArcR} ${cornerArcR} 0 0 0 ${padX + cornerArcR} ${padY}`}
            fill="none"
            stroke={colors.line}
            strokeWidth="3"
          />
          {/* Bottom-Left */}
          <path
            d={`M ${padX + cornerArcR} ${padY + fieldH} A ${cornerArcR} ${cornerArcR} 0 0 0 ${padX} ${padY + fieldH - cornerArcR}`}
            fill="none"
            stroke={colors.line}
            strokeWidth="3"
          />
          {/* Top-Right */}
          <path
            d={`M ${padX + fieldW - cornerArcR} ${padY} A ${cornerArcR} ${cornerArcR} 0 0 0 ${padX + fieldW} ${padY + cornerArcR}`}
            fill="none"
            stroke={colors.line}
            strokeWidth="3"
          />
          {/* Bottom-Right */}
          <path
            d={`M ${padX + fieldW} ${padY + fieldH - cornerArcR} A ${cornerArcR} ${cornerArcR} 0 0 0 ${padX + fieldW - cornerArcR} ${padY + fieldH}`}
            fill="none"
            stroke={colors.line}
            strokeWidth="3"
          />

          {/* 7v7 Build Out Lines (US Soccer Regulation for U9-U10 7v7 youth soccer) */}
          {matchFormat === "7v7" && showBuildOutLines && (
            <g className="build-out-lines">
              {/* Left Build Out Line */}
              <line
                x1={leftBuildOutX}
                y1={padY}
                x2={leftBuildOutX}
                y2={padY + fieldH}
                stroke="#38bdf8"
                strokeWidth="3.5"
                strokeDasharray="10 8"
              />
              {/* Right Build Out Line */}
              <line
                x1={rightBuildOutX}
                y1={padY}
                x2={rightBuildOutX}
                y2={padY + fieldH}
                stroke="#38bdf8"
                strokeWidth="3.5"
                strokeDasharray="10 8"
              />
              {/* Badges / Labels outside touchlines */}
              <g opacity="0.95">
                {/* Top Left Label */}
                <rect
                  x={leftBuildOutX - 18}
                  y={padY - 22}
                  width="36"
                  height="16"
                  rx="4"
                  fill="#0f172a"
                  fillOpacity="0.85"
                  stroke="#38bdf8"
                  strokeWidth="1"
                />
                <text
                  x={leftBuildOutX}
                  y={padY - 14}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#38bdf8"
                  fontSize="10"
                  fontWeight="bold"
                  letterSpacing="0.5"
                >
                  BOL
                </text>

                {/* Top Right Label */}
                <rect
                  x={rightBuildOutX - 18}
                  y={padY - 22}
                  width="36"
                  height="16"
                  rx="4"
                  fill="#0f172a"
                  fillOpacity="0.85"
                  stroke="#38bdf8"
                  strokeWidth="1"
                />
                <text
                  x={rightBuildOutX}
                  y={padY - 14}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#38bdf8"
                  fontSize="10"
                  fontWeight="bold"
                  letterSpacing="0.5"
                >
                  BOL
                </text>
              </g>
            </g>
          )}
        </g>
      )}

      {/* Optional: Tactical 18 Zones Grid Overlay (PEP Guardiola Half-Spaces) */}
      {showZones && (
        <g
          opacity="0.3"
          stroke="#facc15"
          strokeWidth="1.5"
          strokeDasharray="6 4"
        >
          {pitchType === "half" ? (
            <>
              {/* Vertical 5 Lanes (Wings, Half-Spaces, Center Channel) */}
              <line
                x1={centerX - halfTopPenaltyBoxW / 2}
                y1={padY}
                x2={centerX - halfTopPenaltyBoxW / 2}
                y2={padY + fieldH}
              />
              <line
                x1={centerX - halfTopGoalAreaW / 2}
                y1={padY}
                x2={centerX - halfTopGoalAreaW / 2}
                y2={padY + fieldH}
              />
              <line
                x1={centerX + halfTopGoalAreaW / 2}
                y1={padY}
                x2={centerX + halfTopGoalAreaW / 2}
                y2={padY + fieldH}
              />
              <line
                x1={centerX + halfTopPenaltyBoxW / 2}
                y1={padY}
                x2={centerX + halfTopPenaltyBoxW / 2}
                y2={padY + fieldH}
              />
              {/* Horizontal Depth Zones */}
              <line
                x1={padX}
                y1={padY + halfTopPenaltyBoxH}
                x2={padX + fieldW}
                y2={padY + halfTopPenaltyBoxH}
              />
              <line
                x1={padX}
                y1={padY + fieldH * 0.65}
                x2={padX + fieldW}
                y2={padY + fieldH * 0.65}
              />
            </>
          ) : (
            <>
              {/* Vertical Channels (5 channels: Wings, Half-spaces, Center) */}
              <line
                x1={padX}
                y1={centerY - penaltyBoxH / 2}
                x2={padX + fieldW}
                y2={centerY - penaltyBoxH / 2}
              />
              <line
                x1={padX}
                y1={centerY - goalAreaH / 2}
                x2={padX + fieldW}
                y2={centerY - goalAreaH / 2}
              />
              <line
                x1={padX}
                y1={centerY + goalAreaH / 2}
                x2={padX + fieldW}
                y2={centerY + goalAreaH / 2}
              />
              <line
                x1={padX}
                y1={centerY + penaltyBoxH / 2}
                x2={padX + fieldW}
                y2={centerY + penaltyBoxH / 2}
              />

              {/* Longitudinal Pitch Thirds */}
              <line
                x1={padX + fieldW * 0.333}
                y1={padY}
                x2={padX + fieldW * 0.333}
                y2={padY + fieldH}
              />
              <line
                x1={padX + fieldW * 0.666}
                y1={padY}
                x2={padX + fieldW * 0.666}
                y2={padY + fieldH}
              />
            </>
          )}
        </g>
      )}

      {/* Optional: Fine Grid */}
      {showGrid && (
        <g
          opacity="0.15"
          stroke="#ffffff"
          strokeWidth="1"
          strokeDasharray="3 3"
        >
          {Array.from({ length: 20 }).map((_, i) => (
            <line
              key={`grid-x-${i}`}
              x1={(i * PITCH_WIDTH) / 20}
              y1={0}
              x2={(i * PITCH_WIDTH) / 20}
              y2={PITCH_HEIGHT}
            />
          ))}
          {Array.from({ length: 14 }).map((_, i) => (
            <line
              key={`grid-y-${i}`}
              x1={0}
              y1={(i * PITCH_HEIGHT) / 14}
              x2={PITCH_WIDTH}
              y2={(i * PITCH_HEIGHT) / 14}
            />
          ))}
        </g>
      )}
    </g>
  );
};

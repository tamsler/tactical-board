import React from "react";
import type { Ball } from "../../types/tactics";

interface PitchBallProps {
  ball: Ball;
  isSelected: boolean;
  onPointerDown: (id: string, e: React.PointerEvent) => void;
}

export const PitchBall: React.FC<PitchBallProps> = ({
  ball,
  isSelected,
  onPointerDown,
}) => {
  const size = ball.size || 12;
  // Use scale factor based on standard 100x100 viewBox (radius = 48)
  const scale = size / 48;
  const uniqueId = ball.id.replace(/[^a-zA-Z0-9-_]/g, "_");

  return (
    <g
      className="cursor-grab active:cursor-grabbing select-none"
      transform={`translate(${ball.x}, ${ball.y})`}
      onPointerDown={(e) => {
        e.stopPropagation();
        onPointerDown(ball.id, e);
      }}
    >
      <defs>
        {/* Clip path to 48px radius sphere */}
        <clipPath id={`ballClip-${uniqueId}`}>
          <circle cx="0" cy="0" r="48" />
        </clipPath>

        {/* 3D Sphere Base Shading (Natural directional light from top-left) */}
        <radialGradient
          id={`ballSphere-${uniqueId}`}
          cx="32%"
          cy="28%"
          r="72%"
          fx="25%"
          fy="20%"
        >
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="45%" stopColor="#f8fafc" />
          <stop offset="75%" stopColor="#e2e8f0" />
          <stop offset="90%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#475569" />
        </radialGradient>

        {/* Black Leather Panel Texture Gradient */}
        <radialGradient
          id={`ballDark-${uniqueId}`}
          cx="35%"
          cy="30%"
          r="75%"
          fx="25%"
          fy="20%"
        >
          <stop offset="0%" stopColor="#475569" />
          <stop offset="35%" stopColor="#1e293b" />
          <stop offset="80%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </radialGradient>

        {/* Specular Highlight Sheen */}
        <radialGradient
          id={`ballSpec-${uniqueId}`}
          cx="30%"
          cy="24%"
          r="40%"
          fx="30%"
          fy="24%"
        >
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="40%" stopColor="#ffffff" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>

        {/* Ground Ambient Contact Shadow */}
        <radialGradient
          id={`ballGroundShadow-${uniqueId}`}
          cx="50%"
          cy="50%"
          r="50%"
        >
          <stop offset="0%" stopColor="#000000" stopOpacity="0.65" />
          <stop offset="45%" stopColor="#000000" stopOpacity="0.35" />
          <stop offset="80%" stopColor="#000000" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        {/* Overall 3D Spherical Volume Overlay Gradient */}
        <radialGradient
          id={`ballVolume-${uniqueId}`}
          cx="30%"
          cy="25%"
          r="75%"
          fx="25%"
          fy="20%"
        >
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="80%" stopColor="#000000" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.65" />
        </radialGradient>
      </defs>

      {/* Selection Glow Indicator */}
      {isSelected && (
        <circle
          cx="0"
          cy="0"
          r={size + 5}
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2.5"
          strokeDasharray="4 3"
          className="animate-pulse"
        />
      )}

      {/* Scaled Ball Graphic */}
      <g transform={`scale(${scale})`}>
        {/* Ground Contact Shadow */}
        <ellipse
          cx="2"
          cy="42"
          rx="44"
          ry="15"
          fill={`url(#ballGroundShadow-${uniqueId})`}
        />
        <ellipse
          cx="1"
          cy="40"
          rx="26"
          ry="8"
          fill="#000000"
          fillOpacity="0.5"
        />

        {/* Spherical Clipped Ball */}
        <g clipPath={`url(#ballClip-${uniqueId})`}>
          {/* Base White Spherical Leather Background */}
          <circle cx="0" cy="0" r="48" fill={`url(#ballSphere-${uniqueId})`} />

          {/* ===== 1. Central Black Pentagon ===== */}
          <polygon
            points="0,-18.5 17.6,-5.7 10.9,15.0 -10.9,15.0 -17.6,-5.7"
            fill={`url(#ballDark-${uniqueId})`}
            stroke="#0f172a"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* ===== 2. Five Surrounding Truncated Black Pentagons ===== */}
          {/* Top Patch */}
          <polygon
            points="0,-33.5 13.8,-37.8 19.8,-48 -19.8,-48 -13.8,-37.8"
            fill={`url(#ballDark-${uniqueId})`}
            stroke="#0f172a"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Top-Right Patch */}
          <polygon
            points="31.8,-10.3 34.0,-24.5 45.8,-21.2 47.8,-5.5 38.2,-3.5"
            fill={`url(#ballDark-${uniqueId})`}
            stroke="#0f172a"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Bottom-Right Patch */}
          <polygon
            points="19.7,27.1 29.5,24.0 40.2,33.0 29.8,43.2 12.0,39.0"
            fill={`url(#ballDark-${uniqueId})`}
            stroke="#0f172a"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Bottom-Left Patch */}
          <polygon
            points="-19.7,27.1 -12.0,39.0 -29.8,43.2 -40.2,33.0 -29.5,24.0"
            fill={`url(#ballDark-${uniqueId})`}
            stroke="#0f172a"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Top-Left Patch */}
          <polygon
            points="-31.8,-10.3 -38.2,-3.5 -47.8,-5.5 -45.8,-21.2 -34.0,-24.5"
            fill={`url(#ballDark-${uniqueId})`}
            stroke="#0f172a"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* ===== 3. Connecting Seam Lines (Hexagon Borders) ===== */}
          <g
            stroke="#334155"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Spokes from center pentagon to 5 outer patches */}
            <line x1="0" y1="-18.5" x2="0" y2="-33.5" />
            <line x1="17.6" y1="-5.7" x2="31.8" y2="-10.3" />
            <line x1="10.9" y1="15.0" x2="19.7" y2="27.1" />
            <line x1="-10.9" y1="15.0" x2="-19.7" y2="27.1" />
            <line x1="-17.6" y1="-5.7" x2="-31.8" y2="-10.3" />

            {/* Circumferential seams between outer patches (white hexagon dividers) */}
            <line x1="13.8" y1="-37.8" x2="34.0" y2="-24.5" />
            <line x1="38.2" y1="-3.5" x2="29.5" y2="24.0" />
            <line x1="12.0" y1="39.0" x2="-12.0" y2="39.0" />
            <line x1="-29.5" y1="24.0" x2="-38.2" y2="-3.5" />
            <line x1="-34.0" y1="-24.5" x2="-13.8" y2="-37.8" />
          </g>

          {/* Subtle Seam Groove Highlight (Leather Embossing) */}
          <g
            stroke="#ffffff"
            strokeWidth="0.6"
            strokeOpacity="0.45"
            strokeLinecap="round"
          >
            <line x1="0.5" y1="-18.0" x2="0.5" y2="-33.0" />
            <line x1="18.0" y1="-5.0" x2="32.0" y2="-9.5" />
            <line x1="11.2" y1="15.5" x2="20.0" y2="27.5" />
            <line x1="-10.5" y1="15.5" x2="-19.2" y2="27.5" />
            <line x1="-17.2" y1="-5.0" x2="-31.2" y2="-9.5" />
          </g>

          {/* ===== 4. 3D Volume Shadow & Ambient Occlusion ===== */}
          <circle cx="0" cy="0" r="48" fill={`url(#ballVolume-${uniqueId})`} />

          {/* ===== 5. Specular Gloss Reflection on Top-Left ===== */}
          <circle cx="0" cy="0" r="48" fill={`url(#ballSpec-${uniqueId})`} />

          {/* Pinpoint Specular Glint */}
          <ellipse
            cx="-14"
            cy="-16"
            rx="6"
            ry="3.5"
            transform="rotate(-25 -14 -16)"
            fill="#ffffff"
            fillOpacity="0.9"
          />
        </g>

        {/* Outer Spherical Edge Rim Line */}
        <circle
          cx="0"
          cy="0"
          r="48"
          fill="none"
          stroke="#1e293b"
          strokeWidth="1.2"
          strokeOpacity="0.9"
        />
      </g>
    </g>
  );
};

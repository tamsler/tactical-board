import React from "react";
import type {
  DrawingLine,
  TacticalShape,
  TextAnnotation,
} from "../../types/tactics";
import {
  angle,
  generateCurvePath,
  generateFreehandPath,
  generateWavyPath,
  getArrowHeadPath,
  getTBarPath,
} from "../../utils/mathUtils";
import { parseStyledTextLines } from "../../utils/textUtils";

interface PitchDrawingsProps {
  lines: DrawingLine[];
  shapes: TacticalShape[];
  texts: TextAnnotation[];
  selectedId: string | null;
  onLinePointerDown: (id: string, e: React.PointerEvent) => void;
  onLineHandlePointerDown?: (
    id: string,
    handle: "start" | "end" | "control",
    e: React.PointerEvent,
  ) => void;
  onShapePointerDown: (id: string, e: React.PointerEvent) => void;
  onShapeResizePointerDown?: (id: string, e: React.PointerEvent) => void;
  onTextPointerDown: (id: string, e: React.PointerEvent) => void;
}

export const PitchDrawings: React.FC<PitchDrawingsProps> = ({
  lines,
  shapes,
  texts,
  selectedId,
  onLinePointerDown,
  onLineHandlePointerDown,
  onShapePointerDown,
  onShapeResizePointerDown,
  onTextPointerDown,
}) => {
  // Render an individual tactical drawing line
  const renderLine = (line: DrawingLine) => {
    if (line.points.length < 2) return null;
    const isSelected = selectedId === line.id;
    const start = line.points[0];
    const end = line.points[line.points.length - 1];

    let pathD = "";
    let endAng = 0;
    let startAng = 0;

    switch (line.type) {
      case "dribble": {
        const wavy = generateWavyPath(start, end);
        pathD = wavy.path;
        endAng = wavy.endAngle;
        startAng = endAng + Math.PI;
        break;
      }
      case "curve": {
        const ctrl = line.controlPoint || {
          x: (start.x + end.x) / 2 - (end.y - start.y) * 0.25,
          y: (start.y + end.y) / 2 + (end.x - start.x) * 0.25,
        };
        const curve = generateCurvePath(start, ctrl, end);
        pathD = curve.path;
        endAng = curve.endAngle;
        startAng = Math.atan2(start.y - ctrl.y, start.x - ctrl.x);
        break;
      }
      case "freehand": {
        pathD = generateFreehandPath(line.points);
        if (line.points.length >= 2) {
          const pPrev = line.points[line.points.length - 2];
          const pLast = line.points[line.points.length - 1];
          endAng = angle(pPrev, pLast);
        }
        break;
      }
      case "pass":
      case "block":
      case "straight":
      default: {
        pathD = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
        endAng = angle(start, end);
        startAng = endAng + Math.PI;
        break;
      }
    }

    const strokeDash =
      line.style === "dashed" || line.type === "pass"
        ? "7 5"
        : line.style === "dotted"
          ? "3 4"
          : undefined;

    return (
      <g
        key={line.id}
        className="cursor-move select-none"
        onPointerDown={(e) => {
          e.stopPropagation();
          onLinePointerDown(line.id, e);
        }}
      >
        {/* Invisible thick hit-box for easy dragging/selection */}
        <path
          d={pathD}
          fill="none"
          stroke="transparent"
          strokeWidth={Math.max(22, line.width + 16)}
          strokeLinecap="round"
        />

        {/* Selected highlight line */}
        {isSelected && (
          <path
            d={pathD}
            fill="none"
            stroke="#38bdf8"
            strokeWidth={line.width + 6}
            strokeOpacity="0.45"
            strokeLinecap="round"
          />
        )}

        {/* Actual Drawn Line */}
        <path
          d={pathD}
          fill="none"
          stroke={line.color}
          strokeWidth={line.width}
          strokeDasharray={strokeDash}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Arrowhead at END */}
        {(line.arrowEnd === "arrow" ||
          line.type === "straight" ||
          line.type === "pass" ||
          line.type === "dribble" ||
          line.type === "curve") && (
          <path
            d={getArrowHeadPath(end, endAng, Math.max(13, line.width * 3.6))}
            fill={line.color}
            stroke={line.color}
            strokeWidth="0.75"
            strokeLinejoin="round"
          />
        )}

        {/* T-Bar at END (for screen/block) */}
        {(line.arrowEnd === "t-bar" || line.type === "block") && (
          <path
            d={getTBarPath(end, endAng, 22)}
            fill="none"
            stroke={line.color}
            strokeWidth={Math.max(3, line.width + 1)}
            strokeLinecap="round"
          />
        )}

        {/* Arrowhead at START if double-arrow */}
        {line.arrowStart === "arrow" && (
          <path
            d={getArrowHeadPath(
              start,
              startAng,
              Math.max(13, line.width * 3.6),
            )}
            fill={line.color}
            stroke={line.color}
            strokeWidth="0.75"
            strokeLinejoin="round"
          />
        )}

        {/* Interactive Endpoint / Control Point Handles when Selected */}
        {isSelected && (
          <g className="pointer-events-auto">
            {/* Start handle */}
            <circle
              cx={start.x}
              cy={start.y}
              r="7"
              fill="#38bdf8"
              stroke="#ffffff"
              strokeWidth="2"
              className="cursor-crosshair"
              onPointerDown={(e) => {
                e.stopPropagation();
                onLineHandlePointerDown?.(line.id, "start", e);
              }}
            />

            {/* End handle */}
            <circle
              cx={end.x}
              cy={end.y}
              r="7"
              fill="#38bdf8"
              stroke="#ffffff"
              strokeWidth="2"
              className="cursor-crosshair"
              onPointerDown={(e) => {
                e.stopPropagation();
                onLineHandlePointerDown?.(line.id, "end", e);
              }}
            />

            {/* Curve control handle */}
            {line.type === "curve" && line.controlPoint && (
              <>
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={line.controlPoint.x}
                  y2={line.controlPoint.y}
                  stroke="#38bdf8"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <line
                  x1={end.x}
                  y1={end.y}
                  x2={line.controlPoint.x}
                  y2={line.controlPoint.y}
                  stroke="#38bdf8"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <circle
                  cx={line.controlPoint.x}
                  cy={line.controlPoint.y}
                  r="7"
                  fill="#f59e0b"
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="cursor-crosshair"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onLineHandlePointerDown?.(line.id, "control", e);
                  }}
                />
              </>
            )}
          </g>
        )}

        {/* Line label text if any */}
        {line.label && (
          <text
            x={(start.x + end.x) / 2}
            y={(start.y + end.y) / 2 - 8}
            textAnchor="middle"
            fill="#ffffff"
            fontSize="12"
            fontWeight="bold"
            className="filter drop-shadow"
          >
            {line.label}
          </text>
        )}
      </g>
    );
  };

  // Render Tactical Zone / Shape
  const renderShape = (shape: TacticalShape) => {
    const isSelected = selectedId === shape.id;
    const posX = shape.width < 0 ? shape.x + shape.width : shape.x;
    const posY = shape.height < 0 ? shape.y + shape.height : shape.y;
    const absW = Math.abs(shape.width);
    const absH = Math.abs(shape.height);
    const brX = posX + absW;
    const brY = posY + absH;

    return (
      <g
        key={shape.id}
        className="cursor-move select-none"
        onPointerDown={(e) => {
          e.stopPropagation();
          onShapePointerDown(shape.id, e);
        }}
      >
        {shape.type === "circle" ? (
          <ellipse
            cx={posX + absW / 2}
            cy={posY + absH / 2}
            rx={absW / 2}
            ry={absH / 2}
            fill={shape.color}
            fillOpacity={shape.fillOpacity ?? 0.25}
            stroke={isSelected ? "#38bdf8" : shape.strokeColor}
            strokeWidth={isSelected ? 3 : shape.strokeWidth}
            strokeDasharray={isSelected ? "5 4" : "5 4"}
          />
        ) : (
          <rect
            x={posX}
            y={posY}
            width={absW}
            height={absH}
            rx="6"
            fill={shape.color}
            fillOpacity={shape.fillOpacity ?? 0.25}
            stroke={isSelected ? "#38bdf8" : shape.strokeColor}
            strokeWidth={isSelected ? 3 : shape.strokeWidth}
            strokeDasharray={isSelected ? "5 4" : "5 4"}
          />
        )}

        {/* Resize Handle when Selected */}
        {isSelected && (
          <g className="pointer-events-auto">
            <rect
              x={brX - 6}
              y={brY - 6}
              width="12"
              height="12"
              rx="2"
              fill="#38bdf8"
              stroke="#ffffff"
              strokeWidth="2"
              className="cursor-nwse-resize"
              onPointerDown={(e) => {
                e.stopPropagation();
                onShapeResizePointerDown?.(shape.id, e);
              }}
            />
          </g>
        )}

        {shape.label && (
          <text
            x={posX + absW / 2}
            y={posY + absH / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#ffffff"
            fontSize="13"
            fontWeight="bold"
            className="pointer-events-none drop-shadow"
          >
            {shape.label}
          </text>
        )}
      </g>
    );
  };

  // Render Text Annotation
  const renderText = (textItem: TextAnnotation) => {
    const isSelected = selectedId === textItem.id;
    const rawText = textItem.text || "";
    const lines = rawText.split(/\r?\n/);
    const fontSize = textItem.fontSize || 14;
    const lineHeight = Math.round(fontSize * 1.38);

    const parsedLines = parseStyledTextLines(
      rawText,
      textItem.isBold,
      textItem.isItalic,
    );

    // Calculate maximum width among all lines based on visible characters
    const maxLineLength = Math.max(
      ...parsedLines.map((spans) =>
        spans.reduce((sum, span) => sum + span.text.length, 0),
      ),
      1,
    );
    const charWidth = fontSize * 0.58;
    const padX = 12;
    const padTop = 14; // Added generous spacing above the first line of text
    const padBottom = 10;
    const boxWidth = Math.max(
      50,
      Math.round(maxLineLength * charWidth + padX * 2),
    );
    const boxHeight = Math.max(
      fontSize + padTop + padBottom,
      (lines.length - 1) * lineHeight + fontSize + padTop + padBottom,
    );

    const align = textItem.align || "left";
    const boxX = textItem.x - padX;
    let textX = textItem.x;
    let textAnchor: "start" | "middle" | "end" = "start";

    if (align === "center") {
      textX = boxX + boxWidth / 2;
      textAnchor = "middle";
    } else if (align === "right") {
      textX = boxX + boxWidth - padX;
      textAnchor = "end";
    }

    const boxY = textItem.y - fontSize - padTop + 2;
    const hasBg = textItem.bgColor && textItem.bgColor !== "transparent";

    return (
      <g
        key={textItem.id}
        className="cursor-move select-none"
        onPointerDown={(e) => {
          e.stopPropagation();
          onTextPointerDown(textItem.id, e);
        }}
      >
        {/* Background card / pill */}
        {hasBg && (
          <rect
            x={boxX}
            y={boxY}
            width={boxWidth}
            height={boxHeight}
            rx="6"
            fill={textItem.bgColor}
            fillOpacity={textItem.bgOpacity ?? 0.88}
            stroke={isSelected ? "#38bdf8" : textItem.borderColor || "#334155"}
            strokeWidth={
              isSelected
                ? 2
                : textItem.borderStyle && textItem.borderStyle !== "none"
                  ? 1.5
                  : 1
            }
            strokeDasharray={
              textItem.borderStyle === "dashed" ? "4 3" : undefined
            }
          />
        )}

        {/* Selected bounding outline if no background */}
        {!hasBg && isSelected && (
          <rect
            x={boxX}
            y={boxY}
            width={boxWidth}
            height={boxHeight}
            rx="6"
            fill="transparent"
            stroke="#38bdf8"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
        )}

        {/* Multi-line Text */}
        <text
          x={textX}
          y={textItem.y}
          textAnchor={textAnchor}
          fill={textItem.color || "#ffffff"}
          fontSize={fontSize}
          fontFamily="system-ui, -apple-system, sans-serif"
          className="pointer-events-none filter drop-shadow select-none"
        >
          {parsedLines.map((spans, idx) => {
            const isEmptyLine = spans.every((s) => s.text.length === 0);
            return (
              <tspan key={idx} x={textX} dy={idx === 0 ? 0 : lineHeight}>
                {isEmptyLine
                  ? "\u00A0"
                  : spans.map((span, sIdx) => (
                      <tspan
                        key={sIdx}
                        fontWeight={
                          span.bold ? "bold" : textItem.isBold ? "bold" : "500"
                        }
                        fontStyle={
                          span.italic
                            ? "italic"
                            : textItem.isItalic
                              ? "italic"
                              : "normal"
                        }
                      >
                        {span.text}
                      </tspan>
                    ))}
              </tspan>
            );
          })}
        </text>

        {/* Selection corner badge/handle */}
        {isSelected && (
          <circle
            cx={boxX + boxWidth}
            cy={boxY + boxHeight}
            r="3.5"
            fill="#38bdf8"
            stroke="#ffffff"
            strokeWidth="1"
            className="pointer-events-none"
          />
        )}
      </g>
    );
  };

  return (
    <g className="tactical-drawings-layer">
      {/* 1. Tactical Zones / Shapes */}
      {shapes.map(renderShape)}

      {/* 2. Tactical Lines and Arrows */}
      {lines.map(renderLine)}

      {/* 3. Text Annotations */}
      {texts.map(renderText)}
    </g>
  );
};

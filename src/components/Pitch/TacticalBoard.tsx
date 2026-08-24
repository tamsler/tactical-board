import React, { useState, useEffect, useCallback, useRef } from "react";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import type {
  Player,
  Ball,
  Equipment,
  DrawingLine,
  TacticalShape,
  TextAnnotation,
  Point,
} from "../../types/tactics";
import { SoccerPitch } from "./SoccerPitch";
import { PitchPlayer } from "./PitchPlayer";
import { PitchBall } from "./PitchBall";
import { PitchEquipment } from "./PitchEquipment";
import { PitchDrawings } from "./PitchDrawings";
import {
  PITCH_WIDTH,
  PITCH_HEIGHT,
  TEAM_COLORS,
} from "../../constants/formations";
import type { useTacticsState } from "../../hooks/useTacticsState";
import {
  generateCurvePath,
  generateFreehandPath,
  generateWavyPath,
  getArrowHeadPath,
  getTBarPath,
  angle,
} from "../../utils/mathUtils";

interface TacticalBoardProps {
  tactics: ReturnType<typeof useTacticsState>;
  boardRef: React.RefObject<SVGSVGElement | null>;
}

export const TacticalBoard: React.FC<TacticalBoardProps> = ({
  tactics,
  boardRef,
}) => {
  const {
    state,
    pushState,
    activeTool,
    setActiveTool,
    selectedId,
    setSelectedId,
    selectedType,
    setSelectedType,
    grassStyle,
    pitchType,
    matchFormat,
    showBuildOutLines,
    showGrid,
    showZones,
    showPlayerLabels,
    drawingColor,
    drawingWidth,
  } = tactics;

  // Active dragging / drawing state
  type DragMode =
    | "move"
    | "line-start"
    | "line-end"
    | "line-control"
    | "shape-resize";

  const [isDragging, setIsDragging] = useState(false);
  const [draggedEntityId, setDraggedEntityId] = useState<string | null>(null);
  const [dragMode, setDragMode] = useState<DragMode>("move");
  const [dragStartMousePos, setDragStartMousePos] = useState<Point>({
    x: 0,
    y: 0,
  });

  // Initial snapshots of the entity being dragged
  const [draggedInitialPos, setDraggedInitialPos] = useState<Point>({
    x: 0,
    y: 0,
  });
  const [draggedInitialLine, setDraggedInitialLine] =
    useState<DrawingLine | null>(null);
  const [draggedInitialShape, setDraggedInitialShape] =
    useState<TacticalShape | null>(null);
  const dragHasMovedRef = useRef(false);

  // Zoom & Pan state (enhanced for mobile pinch-to-zoom & detailed pitch viewing)
  const [zoom, setZoom] = useState(1.0);
  const [panOffset, setPanOffset] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStartPoint, setPanStartPoint] = useState<Point>({ x: 0, y: 0 });
  const [initialPanOffset, setInitialPanOffset] = useState<Point>({
    x: 0,
    y: 0,
  });

  // Multi-touch tracking for pinch-to-zoom & two-finger panning
  const activePointersRef = useRef<
    Map<number, { clientX: number; clientY: number }>
  >(new Map());
  const isPinchingRef = useRef(false);
  const pinchStartDistRef = useRef(0);
  const pinchStartZoomRef = useRef(1);
  const pinchStartPanRef = useRef<Point>({ x: 0, y: 0 });
  const pinchStartCenterRef = useRef<Point>({ x: 0, y: 0 });

  const clampPan = useCallback((pan: Point, currentZoom: number): Point => {
    if (currentZoom <= 1.02) return { x: 0, y: 0 };
    const maxPanX = (PITCH_WIDTH / 2) * ((currentZoom - 1) / currentZoom);
    const maxPanY = (PITCH_HEIGHT / 2) * ((currentZoom - 1) / currentZoom);
    return {
      x: Math.max(-maxPanX, Math.min(maxPanX, pan.x)),
      y: Math.max(-maxPanY, Math.min(maxPanY, pan.y)),
    };
  }, []);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(3.0, Number((prev + 0.25).toFixed(2))));
  };

  const handleZoomOut = () => {
    setZoom((prev) => {
      const next = Math.max(1.0, Number((prev - 0.25).toFixed(2)));
      if (next <= 1.02) {
        setPanOffset({ x: 0, y: 0 });
      } else {
        setPanOffset((p) => clampPan(p, next));
      }
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoom(1.0);
    setPanOffset({ x: 0, y: 0 });
    setIsPanning(false);
  };

  // Drawing in progress state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStartPoint, setDrawStartPoint] = useState<Point | null>(null);
  const [currentMousePoint, setCurrentMousePoint] = useState<Point | null>(
    null,
  );
  const [freehandPoints, setFreehandPoints] = useState<Point[]>([]);

  // Coordinate conversion from screen clientX/clientY to SVG pitch coordinates (1050x680)
  const getPitchCoordinates = useCallback(
    (e: React.MouseEvent | React.TouchEvent | React.PointerEvent): Point => {
      if (!boardRef.current) return { x: 0, y: 0 };
      const svg = boardRef.current;
      const pt = svg.createSVGPoint();

      if ("touches" in e && e.touches.length > 0) {
        pt.x = e.touches[0].clientX;
        pt.y = e.touches[0].clientY;
      } else if ("clientX" in e) {
        pt.x = e.clientX;
        pt.y = e.clientY;
      }

      const ctm = svg.getScreenCTM();
      if (ctm) {
        const transformed = pt.matrixTransform(ctm.inverse());
        return {
          x: Math.max(0, Math.min(PITCH_WIDTH, transformed.x)),
          y: Math.max(0, Math.min(PITCH_HEIGHT, transformed.y)),
        };
      }

      // Fallback bounding rect calculation
      const rect = svg.getBoundingClientRect();
      const scaleX = PITCH_WIDTH / rect.width;
      const scaleY = PITCH_HEIGHT / rect.height;
      const clientX =
        "touches" in e && e.touches.length > 0
          ? e.touches[0].clientX
          : (e as React.MouseEvent).clientX;
      const clientY =
        "touches" in e && e.touches.length > 0
          ? e.touches[0].clientY
          : (e as React.MouseEvent).clientY;

      return {
        x: Math.max(0, Math.min(PITCH_WIDTH, (clientX - rect.left) * scaleX)),
        y: Math.max(0, Math.min(PITCH_HEIGHT, (clientY - rect.top) * scaleY)),
      };
    },
    [boardRef],
  );

  // Handle entity selection and start dragging
  const handleEntityPointerDown = useCallback(
    (
      id: string,
      type: "player" | "ball" | "equipment" | "line" | "shape" | "text",
      e: React.PointerEvent,
    ) => {
      e.stopPropagation();

      // Eraser Tool
      if (activeTool === "eraser") {
        pushState((prev) => ({
          ...prev,
          players: prev.players.filter((p) => p.id !== id),
          balls: prev.balls.filter((b) => b.id !== id),
          equipments: prev.equipments.filter((eq) => eq.id !== id),
          lines: prev.lines.filter((l) => l.id !== id),
          shapes: prev.shapes.filter((s) => s.id !== id),
          texts: prev.texts.filter((t) => t.id !== id),
        }));
        if (selectedId === id) {
          setSelectedId(null);
          setSelectedType(null);
        }
        return;
      }

      // Snapshot to history so moving the entity can be cleanly undone in 1 step
      tactics.snapshotToHistory();

      setSelectedId(id);
      setSelectedType(type);

      const pt = getPitchCoordinates(e);
      setDragStartMousePos(pt);
      setDragMode("move");

      if (type === "line") {
        const ln = state.lines.find((l) => l.id === id);
        if (ln) {
          setDraggedInitialLine({
            ...ln,
            points: ln.points.map((p) => ({ ...p })),
            controlPoint: ln.controlPoint ? { ...ln.controlPoint } : undefined,
          });
        }
      } else if (type === "shape") {
        const sh = state.shapes.find((s) => s.id === id);
        if (sh) {
          setDraggedInitialShape({ ...sh });
        }
      } else if (type === "player") {
        const p = state.players.find((pl) => pl.id === id);
        if (p) setDraggedInitialPos({ x: p.x, y: p.y });
      } else if (type === "ball") {
        const b = state.balls.find((bl) => bl.id === id);
        if (b) setDraggedInitialPos({ x: b.x, y: b.y });
      } else if (type === "equipment") {
        const eq = state.equipments.find((item) => item.id === id);
        if (eq) setDraggedInitialPos({ x: eq.x, y: eq.y });
      } else if (type === "text") {
        const tx = state.texts.find((item) => item.id === id);
        if (tx) setDraggedInitialPos({ x: tx.x, y: tx.y });
      }

      setIsDragging(true);
      setDraggedEntityId(id);
      (e.target as Element).setPointerCapture(e.pointerId);
    },
    [
      activeTool,
      pushState,
      tactics,
      selectedId,
      setSelectedId,
      setSelectedType,
      getPitchCoordinates,
      state,
    ],
  );

  // Line endpoint / control handle dragging
  const handleLineHandlePointerDown = useCallback(
    (
      id: string,
      handle: "start" | "end" | "control",
      e: React.PointerEvent,
    ) => {
      e.stopPropagation();
      tactics.snapshotToHistory();
      setSelectedId(id);
      setSelectedType("line");

      const pt = getPitchCoordinates(e);
      setDragStartMousePos(pt);
      setDragMode(
        handle === "start"
          ? "line-start"
          : handle === "end"
            ? "line-end"
            : "line-control",
      );

      const ln = state.lines.find((l) => l.id === id);
      if (ln) {
        setDraggedInitialLine({
          ...ln,
          points: ln.points.map((p) => ({ ...p })),
          controlPoint: ln.controlPoint ? { ...ln.controlPoint } : undefined,
        });
      }

      setIsDragging(true);
      setDraggedEntityId(id);
      (e.target as Element).setPointerCapture(e.pointerId);
    },
    [tactics, setSelectedId, setSelectedType, getPitchCoordinates, state],
  );

  // Shape resize handle dragging
  const handleShapeResizePointerDown = useCallback(
    (id: string, e: React.PointerEvent) => {
      e.stopPropagation();
      tactics.snapshotToHistory();
      setSelectedId(id);
      setSelectedType("shape");

      const pt = getPitchCoordinates(e);
      setDragStartMousePos(pt);
      setDragMode("shape-resize");

      const sh = state.shapes.find((s) => s.id === id);
      if (sh) {
        setDraggedInitialShape({ ...sh });
      }

      setIsDragging(true);
      setDraggedEntityId(id);
      (e.target as Element).setPointerCapture(e.pointerId);
    },
    [tactics, setSelectedId, setSelectedType, getPitchCoordinates, state],
  );

  // Background pointer down (drawing start, quick entity creation, or pan/pinch)
  const handleBoardPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    activePointersRef.current.set(e.pointerId, {
      clientX: e.clientX,
      clientY: e.clientY,
    });

    // Multi-touch pinch gesture start
    if (activePointersRef.current.size >= 2) {
      isPinchingRef.current = true;
      setIsDrawing(false);
      setIsDragging(false);
      setIsPanning(false);
      setDrawStartPoint(null);
      setDraggedEntityId(null);

      const [p1, p2] = Array.from(activePointersRef.current.values());
      pinchStartDistRef.current = Math.hypot(
        p2.clientX - p1.clientX,
        p2.clientY - p1.clientY,
      );
      pinchStartZoomRef.current = zoom;
      pinchStartPanRef.current = { ...panOffset };
      pinchStartCenterRef.current = {
        x: (p1.clientX + p2.clientX) / 2,
        y: (p1.clientY + p2.clientY) / 2,
      };
      return;
    }

    if (e.button !== 0) return; // Only primary button
    const pt = getPitchCoordinates(e);

    // Quick creation tools
    if (activeTool === "add-player-a") {
      const nextNum = (
        state.players.filter((p) => p.team === "A").length + 1
      ).toString();
      const newPlayer: Player = {
        id: `player-a-${Date.now()}`,
        team: "A",
        number: nextNum,
        name: "",
        x: pt.x,
        y: pt.y,
        color: TEAM_COLORS.teamA.primary,
        textColor: "#ffffff",
        radius: 17,
        facingAngle: 0,
      };
      pushState((prev) => ({ ...prev, players: [...prev.players, newPlayer] }));
      setSelectedId(newPlayer.id);
      setSelectedType("player");
      return;
    }

    if (activeTool === "add-player-b") {
      const nextNum = (
        state.players.filter((p) => p.team === "B").length + 1
      ).toString();
      const newPlayer: Player = {
        id: `player-b-${Date.now()}`,
        team: "B",
        number: nextNum,
        name: "",
        x: pt.x,
        y: pt.y,
        color: TEAM_COLORS.teamB.primary,
        textColor: "#ffffff",
        radius: 17,
        facingAngle: 180,
      };
      pushState((prev) => ({ ...prev, players: [...prev.players, newPlayer] }));
      setSelectedId(newPlayer.id);
      setSelectedType("player");
      return;
    }

    if (activeTool === "add-player-gk-a") {
      const newPlayer: Player = {
        id: `player-gk-a-${Date.now()}`,
        team: "A",
        number: "1",
        name: "GK",
        x: pt.x,
        y: pt.y,
        color: TEAM_COLORS.teamA.gk,
        textColor: "#ffffff",
        isGoalkeeper: true,
        radius: 18,
        facingAngle: 0,
      };
      pushState((prev) => ({ ...prev, players: [...prev.players, newPlayer] }));
      setSelectedId(newPlayer.id);
      setSelectedType("player");
      return;
    }

    if (activeTool === "add-player-gk-b") {
      const newPlayer: Player = {
        id: `player-gk-b-${Date.now()}`,
        team: "B",
        number: "1",
        name: "GK",
        x: pt.x,
        y: pt.y,
        color: TEAM_COLORS.teamB.gk,
        textColor: "#ffffff",
        isGoalkeeper: true,
        radius: 18,
        facingAngle: 180,
      };
      pushState((prev) => ({ ...prev, players: [...prev.players, newPlayer] }));
      setSelectedId(newPlayer.id);
      setSelectedType("player");
      return;
    }

    if (activeTool === "add-player-c") {
      const newPlayer: Player = {
        id: `player-neutral-${Date.now()}`,
        team: "neutral",
        number: "N",
        name: "",
        x: pt.x,
        y: pt.y,
        color: TEAM_COLORS.neutral.primary,
        textColor: "#ffffff",
        radius: 17,
      };
      pushState((prev) => ({ ...prev, players: [...prev.players, newPlayer] }));
      setSelectedId(newPlayer.id);
      setSelectedType("player");
      return;
    }

    if (activeTool === "add-ball") {
      const newBall: Ball = {
        id: `ball-${Date.now()}`,
        x: pt.x,
        y: pt.y,
        size: 11,
      };
      pushState((prev) => ({ ...prev, balls: [...prev.balls, newBall] }));
      setSelectedId(newBall.id);
      setSelectedType("ball");
      return;
    }

    if (
      activeTool === "add-cone" ||
      activeTool === "add-mannequin" ||
      activeTool === "add-mini-goal"
    ) {
      const type =
        activeTool === "add-cone"
          ? "cone-orange"
          : activeTool === "add-mannequin"
            ? "mannequin"
            : "mini-goal";

      const newEq: Equipment = {
        id: `eq-${Date.now()}`,
        type,
        x: pt.x,
        y: pt.y,
      };
      pushState((prev) => ({
        ...prev,
        equipments: [...prev.equipments, newEq],
      }));
      setSelectedId(newEq.id);
      setSelectedType("equipment");
      return;
    }

    if (activeTool === "text") {
      const newText: TextAnnotation = {
        id: `text-${Date.now()}`,
        x: pt.x,
        y: pt.y,
        text: "Tactics Note",
        fontSize: 14,
        color: "#ffffff",
        bgColor: "#0f172a",
        isBold: true,
      };
      pushState((prev) => ({ ...prev, texts: [...prev.texts, newText] }));
      setSelectedId(newText.id);
      setSelectedType("text");
      setActiveTool("select");
      return;
    }

    // Drawing tools
    if (
      activeTool === "line-run" ||
      activeTool === "line-pass" ||
      activeTool === "line-dribble" ||
      activeTool === "line-curve" ||
      activeTool === "line-block" ||
      activeTool === "draw-freehand" ||
      activeTool === "shape-rect" ||
      activeTool === "shape-circle"
    ) {
      setIsDrawing(true);
      setDrawStartPoint(pt);
      setCurrentMousePoint(pt);
      if (activeTool === "draw-freehand") {
        setFreehandPoints([pt]);
      }
      return;
    }

    // Clicked empty pitch in select mode: deselect
    if (activeTool === "select") {
      setSelectedId(null);
      setSelectedType(null);
      if (zoom > 1.02) {
        setIsPanning(true);
        setPanStartPoint({ x: e.clientX, y: e.clientY });
        setInitialPanOffset({ ...panOffset });
      }
    }
  };

  // Pointer move (entity drag, drawing preview, multi-touch pinch-zoom, or pan)
  const handleBoardPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    activePointersRef.current.set(e.pointerId, {
      clientX: e.clientX,
      clientY: e.clientY,
    });

    // Multi-touch pinch-to-zoom & two-finger pan
    if (isPinchingRef.current && activePointersRef.current.size >= 2) {
      const [p1, p2] = Array.from(activePointersRef.current.values());
      const currentDist = Math.hypot(
        p2.clientX - p1.clientX,
        p2.clientY - p1.clientY,
      );
      const scaleFactor = currentDist / Math.max(10, pinchStartDistRef.current);
      const newZoom = Math.min(
        3.0,
        Math.max(
          1.0,
          Math.round(pinchStartZoomRef.current * scaleFactor * 100) / 100,
        ),
      );

      const currentCenter = {
        x: (p1.clientX + p2.clientX) / 2,
        y: (p1.clientY + p2.clientY) / 2,
      };
      const deltaX =
        (currentCenter.x - pinchStartCenterRef.current.x) / newZoom;
      const deltaY =
        (currentCenter.y - pinchStartCenterRef.current.y) / newZoom;

      setZoom(newZoom);
      setPanOffset(
        clampPan(
          {
            x: pinchStartPanRef.current.x + deltaX,
            y: pinchStartPanRef.current.y + deltaY,
          },
          newZoom,
        ),
      );
      return;
    }

    // Single pointer pan when zoomed in
    if (isPanning) {
      const dx = (e.clientX - panStartPoint.x) / zoom;
      const dy = (e.clientY - panStartPoint.y) / zoom;
      setPanOffset(
        clampPan(
          {
            x: initialPanOffset.x + dx,
            y: initialPanOffset.y + dy,
          },
          zoom,
        ),
      );
      return;
    }

    const pt = getPitchCoordinates(e);

    // 1. If Dragging an existing entity
    if (isDragging && draggedEntityId && selectedType) {
      const dx = pt.x - dragStartMousePos.x;
      const dy = pt.y - dragStartMousePos.y;

      if (selectedType === "line" && draggedInitialLine) {
        if (dragMode === "move") {
          const newPoints = draggedInitialLine.points.map((p) => ({
            x: Math.round(p.x + dx),
            y: Math.round(p.y + dy),
          }));
          const newCtrl = draggedInitialLine.controlPoint
            ? {
                x: Math.round(draggedInitialLine.controlPoint.x + dx),
                y: Math.round(draggedInitialLine.controlPoint.y + dy),
              }
            : undefined;
          tactics.setPresentState((prev) => ({
            ...prev,
            lines: prev.lines.map((l) =>
              l.id === draggedEntityId
                ? { ...l, points: newPoints, controlPoint: newCtrl }
                : l,
            ),
          }));
        } else if (dragMode === "line-start") {
          const newPoints = [
            { x: Math.round(pt.x), y: Math.round(pt.y) },
            ...draggedInitialLine.points.slice(1),
          ];
          tactics.setPresentState((prev) => ({
            ...prev,
            lines: prev.lines.map((l) =>
              l.id === draggedEntityId ? { ...l, points: newPoints } : l,
            ),
          }));
        } else if (dragMode === "line-end") {
          const newPoints = [
            ...draggedInitialLine.points.slice(0, -1),
            { x: Math.round(pt.x), y: Math.round(pt.y) },
          ];
          tactics.setPresentState((prev) => ({
            ...prev,
            lines: prev.lines.map((l) =>
              l.id === draggedEntityId ? { ...l, points: newPoints } : l,
            ),
          }));
        } else if (dragMode === "line-control") {
          const newCtrl = { x: Math.round(pt.x), y: Math.round(pt.y) };
          tactics.setPresentState((prev) => ({
            ...prev,
            lines: prev.lines.map((l) =>
              l.id === draggedEntityId ? { ...l, controlPoint: newCtrl } : l,
            ),
          }));
        }
      } else if (selectedType === "shape" && draggedInitialShape) {
        if (dragMode === "move") {
          const newX = Math.round(draggedInitialShape.x + dx);
          const newY = Math.round(draggedInitialShape.y + dy);
          tactics.setPresentState((prev) => ({
            ...prev,
            shapes: prev.shapes.map((s) =>
              s.id === draggedEntityId ? { ...s, x: newX, y: newY } : s,
            ),
          }));
        } else if (dragMode === "shape-resize") {
          const newW = Math.round(Math.max(25, draggedInitialShape.width + dx));
          const newH = Math.round(
            Math.max(25, draggedInitialShape.height + dy),
          );
          tactics.setPresentState((prev) => ({
            ...prev,
            shapes: prev.shapes.map((s) =>
              s.id === draggedEntityId
                ? { ...s, width: newW, height: newH }
                : s,
            ),
          }));
        }
      } else if (selectedType === "player") {
        const newX = Math.round(draggedInitialPos.x + dx);
        const newY = Math.round(draggedInitialPos.y + dy);
        tactics.setPresentState((prev) => ({
          ...prev,
          players: prev.players.map((p) =>
            p.id === draggedEntityId ? { ...p, x: newX, y: newY } : p,
          ),
        }));
      } else if (selectedType === "ball") {
        const newX = Math.round(draggedInitialPos.x + dx);
        const newY = Math.round(draggedInitialPos.y + dy);
        tactics.setPresentState((prev) => ({
          ...prev,
          balls: prev.balls.map((b) =>
            b.id === draggedEntityId ? { ...b, x: newX, y: newY } : b,
          ),
        }));
      } else if (selectedType === "equipment") {
        const newX = Math.round(draggedInitialPos.x + dx);
        const newY = Math.round(draggedInitialPos.y + dy);
        tactics.setPresentState((prev) => ({
          ...prev,
          equipments: prev.equipments.map((eq) =>
            eq.id === draggedEntityId ? { ...eq, x: newX, y: newY } : eq,
          ),
        }));
      } else if (selectedType === "text") {
        const newX = Math.round(draggedInitialPos.x + dx);
        const newY = Math.round(draggedInitialPos.y + dy);
        tactics.setPresentState((prev) => ({
          ...prev,
          texts: prev.texts.map((t) =>
            t.id === draggedEntityId ? { ...t, x: newX, y: newY } : t,
          ),
        }));
      }
      return;
    }

    // 2. If actively drawing a line or shape
    if (isDrawing) {
      setCurrentMousePoint(pt);
      if (activeTool === "draw-freehand") {
        setFreehandPoints((prev) => [...prev, pt]);
      }
    }
  };

  // Pointer up (commit drag, finish drawing, or end pinch/pan)
  const handleBoardPointerUp = (e?: React.PointerEvent<SVGSVGElement>) => {
    if (e) {
      activePointersRef.current.delete(e.pointerId);
    } else {
      activePointersRef.current.clear();
    }

    if (activePointersRef.current.size < 2) {
      isPinchingRef.current = false;
    }
    if (isPanning) {
      setIsPanning(false);
    }

    if (isDragging) {
      setIsDragging(false);
      setDraggedEntityId(null);
      setDraggedInitialLine(null);
      setDraggedInitialShape(null);
      dragHasMovedRef.current = false;
    }

    if (isDrawing && drawStartPoint && currentMousePoint) {
      const start = drawStartPoint;
      const end = currentMousePoint;
      const dist = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);

      // Only commit if user dragged a minimum threshold
      if (dist > 15 || activeTool === "draw-freehand") {
        if (activeTool === "line-run") {
          const newLine: DrawingLine = {
            id: `line-${Date.now()}`,
            type: "straight",
            points: [start, end],
            color: drawingColor,
            width: drawingWidth,
            style: "solid",
            arrowEnd: "arrow",
          };
          pushState((prev) => ({ ...prev, lines: [...prev.lines, newLine] }));
        } else if (activeTool === "line-pass") {
          const newLine: DrawingLine = {
            id: `line-${Date.now()}`,
            type: "pass",
            points: [start, end],
            color: drawingColor,
            width: drawingWidth,
            style: "dashed",
            arrowEnd: "arrow",
          };
          pushState((prev) => ({ ...prev, lines: [...prev.lines, newLine] }));
        } else if (activeTool === "line-dribble") {
          const newLine: DrawingLine = {
            id: `line-${Date.now()}`,
            type: "dribble",
            points: [start, end],
            color: drawingColor,
            width: drawingWidth,
            style: "wavy",
            arrowEnd: "arrow",
          };
          pushState((prev) => ({ ...prev, lines: [...prev.lines, newLine] }));
        } else if (activeTool === "line-curve") {
          // Default control point arched outward
          const midX = (start.x + end.x) / 2;
          const midY = (start.y + end.y) / 2;
          const dx = end.x - start.x;
          const dy = end.y - start.y;
          const ctrl = {
            x: midX - dy * 0.25,
            y: midY + dx * 0.25,
          };
          const newLine: DrawingLine = {
            id: `line-${Date.now()}`,
            type: "curve",
            points: [start, end],
            controlPoint: ctrl,
            color: drawingColor,
            width: drawingWidth,
            style: "solid",
            arrowEnd: "arrow",
          };
          pushState((prev) => ({ ...prev, lines: [...prev.lines, newLine] }));
        } else if (activeTool === "line-block") {
          const newLine: DrawingLine = {
            id: `line-${Date.now()}`,
            type: "block",
            points: [start, end],
            color: drawingColor,
            width: drawingWidth,
            style: "solid",
            arrowEnd: "t-bar",
          };
          pushState((prev) => ({ ...prev, lines: [...prev.lines, newLine] }));
        } else if (
          activeTool === "draw-freehand" &&
          freehandPoints.length > 2
        ) {
          const newLine: DrawingLine = {
            id: `line-${Date.now()}`,
            type: "freehand",
            points: freehandPoints,
            color: drawingColor,
            width: drawingWidth,
            style: "solid",
          };
          pushState((prev) => ({ ...prev, lines: [...prev.lines, newLine] }));
        } else if (activeTool === "shape-rect") {
          const newShape: TacticalShape = {
            id: `shape-${Date.now()}`,
            type: "rectangle",
            x: Math.min(start.x, end.x),
            y: Math.min(start.y, end.y),
            width: Math.abs(end.x - start.x),
            height: Math.abs(end.y - start.y),
            color: drawingColor,
            fillOpacity: 0.2,
            strokeColor: drawingColor,
            strokeWidth: 2,
          };
          pushState((prev) => ({
            ...prev,
            shapes: [...prev.shapes, newShape],
          }));
        } else if (activeTool === "shape-circle") {
          const newShape: TacticalShape = {
            id: `shape-${Date.now()}`,
            type: "circle",
            x: Math.min(start.x, end.x),
            y: Math.min(start.y, end.y),
            width: Math.abs(end.x - start.x),
            height: Math.abs(end.y - start.y),
            color: drawingColor,
            fillOpacity: 0.2,
            strokeColor: drawingColor,
            strokeWidth: 2,
          };
          pushState((prev) => ({
            ...prev,
            shapes: [...prev.shapes, newShape],
          }));
        }
      }

      setIsDrawing(false);
      setDrawStartPoint(null);
      setCurrentMousePoint(null);
      setFreehandPoints([]);
    }
  };

  // Keyboard Shortcuts (Delete, Escape, Ctrl+Z, Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs/textareas
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        tactics.deleteSelected();
      } else if (e.key === "Escape") {
        setSelectedId(null);
        setSelectedType(null);
        setActiveTool("select");
      } else if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        if (e.shiftKey) {
          tactics.redo();
        } else {
          tactics.undo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === "y") {
        tactics.redo();
      } else if (e.key.toLowerCase() === "v") {
        setActiveTool("select");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tactics, setSelectedId, setSelectedType, setActiveTool]);

  // Render live preview while user is actively dragging/drawing
  const renderDrawingPreview = () => {
    if (!isDrawing || !drawStartPoint || !currentMousePoint) return null;
    const start = drawStartPoint;
    const end = currentMousePoint;
    const ang = angle(start, end);

    if (activeTool === "line-run") {
      return (
        <g className="pointer-events-none opacity-80">
          <line
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke={drawingColor}
            strokeWidth={drawingWidth}
            strokeLinecap="round"
          />
          <path
            d={getArrowHeadPath(end, ang, Math.max(13, drawingWidth * 3.6))}
            fill={drawingColor}
            stroke={drawingColor}
            strokeWidth="0.75"
            strokeLinejoin="round"
          />
        </g>
      );
    }

    if (activeTool === "line-pass") {
      return (
        <g className="pointer-events-none opacity-80">
          <line
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke={drawingColor}
            strokeWidth={drawingWidth}
            strokeDasharray="7 5"
            strokeLinecap="round"
          />
          <path
            d={getArrowHeadPath(end, ang, Math.max(13, drawingWidth * 3.6))}
            fill={drawingColor}
            stroke={drawingColor}
            strokeWidth="0.75"
            strokeLinejoin="round"
          />
        </g>
      );
    }

    if (activeTool === "line-dribble") {
      const wavy = generateWavyPath(start, end);
      return (
        <g className="pointer-events-none opacity-80">
          <path
            d={wavy.path}
            fill="none"
            stroke={drawingColor}
            strokeWidth={drawingWidth}
            strokeLinecap="round"
          />
          <path
            d={getArrowHeadPath(
              end,
              wavy.endAngle,
              Math.max(13, drawingWidth * 3.6),
            )}
            fill={drawingColor}
            stroke={drawingColor}
            strokeWidth="0.75"
            strokeLinejoin="round"
          />
        </g>
      );
    }

    if (activeTool === "line-curve") {
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const ctrl = { x: midX - dy * 0.25, y: midY + dx * 0.25 };
      const curve = generateCurvePath(start, ctrl, end);
      return (
        <g className="pointer-events-none opacity-80">
          <path
            d={curve.path}
            fill="none"
            stroke={drawingColor}
            strokeWidth={drawingWidth}
            strokeLinecap="round"
          />
          <path
            d={getArrowHeadPath(
              end,
              curve.endAngle,
              Math.max(13, drawingWidth * 3.6),
            )}
            fill={drawingColor}
            stroke={drawingColor}
            strokeWidth="0.75"
            strokeLinejoin="round"
          />
        </g>
      );
    }

    if (activeTool === "line-block") {
      return (
        <g className="pointer-events-none opacity-80">
          <line
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke={drawingColor}
            strokeWidth={drawingWidth}
            strokeLinecap="round"
          />
          <path
            d={getTBarPath(end, ang, 22)}
            fill="none"
            stroke={drawingColor}
            strokeWidth={drawingWidth + 1}
          />
        </g>
      );
    }

    if (activeTool === "draw-freehand") {
      return (
        <g className="pointer-events-none opacity-80">
          <path
            d={generateFreehandPath(freehandPoints)}
            fill="none"
            stroke={drawingColor}
            strokeWidth={drawingWidth}
            strokeLinecap="round"
          />
        </g>
      );
    }

    if (activeTool === "shape-rect") {
      return (
        <rect
          x={Math.min(start.x, end.x)}
          y={Math.min(start.y, end.y)}
          width={Math.abs(end.x - start.x)}
          height={Math.abs(end.y - start.y)}
          fill={drawingColor}
          fillOpacity="0.2"
          stroke={drawingColor}
          strokeWidth="2"
          strokeDasharray="4 4"
          className="pointer-events-none"
        />
      );
    }

    if (activeTool === "shape-circle") {
      return (
        <ellipse
          cx={(start.x + end.x) / 2}
          cy={(start.y + end.y) / 2}
          rx={Math.abs(end.x - start.x) / 2}
          ry={Math.abs(end.y - start.y) / 2}
          fill={drawingColor}
          fillOpacity="0.2"
          stroke={drawingColor}
          strokeWidth="2"
          strokeDasharray="4 4"
          className="pointer-events-none"
        />
      );
    }

    return null;
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none overflow-hidden p-0 sm:p-1 min-h-0 min-w-0">
      {/* Floating Zoom Controls for Mobile (both Portrait and Landscape) and Tablets */}
      <div className="flex lg:hidden absolute bottom-2 right-2 sm:bottom-3 sm:right-3 z-30 items-center gap-1 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 p-1 rounded-xl shadow-2xl text-slate-200">
        <button
          type="button"
          onClick={handleZoomOut}
          disabled={zoom <= 1.0}
          title="Zoom Out"
          className="p-1 sm:p-1.5 rounded-lg hover:bg-slate-800 active:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer"
        >
          <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        <button
          type="button"
          onClick={handleResetZoom}
          title="Reset Zoom (100%)"
          className="px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg hover:bg-slate-800 text-[10px] sm:text-[11px] font-bold transition cursor-pointer min-w-[38px] sm:min-w-[44px] text-center"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          onClick={handleZoomIn}
          disabled={zoom >= 3.0}
          title="Zoom In"
          className="p-1 sm:p-1.5 rounded-lg hover:bg-slate-800 active:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer"
        >
          <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        {zoom > 1.0 && (
          <button
            type="button"
            onClick={handleResetZoom}
            title="Fit to Screen"
            className="p-1 sm:p-1.5 rounded-lg hover:bg-slate-800 text-emerald-400 transition cursor-pointer border-l border-slate-800 ml-0.5"
          >
            <Maximize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        )}
      </div>

      {/* Outer Pitch Frame with Zoom & Pan transform */}
      <div
        className={`relative w-full h-full max-w-full max-h-full aspect-[1050/680] shadow-2xl rounded-lg overflow-hidden border border-slate-700 md:border-2 bg-slate-950 transition-transform ${isPanning ? "duration-0" : "duration-75 ease-out"} origin-center flex items-center justify-center`}
        style={{
          aspectRatio: "1050 / 680",
          transform: `scale(${zoom}) translate(${panOffset.x}px, ${panOffset.y}px)`,
        }}
      >
        <svg
          ref={boardRef}
          viewBox={`0 0 ${PITCH_WIDTH} ${PITCH_HEIGHT}`}
          className={`w-full h-full block touch-none ${
            isPanning
              ? "cursor-grab active:cursor-grabbing"
              : activeTool === "select" && zoom > 1.05
                ? "cursor-grab"
                : "cursor-crosshair"
          }`}
          style={{
            width: "100%",
            height: "100%",
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
          }}
          onPointerDown={handleBoardPointerDown}
          onPointerMove={handleBoardPointerMove}
          onPointerUp={handleBoardPointerUp}
          onPointerCancel={handleBoardPointerUp}
        >
          {/* 1. Pitch Layer */}
          <SoccerPitch
            grassStyle={grassStyle}
            pitchType={pitchType}
            matchFormat={matchFormat}
            showBuildOutLines={showBuildOutLines}
            showGrid={showGrid}
            showZones={showZones}
          />

          {/* 2. Tactical Drawings & Annotations Layer */}
          <PitchDrawings
            lines={state.lines}
            shapes={state.shapes}
            texts={state.texts}
            selectedId={selectedId}
            onLinePointerDown={(id, e) =>
              handleEntityPointerDown(id, "line", e)
            }
            onLineHandlePointerDown={handleLineHandlePointerDown}
            onShapePointerDown={(id, e) =>
              handleEntityPointerDown(id, "shape", e)
            }
            onShapeResizePointerDown={handleShapeResizePointerDown}
            onTextPointerDown={(id, e) =>
              handleEntityPointerDown(id, "text", e)
            }
          />

          {/* 3. Equipments (Cones, Mannequins, Mini Goals) */}
          {state.equipments.map((eq) => (
            <PitchEquipment
              key={eq.id}
              equipment={eq}
              isSelected={selectedId === eq.id}
              onPointerDown={(id, e) =>
                handleEntityPointerDown(id, "equipment", e)
              }
            />
          ))}

          {/* 4. Balls */}
          {state.balls.map((b) => (
            <PitchBall
              key={b.id}
              ball={b}
              isSelected={selectedId === b.id}
              onPointerDown={(id, e) => handleEntityPointerDown(id, "ball", e)}
            />
          ))}

          {/* 5. Players */}
          {state.players.map((p) => (
            <PitchPlayer
              key={p.id}
              player={p}
              isSelected={selectedId === p.id}
              showPlayerLabels={showPlayerLabels}
              onSelect={(id, e) =>
                handleEntityPointerDown(id, "player", e as React.PointerEvent)
              }
              onPointerDown={(id, e) =>
                handleEntityPointerDown(id, "player", e)
              }
            />
          ))}

          {/* 6. Active Drawing Preview */}
          {renderDrawingPreview()}
        </svg>
      </div>
    </div>
  );
};

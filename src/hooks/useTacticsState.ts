import { useState, useCallback, useEffect } from "react";
import type {
  Player,
  Ball,
  Equipment,
  DrawingLine,
  TacticalShape,
  TextAnnotation,
  TacticFrame,
  ToolType,
  GrassStyle,
  PitchType,
  MatchFormat,
  FormationPreset,
} from "../types/tactics";
import {
  FORMATIONS_11V11_TEAM_A,
  FORMATIONS_9V9_TEAM_A,
  FORMATIONS_7V7_TEAM_A,
  PITCH_WIDTH,
  PITCH_HEIGHT,
  TEAM_COLORS,
} from "../constants/formations";

export interface BoardState {
  players: Player[];
  balls: Ball[];
  equipments: Equipment[];
  lines: DrawingLine[];
  shapes: TacticalShape[];
  texts: TextAnnotation[];
  title: string;
  notes: string;
}

export interface HistoryState {
  past: BoardState[];
  present: BoardState;
  future: BoardState[];
}

// Helper generators for Half Pitch (only Blue team: 7, 9, or 11 players facing top goal)
function generateHalfPitchPlayers(format: MatchFormat): Player[] {
  const ts = Date.now();
  if (format === "7v7") {
    return [
      {
        id: `player-b-gk-${ts}`,
        team: "B",
        number: "1",
        name: "GK",
        x: 525,
        y: 70,
        color: TEAM_COLORS.teamB.gk,
        textColor: "#ffffff",
        isGoalkeeper: true,
        radius: 17,
        facingAngle: 90,
      },
      {
        id: `player-b-rd-${ts}`,
        team: "B",
        number: "2",
        name: "RD",
        x: 740,
        y: 220,
        color: TEAM_COLORS.teamB.primary,
        textColor: "#ffffff",
        radius: 17,
        facingAngle: 90,
      },
      {
        id: `player-b-ld-${ts}`,
        team: "B",
        number: "3",
        name: "LD",
        x: 310,
        y: 220,
        color: TEAM_COLORS.teamB.primary,
        textColor: "#ffffff",
        radius: 17,
        facingAngle: 90,
      },
      {
        id: `player-b-cm-${ts}`,
        team: "B",
        number: "8",
        name: "CM",
        x: 525,
        y: 360,
        color: TEAM_COLORS.teamB.primary,
        textColor: "#ffffff",
        radius: 17,
        facingAngle: 90,
      },
      {
        id: `player-b-rm-${ts}`,
        team: "B",
        number: "7",
        name: "RM",
        x: 800,
        y: 440,
        color: TEAM_COLORS.teamB.primary,
        textColor: "#ffffff",
        radius: 17,
        facingAngle: 90,
      },
      {
        id: `player-b-lm-${ts}`,
        team: "B",
        number: "11",
        name: "LM",
        x: 250,
        y: 440,
        color: TEAM_COLORS.teamB.primary,
        textColor: "#ffffff",
        radius: 17,
        facingAngle: 90,
      },
      {
        id: `player-b-st-${ts}`,
        team: "B",
        number: "9",
        name: "ST",
        x: 525,
        y: 560,
        color: TEAM_COLORS.teamB.primary,
        textColor: "#ffffff",
        radius: 17,
        facingAngle: 90,
      },
    ];
  }
  if (format === "9v9") {
    return [
      {
        id: `player-b-gk-${ts}`,
        team: "B",
        number: "1",
        name: "GK",
        x: 525,
        y: 70,
        color: TEAM_COLORS.teamB.gk,
        textColor: "#ffffff",
        isGoalkeeper: true,
        radius: 17,
        facingAngle: 90,
      },
      {
        id: `player-b-rb-${ts}`,
        team: "B",
        number: "2",
        name: "RB",
        x: 780,
        y: 210,
        color: TEAM_COLORS.teamB.primary,
        textColor: "#ffffff",
        radius: 17,
        facingAngle: 90,
      },
      {
        id: `player-b-cb-${ts}`,
        team: "B",
        number: "4",
        name: "CB",
        x: 525,
        y: 190,
        color: TEAM_COLORS.teamB.primary,
        textColor: "#ffffff",
        radius: 17,
        facingAngle: 90,
      },
      {
        id: `player-b-lb-${ts}`,
        team: "B",
        number: "3",
        name: "LB",
        x: 270,
        y: 210,
        color: TEAM_COLORS.teamB.primary,
        textColor: "#ffffff",
        radius: 17,
        facingAngle: 90,
      },
      {
        id: `player-b-cm1-${ts}`,
        team: "B",
        number: "6",
        name: "CM",
        x: 420,
        y: 350,
        color: TEAM_COLORS.teamB.primary,
        textColor: "#ffffff",
        radius: 17,
        facingAngle: 90,
      },
      {
        id: `player-b-cm2-${ts}`,
        team: "B",
        number: "8",
        name: "CM",
        x: 630,
        y: 350,
        color: TEAM_COLORS.teamB.primary,
        textColor: "#ffffff",
        radius: 17,
        facingAngle: 90,
      },
      {
        id: `player-b-rw-${ts}`,
        team: "B",
        number: "7",
        name: "RW",
        x: 800,
        y: 520,
        color: TEAM_COLORS.teamB.primary,
        textColor: "#ffffff",
        radius: 17,
        facingAngle: 90,
      },
      {
        id: `player-b-st-${ts}`,
        team: "B",
        number: "9",
        name: "ST",
        x: 525,
        y: 540,
        color: TEAM_COLORS.teamB.primary,
        textColor: "#ffffff",
        radius: 17,
        facingAngle: 90,
      },
      {
        id: `player-b-lw-${ts}`,
        team: "B",
        number: "11",
        name: "LW",
        x: 250,
        y: 520,
        color: TEAM_COLORS.teamB.primary,
        textColor: "#ffffff",
        radius: 17,
        facingAngle: 90,
      },
    ];
  }
  // 11v11
  return [
    {
      id: `player-b-gk-${ts}`,
      team: "B",
      number: "1",
      name: "GK",
      x: 525,
      y: 70,
      color: TEAM_COLORS.teamB.gk,
      textColor: "#ffffff",
      isGoalkeeper: true,
      radius: 17,
      facingAngle: 90,
    },
    {
      id: `player-b-rb-${ts}`,
      team: "B",
      number: "2",
      name: "RB",
      x: 810,
      y: 220,
      color: TEAM_COLORS.teamB.primary,
      textColor: "#ffffff",
      radius: 17,
      facingAngle: 90,
    },
    {
      id: `player-b-rcb-${ts}`,
      team: "B",
      number: "4",
      name: "CB",
      x: 620,
      y: 190,
      color: TEAM_COLORS.teamB.primary,
      textColor: "#ffffff",
      radius: 17,
      facingAngle: 90,
    },
    {
      id: `player-b-lcb-${ts}`,
      team: "B",
      number: "5",
      name: "CB",
      x: 430,
      y: 190,
      color: TEAM_COLORS.teamB.primary,
      textColor: "#ffffff",
      radius: 17,
      facingAngle: 90,
    },
    {
      id: `player-b-lb-${ts}`,
      team: "B",
      number: "3",
      name: "LB",
      x: 240,
      y: 220,
      color: TEAM_COLORS.teamB.primary,
      textColor: "#ffffff",
      radius: 17,
      facingAngle: 90,
    },
    {
      id: `player-b-dm-${ts}`,
      team: "B",
      number: "6",
      name: "DM",
      x: 525,
      y: 320,
      color: TEAM_COLORS.teamB.primary,
      textColor: "#ffffff",
      radius: 17,
      facingAngle: 90,
    },
    {
      id: `player-b-rcm-${ts}`,
      team: "B",
      number: "8",
      name: "CM",
      x: 680,
      y: 410,
      color: TEAM_COLORS.teamB.primary,
      textColor: "#ffffff",
      radius: 17,
      facingAngle: 90,
    },
    {
      id: `player-b-lcm-${ts}`,
      team: "B",
      number: "10",
      name: "AM",
      x: 370,
      y: 410,
      color: TEAM_COLORS.teamB.primary,
      textColor: "#ffffff",
      radius: 17,
      facingAngle: 90,
    },
    {
      id: `player-b-rw-${ts}`,
      team: "B",
      number: "7",
      name: "RW",
      x: 820,
      y: 550,
      color: TEAM_COLORS.teamB.primary,
      textColor: "#ffffff",
      radius: 17,
      facingAngle: 90,
    },
    {
      id: `player-b-st-${ts}`,
      team: "B",
      number: "9",
      name: "ST",
      x: 525,
      y: 570,
      color: TEAM_COLORS.teamB.primary,
      textColor: "#ffffff",
      radius: 17,
      facingAngle: 90,
    },
    {
      id: `player-b-lw-${ts}`,
      team: "B",
      number: "11",
      name: "LW",
      x: 230,
      y: 550,
      color: TEAM_COLORS.teamB.primary,
      textColor: "#ffffff",
      radius: 17,
      facingAngle: 90,
    },
  ];
}

// Helper generators for Just Grass (only Blue team: 7, 9, or 11 players)
function generateGrassPlayers(format: MatchFormat): Player[] {
  const ts = Date.now();
  if (format === "7v7") {
    return [
      {
        id: `player-b-1-${ts}`,
        team: "B",
        number: "1",
        name: "",
        x: 525,
        y: 160,
        color: TEAM_COLORS.teamB.primary,
        textColor: "#ffffff",
        radius: 17,
      },
      {
        id: `player-b-2-${ts}`,
        team: "B",
        number: "2",
        name: "",
        x: 740,
        y: 280,
        color: TEAM_COLORS.teamB.primary,
        textColor: "#ffffff",
        radius: 17,
      },
      {
        id: `player-b-3-${ts}`,
        team: "B",
        number: "3",
        name: "",
        x: 310,
        y: 280,
        color: TEAM_COLORS.teamB.primary,
        textColor: "#ffffff",
        radius: 17,
      },
      {
        id: `player-b-4-${ts}`,
        team: "B",
        number: "4",
        name: "",
        x: 800,
        y: 440,
        color: TEAM_COLORS.teamB.primary,
        textColor: "#ffffff",
        radius: 17,
      },
      {
        id: `player-b-5-${ts}`,
        team: "B",
        number: "5",
        name: "",
        x: 525,
        y: 380,
        color: TEAM_COLORS.teamB.primary,
        textColor: "#ffffff",
        radius: 17,
      },
      {
        id: `player-b-6-${ts}`,
        team: "B",
        number: "6",
        name: "",
        x: 250,
        y: 440,
        color: TEAM_COLORS.teamB.primary,
        textColor: "#ffffff",
        radius: 17,
      },
      {
        id: `player-b-7-${ts}`,
        team: "B",
        number: "7",
        name: "",
        x: 525,
        y: 540,
        color: TEAM_COLORS.teamB.primary,
        textColor: "#ffffff",
        radius: 17,
      },
    ];
  }
  if (format === "9v9") {
    return [
      {
        id: `player-b-1-${ts}`,
        team: "B",
        number: "1",
        name: "",
        x: 525,
        y: 140,
        color: TEAM_COLORS.teamB.primary,
        textColor: "#ffffff",
        radius: 17,
      },
      {
        id: `player-b-2-${ts}`,
        team: "B",
        number: "2",
        name: "",
        x: 780,
        y: 250,
        color: TEAM_COLORS.teamB.primary,
        textColor: "#ffffff",
        radius: 17,
      },
      {
        id: `player-b-3-${ts}`,
        team: "B",
        number: "3",
        name: "",
        x: 525,
        y: 230,
        color: TEAM_COLORS.teamB.primary,
        textColor: "#ffffff",
        radius: 17,
      },
      {
        id: `player-b-4-${ts}`,
        team: "B",
        number: "4",
        name: "",
        x: 270,
        y: 250,
        color: TEAM_COLORS.teamB.primary,
        textColor: "#ffffff",
        radius: 17,
      },
      {
        id: `player-b-5-${ts}`,
        team: "B",
        number: "5",
        name: "",
        x: 410,
        y: 380,
        color: TEAM_COLORS.teamB.primary,
        textColor: "#ffffff",
        radius: 17,
      },
      {
        id: `player-b-6-${ts}`,
        team: "B",
        number: "6",
        name: "",
        x: 640,
        y: 380,
        color: TEAM_COLORS.teamB.primary,
        textColor: "#ffffff",
        radius: 17,
      },
      {
        id: `player-b-7-${ts}`,
        team: "B",
        number: "7",
        name: "",
        x: 800,
        y: 520,
        color: TEAM_COLORS.teamB.primary,
        textColor: "#ffffff",
        radius: 17,
      },
      {
        id: `player-b-8-${ts}`,
        team: "B",
        number: "8",
        name: "",
        x: 525,
        y: 540,
        color: TEAM_COLORS.teamB.primary,
        textColor: "#ffffff",
        radius: 17,
      },
      {
        id: `player-b-9-${ts}`,
        team: "B",
        number: "9",
        name: "",
        x: 250,
        y: 520,
        color: TEAM_COLORS.teamB.primary,
        textColor: "#ffffff",
        radius: 17,
      },
    ];
  }
  // 11v11
  return [
    {
      id: `player-b-1-${ts}`,
      team: "B",
      number: "1",
      name: "",
      x: 525,
      y: 120,
      color: TEAM_COLORS.teamB.primary,
      textColor: "#ffffff",
      radius: 17,
    },
    {
      id: `player-b-2-${ts}`,
      team: "B",
      number: "2",
      name: "",
      x: 820,
      y: 230,
      color: TEAM_COLORS.teamB.primary,
      textColor: "#ffffff",
      radius: 17,
    },
    {
      id: `player-b-3-${ts}`,
      team: "B",
      number: "3",
      name: "",
      x: 620,
      y: 210,
      color: TEAM_COLORS.teamB.primary,
      textColor: "#ffffff",
      radius: 17,
    },
    {
      id: `player-b-4-${ts}`,
      team: "B",
      number: "4",
      name: "",
      x: 430,
      y: 210,
      color: TEAM_COLORS.teamB.primary,
      textColor: "#ffffff",
      radius: 17,
    },
    {
      id: `player-b-5-${ts}`,
      team: "B",
      number: "5",
      name: "",
      x: 230,
      y: 230,
      color: TEAM_COLORS.teamB.primary,
      textColor: "#ffffff",
      radius: 17,
    },
    {
      id: `player-b-6-${ts}`,
      team: "B",
      number: "6",
      name: "",
      x: 525,
      y: 340,
      color: TEAM_COLORS.teamB.primary,
      textColor: "#ffffff",
      radius: 17,
    },
    {
      id: `player-b-7-${ts}`,
      team: "B",
      number: "7",
      name: "",
      x: 690,
      y: 430,
      color: TEAM_COLORS.teamB.primary,
      textColor: "#ffffff",
      radius: 17,
    },
    {
      id: `player-b-8-${ts}`,
      team: "B",
      number: "8",
      name: "",
      x: 360,
      y: 430,
      color: TEAM_COLORS.teamB.primary,
      textColor: "#ffffff",
      radius: 17,
    },
    {
      id: `player-b-9-${ts}`,
      team: "B",
      number: "9",
      name: "",
      x: 820,
      y: 550,
      color: TEAM_COLORS.teamB.primary,
      textColor: "#ffffff",
      radius: 17,
    },
    {
      id: `player-b-10-${ts}`,
      team: "B",
      number: "10",
      name: "",
      x: 525,
      y: 560,
      color: TEAM_COLORS.teamB.primary,
      textColor: "#ffffff",
      radius: 17,
    },
    {
      id: `player-b-11-${ts}`,
      team: "B",
      number: "11",
      name: "",
      x: 230,
      y: 550,
      color: TEAM_COLORS.teamB.primary,
      textColor: "#ffffff",
      radius: 17,
    },
  ];
}

// Helper generator for Full Pitch (both teams)
function generateFullPitchPlayers(format: MatchFormat): Player[] {
  const ts = Date.now();
  let formationA = FORMATIONS_11V11_TEAM_A[0];
  let formationB = FORMATIONS_11V11_TEAM_A[2];
  if (format === "9v9") {
    formationA = FORMATIONS_9V9_TEAM_A[0];
    formationB = FORMATIONS_9V9_TEAM_A[1];
  } else if (format === "7v7") {
    formationA = FORMATIONS_7V7_TEAM_A[0];
    formationB = FORMATIONS_7V7_TEAM_A[1];
  }

  const teamAPlayers: Player[] = formationA.players.map((p, idx) => ({
    id: `player-a-${ts}-${idx}`,
    team: "A",
    number: p.number,
    name: p.name,
    x: p.x,
    y: p.y,
    color: p.isGoalkeeper ? TEAM_COLORS.teamA.gk : TEAM_COLORS.teamA.primary,
    textColor: "#ffffff",
    isGoalkeeper: p.isGoalkeeper,
    radius: 17,
    facingAngle: 0,
    showVisionCone: false,
  }));

  const teamBPlayers: Player[] = formationB.players.map((p, idx) => ({
    id: `player-b-${ts}-${idx}`,
    team: "B",
    number: p.number,
    name: p.name,
    x: PITCH_WIDTH - p.x,
    y: p.y,
    color: p.isGoalkeeper ? TEAM_COLORS.teamB.gk : TEAM_COLORS.teamB.primary,
    textColor: "#ffffff",
    isGoalkeeper: p.isGoalkeeper,
    radius: 17,
    facingAngle: 180,
    showVisionCone: false,
  }));

  return [...teamAPlayers, ...teamBPlayers];
}

// Generate complete base board state according to pitch type and match format
export function createBaseState(
  pitchType: PitchType = "full",
  format: MatchFormat = "11v11",
): BoardState {
  if (pitchType === "half") {
    return {
      players: generateHalfPitchPlayers(format),
      balls: [{ id: `ball-${Date.now()}`, x: 525, y: 480, size: 11 }],
      equipments: [],
      lines: [],
      shapes: [],
      texts: [],
      title: `Half Pitch Training - ${format}`,
      notes: "Tactical analysis and defending/attacking phases.",
    };
  }
  if (pitchType === "blank") {
    return {
      players: generateGrassPlayers(format),
      balls: [{ id: `ball-${Date.now()}`, x: 525, y: 340, size: 11 }],
      equipments: [],
      lines: [],
      shapes: [],
      texts: [],
      title: `Drill / Practice - ${format}`,
      notes: "Drill notes and coaching points.",
    };
  }
  // Full pitch
  return {
    players: generateFullPitchPlayers(format),
    balls: [{ id: `ball-${Date.now()}`, x: 525, y: 340, size: 11 }],
    equipments: [],
    lines: [],
    shapes: [],
    texts: [],
    title: `Match Tactics - ${format}`,
    notes: "Tactical analysis and passing progressions.",
  };
}

const STORAGE_KEY = "tactical_board_saved_state_v1";

interface SavedTacticsData {
  boardState?: BoardState;
  matchFormat?: MatchFormat;
  pitchType?: PitchType;
  selectedFormations?: Record<
    MatchFormat,
    { teamA: string | null; teamB: string | null }
  >;
  showBuildOutLines?: boolean;
  grassStyle?: GrassStyle;
  showGrid?: boolean;
  showZones?: boolean;
  showPlayerLabels?: boolean;
  drawingColor?: string;
  drawingWidth?: number;
  frames?: TacticFrame[];
  activeFrameIndex?: number;
}

function loadSavedTactics(): SavedTacticsData | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedTacticsData;
  } catch {
    return null;
  }
}

export function useTacticsState() {
  const savedData = loadSavedTactics();
  const hasRestoredFromStorage = !!(
    savedData?.boardState &&
    Array.isArray(savedData.boardState.players) &&
    savedData.boardState.players.length > 0
  );

  const [isRestoredFromCache, setIsRestoredFromCache] = useState<boolean>(
    () => hasRestoredFromStorage,
  );

  // Current active tool
  const [activeTool, setActiveTool] = useState<ToolType>("select");

  // Game Format: 11v11, 9v9, or 7v7
  const [matchFormat, setMatchFormat] = useState<MatchFormat>(
    () => savedData?.matchFormat || "11v11",
  );
  const [showBuildOutLines, setShowBuildOutLines] = useState<boolean>(() =>
    savedData?.showBuildOutLines !== undefined
      ? savedData.showBuildOutLines
      : true,
  );

  // Selected formations for Team A and Team B across formats
  const [selectedFormations, setSelectedFormations] = useState<
    Record<MatchFormat, { teamA: string | null; teamB: string | null }>
  >(
    () =>
      savedData?.selectedFormations || {
        "11v11": { teamA: "4-3-3", teamB: "4-4-2" },
        "9v9": { teamA: "3-2-3", teamB: "3-3-2" },
        "7v7": { teamA: "2-3-1", teamB: "3-2-1" },
      },
  );

  // Selected item ID and its type
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<
    "player" | "ball" | "equipment" | "line" | "shape" | "text" | null
  >(null);

  // Pitch visual customization
  const [grassStyle, setGrassStyle] = useState<GrassStyle>(
    () => savedData?.grassStyle || "stripes",
  );
  const [pitchType, setPitchType] = useState<PitchType>(
    () => savedData?.pitchType || "full",
  );
  const [showGrid, setShowGrid] = useState<boolean>(
    () => savedData?.showGrid ?? false,
  );
  const [showZones, setShowZones] = useState<boolean>(
    () => savedData?.showZones ?? false,
  );
  const [showPlayerLabels, setShowPlayerLabels] = useState<boolean>(
    () => savedData?.showPlayerLabels ?? true,
  );

  // Drawing customization
  const [drawingColor, setDrawingColor] = useState<string>(
    () => savedData?.drawingColor || "#facc15",
  );
  const [drawingWidth, setDrawingWidth] = useState<number>(
    () => savedData?.drawingWidth || 3.5,
  );

  // Multi-frame / animation slides
  const [frames, setFrames] = useState<TacticFrame[]>(
    () =>
      savedData?.frames || [
        {
          id: "frame-1",
          title: "Phase 1: Build-up",
          players: [],
          balls: [{ id: "ball-1", x: PITCH_WIDTH / 2, y: PITCH_HEIGHT / 2 }],
          equipments: [],
          lines: [],
          shapes: [],
          texts: [],
          notes: "Initial team shape and build-up phase.",
        },
      ],
  );
  const [activeFrameIndex, setActiveFrameIndex] = useState<number>(
    () => savedData?.activeFrameIndex || 0,
  );

  // Undo / Redo history
  const [history, setHistory] = useState<HistoryState>(() => {
    const saved = loadSavedTactics();
    const initial =
      saved?.boardState &&
      Array.isArray(saved.boardState.players) &&
      saved.boardState.players.length > 0
        ? saved.boardState
        : createBaseState(
            saved?.pitchType || "full",
            saved?.matchFormat || "11v11",
          );

    return {
      past: [],
      present: initial,
      future: [],
    };
  });

  const state = history.present;

  // Auto-persist board and settings to localStorage across browser refreshes
  useEffect(() => {
    try {
      const dataToSave: SavedTacticsData = {
        boardState: state,
        matchFormat,
        pitchType,
        selectedFormations,
        showBuildOutLines,
        grassStyle,
        showGrid,
        showZones,
        showPlayerLabels,
        drawingColor,
        drawingWidth,
        frames,
        activeFrameIndex,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch {
      // Ignore quota exceeded or storage unavailable errors
    }
  }, [
    state,
    matchFormat,
    pitchType,
    selectedFormations,
    showBuildOutLines,
    grassStyle,
    showGrid,
    showZones,
    showPlayerLabels,
    drawingColor,
    drawingWidth,
    frames,
    activeFrameIndex,
  ]);

  // Push new state onto history
  const pushState = useCallback(
    (newStateOrUpdater: BoardState | ((prev: BoardState) => BoardState)) => {
      setHistory((curr) => {
        const nextState =
          typeof newStateOrUpdater === "function"
            ? newStateOrUpdater(curr.present)
            : newStateOrUpdater;

        return {
          past: [...curr.past.slice(-25), curr.present], // Keep max 25 history steps
          present: nextState,
          future: [],
        };
      });
    },
    [],
  );

  // Directly update present state during dragging without flooding history
  const setPresentState = useCallback(
    (newStateOrUpdater: BoardState | ((prev: BoardState) => BoardState)) => {
      setHistory((curr) => ({
        ...curr,
        present:
          typeof newStateOrUpdater === "function"
            ? newStateOrUpdater(curr.present)
            : newStateOrUpdater,
      }));
    },
    [],
  );

  // Save a snapshot of present state to undo history before an interactive drag
  const snapshotToHistory = useCallback(() => {
    setHistory((curr) => ({
      past: [...curr.past.slice(-25), curr.present],
      present: curr.present,
      future: [],
    }));
  }, []);

  // Undo
  const undo = useCallback(() => {
    setHistory((curr) => {
      if (curr.past.length === 0) return curr;
      const previous = curr.past[curr.past.length - 1];
      const newPast = curr.past.slice(0, curr.past.length - 1);
      return {
        past: newPast,
        present: previous,
        future: [curr.present, ...curr.future],
      };
    });
  }, []);

  // Redo
  const redo = useCallback(() => {
    setHistory((curr) => {
      if (curr.future.length === 0) return curr;
      const next = curr.future[0];
      const newFuture = curr.future.slice(1);
      return {
        past: [...curr.past, curr.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  // Modify individual items
  const updatePlayer = useCallback(
    (id: string, updates: Partial<Player>) => {
      pushState((prev) => ({
        ...prev,
        players: prev.players.map((p) =>
          p.id === id ? { ...p, ...updates } : p,
        ),
      }));
    },
    [pushState],
  );

  const updateBall = useCallback(
    (id: string, updates: Partial<Ball>) => {
      pushState((prev) => ({
        ...prev,
        balls: prev.balls.map((b) => (b.id === id ? { ...b, ...updates } : b)),
      }));
    },
    [pushState],
  );

  const updateEquipment = useCallback(
    (id: string, updates: Partial<Equipment>) => {
      pushState((prev) => ({
        ...prev,
        equipments: prev.equipments.map((eq) =>
          eq.id === id ? { ...eq, ...updates } : eq,
        ),
      }));
    },
    [pushState],
  );

  const updateLine = useCallback(
    (id: string, updates: Partial<DrawingLine>) => {
      pushState((prev) => ({
        ...prev,
        lines: prev.lines.map((l) => (l.id === id ? { ...l, ...updates } : l)),
      }));
    },
    [pushState],
  );

  const updateShape = useCallback(
    (id: string, updates: Partial<TacticalShape>) => {
      pushState((prev) => ({
        ...prev,
        shapes: prev.shapes.map((s) =>
          s.id === id ? { ...s, ...updates } : s,
        ),
      }));
    },
    [pushState],
  );

  const updateText = useCallback(
    (id: string, updates: Partial<TextAnnotation>) => {
      pushState((prev) => ({
        ...prev,
        texts: prev.texts.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      }));
    },
    [pushState],
  );

  // Delete selected item
  const deleteSelected = useCallback(() => {
    if (!selectedId) return;

    pushState((prev) => ({
      ...prev,
      players: prev.players.filter((p) => p.id !== selectedId),
      balls: prev.balls.filter((b) => b.id !== selectedId),
      equipments: prev.equipments.filter((eq) => eq.id !== selectedId),
      lines: prev.lines.filter((l) => l.id !== selectedId),
      shapes: prev.shapes.filter((s) => s.id !== selectedId),
      texts: prev.texts.filter((t) => t.id !== selectedId),
    }));

    setSelectedId(null);
    setSelectedType(null);
  }, [selectedId, pushState]);

  // Clear all drawings (lines, shapes, texts)
  const clearDrawings = useCallback(() => {
    pushState((prev) => ({
      ...prev,
      lines: [],
      shapes: [],
      texts: [],
    }));
    if (
      selectedType === "line" ||
      selectedType === "shape" ||
      selectedType === "text"
    ) {
      setSelectedId(null);
      setSelectedType(null);
    }
  }, [pushState, selectedType]);

  // Reset entire board to the base setup of current pitch layout & match format
  const resetBoard = useCallback(() => {
    const fresh = createBaseState(pitchType, matchFormat);
    pushState(fresh);
    setIsRestoredFromCache(false);
    const defaultA =
      matchFormat === "11v11"
        ? "4-3-3"
        : matchFormat === "9v9"
          ? "3-2-3"
          : "2-3-1";
    const defaultB =
      matchFormat === "11v11"
        ? "4-4-2"
        : matchFormat === "9v9"
          ? "3-3-2"
          : "3-2-1";
    setSelectedFormations((prev) => ({
      ...prev,
      [matchFormat]: { teamA: defaultA, teamB: defaultB },
    }));
    setSelectedId(null);
    setSelectedType(null);
  }, [pitchType, matchFormat, pushState]);

  // Load Formation
  const loadFormation = useCallback(
    (formation: FormationPreset, team: "A" | "B") => {
      setSelectedFormations((prev) => ({
        ...prev,
        [matchFormat]: {
          ...prev[matchFormat],
          [team === "A" ? "teamA" : "teamB"]: formation.id,
        },
      }));
      pushState((prev) => {
        const isTeamA = team === "A";
        const color = isTeamA
          ? TEAM_COLORS.teamA.primary
          : TEAM_COLORS.teamB.primary;
        const gkColor = isTeamA ? TEAM_COLORS.teamA.gk : TEAM_COLORS.teamB.gk;
        const facing = isTeamA ? 0 : 180;

        const newPlayers: Player[] = formation.players.map((p, idx) => ({
          id: `player-${team.toLowerCase()}-${Date.now()}-${idx}`,
          team,
          number: p.number,
          name: p.name,
          x: isTeamA ? p.x : PITCH_WIDTH - p.x,
          y: p.y,
          color: p.isGoalkeeper ? gkColor : color,
          textColor: "#ffffff",
          isGoalkeeper: p.isGoalkeeper,
          radius: 17,
          facingAngle: facing,
          showVisionCone: false,
        }));

        // Keep the other team's players
        const otherTeamPlayers = prev.players.filter((p) => p.team !== team);

        return {
          ...prev,
          players: [...otherTeamPlayers, ...newPlayers],
        };
      });
    },
    [matchFormat, pushState],
  );

  // Switch Format and load default formations
  const switchFormat = useCallback(
    (format: MatchFormat) => {
      setMatchFormat(format);
      const defaultA =
        format === "11v11" ? "4-3-3" : format === "9v9" ? "3-2-3" : "2-3-1";
      const defaultB =
        format === "11v11" ? "4-4-2" : format === "9v9" ? "3-3-2" : "3-2-1";
      setSelectedFormations((prev) => ({
        ...prev,
        [format]: { teamA: defaultA, teamB: defaultB },
      }));
      pushState((prev) => {
        if (pitchType === "half") {
          return {
            ...prev,
            players: generateHalfPitchPlayers(format),
            balls: [{ id: `ball-${Date.now()}`, x: 525, y: 480, size: 11 }],
            title: `Half Pitch Training - ${format}`,
          };
        }
        if (pitchType === "blank") {
          return {
            ...prev,
            players: generateGrassPlayers(format),
            balls: [{ id: `ball-${Date.now()}`, x: 525, y: 340, size: 11 }],
            title: `Drill / Practice - ${format}`,
          };
        }
        // Full pitch
        return {
          ...prev,
          players: generateFullPitchPlayers(format),
          balls: [{ id: `ball-${Date.now()}`, x: 525, y: 340, size: 11 }],
          title: `Match Tactics - ${format}`,
        };
      });
      setSelectedId(null);
      setSelectedType(null);
    },
    [pitchType, pushState],
  );

  // Switch Pitch Layout (Full Pitch, Half Pitch, Just Grass)
  // Only changes the pitch background/field markings without resetting existing players or board items
  const switchPitchType = useCallback((type: PitchType) => {
    setPitchType(type);
  }, []);

  return {
    state,
    pushState,
    setPresentState,
    snapshotToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    activeTool,
    setActiveTool,
    matchFormat,
    setMatchFormat,
    isRestoredFromCache,
    setIsRestoredFromCache,
    selectedFormationA: selectedFormations[matchFormat]?.teamA ?? null,
    selectedFormationB: selectedFormations[matchFormat]?.teamB ?? null,
    selectedFormations,
    showBuildOutLines,
    setShowBuildOutLines,
    switchFormat,
    switchPitchType,
    selectedId,
    setSelectedId,
    selectedType,
    setSelectedType,
    grassStyle,
    setGrassStyle,
    pitchType,
    setPitchType,
    showGrid,
    setShowGrid,
    showZones,
    setShowZones,
    showPlayerLabels,
    setShowPlayerLabels,
    drawingColor,
    setDrawingColor,
    drawingWidth,
    setDrawingWidth,
    updatePlayer,
    updateBall,
    updateEquipment,
    updateLine,
    updateShape,
    updateText,
    deleteSelected,
    clearDrawings,
    resetBoard,
    loadFormation,
    frames,
    setFrames,
    activeFrameIndex,
    setActiveFrameIndex,
  };
}

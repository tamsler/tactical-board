import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import type {
  Player,
  Ball,
  Equipment,
  DrawingLine,
  TacticalShape,
  TextAnnotation,
  ToolType,
  GrassStyle,
  PitchType,
  MatchFormat,
  FormationPreset,
  Point,
} from "../types/tactics";
import {
  FORMATIONS_11V11_TEAM_A,
  FORMATIONS_9V9_TEAM_A,
  FORMATIONS_7V7_TEAM_A,
  PITCH_WIDTH,
  PITCH_HEIGHT,
  TEAM_COLORS,
  mirrorForTeamB,
} from "../constants/formations";
import { track } from "../utils/analytics";
import { createId, randomToken } from "../utils/id";
import {
  type DocumentSettings,
  type SelectedFormations,
  type SequenceState,
} from "../animation/model";
import {
  applyBoardEdit,
  copyEquipmentToAllFrames as copyEquipmentToAllFramesCommand,
  assignFormationSlots,
  boardFromSequence,
  deleteFrame as deleteFrameCommand,
  duplicateFrame,
  moveFrame as moveFrameCommand,
  removeEquipmentFromAllFrames as removeEquipmentFromAllFramesCommand,
  renameFrame as renameFrameCommand,
  sequenceFromBoard,
  setFrameTiming as setFrameTimingCommand,
  setPathControl as setPathControlCommand,
} from "../animation/commands";
import { toDocument, type ImportedProject } from "../animation/migrate";
import {
  buildStoredState,
  loadStoredState,
  saveStoredState,
  type Preferences,
  type StorageProblem,
  type StoredState,
} from "../animation/storage";

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

interface HistorySnapshot {
  sequence: SequenceState;
  selectedFrameId: string;
}

export interface HistoryState {
  past: HistorySnapshot[];
  present: HistorySnapshot;
  future: HistorySnapshot[];
  /** In-progress drag of the selected frame; never persisted or in history. */
  draft: BoardState | null;
  /** Playback/scrub preview: document edits are rejected. */
  readOnly: boolean;
}

const HISTORY_LIMIT = 25;
const AUTOSAVE_DELAY_MS = 750;

export type SaveStatus =
  { state: "saved" } | { state: "error"; reason: "quota" | "unavailable" };

type BoardUpdate = BoardState | ((prev: BoardState) => BoardState);

function commit(curr: HistoryState, next: HistorySnapshot): HistoryState {
  if (curr.readOnly) return curr;
  return {
    past: [...curr.past.slice(-HISTORY_LIMIT), curr.present],
    present: next,
    future: [],
    draft: null,
    readOnly: false,
  };
}

function editSnapshot(
  snap: HistorySnapshot,
  update: BoardUpdate,
): HistorySnapshot {
  const prevBoard = boardFromSequence(snap.sequence, snap.selectedFrameId);
  const nextBoard = typeof update === "function" ? update(prevBoard) : update;
  return {
    ...snap,
    sequence: applyBoardEdit(
      snap.sequence,
      snap.selectedFrameId,
      prevBoard,
      nextBoard,
    ),
  };
}

// Helper generators for Half Pitch (a single team: 7, 9, or 11 players facing top goal)
function generateHalfPitchTeamB(format: MatchFormat): Player[] {
  const ts = randomToken();
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
        x: 310,
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
        x: 740,
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
        x: 250,
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
        x: 800,
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
        x: 270,
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
        x: 780,
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
        x: 630,
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
        x: 420,
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
        x: 250,
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
        x: 800,
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
      x: 240,
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
      x: 430,
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
      x: 620,
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
      x: 810,
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
      x: 370,
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
      x: 680,
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
      x: 230,
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
      x: 820,
      y: 550,
      color: TEAM_COLORS.teamB.primary,
      textColor: "#ffffff",
      radius: 17,
      facingAngle: 90,
    },
  ];
}

function generateHalfPitchPlayers(
  format: MatchFormat,
  team: "A" | "B" = "B",
): Player[] {
  const players = generateHalfPitchTeamB(format);
  if (team === "B") return players;
  return players.map((p) => ({
    ...p,
    id: p.id.replace("player-b-", "player-a-"),
    team: "A" as const,
    color: p.isGoalkeeper ? TEAM_COLORS.teamA.gk : TEAM_COLORS.teamA.primary,
  }));
}

// Half pitch is the team's own half turned 90deg, with its goal at the top: a
// preset's depth (x) becomes y, and its lateral position (y) becomes x. The team
// faces down the screen, so its right side is the left of the screen.
function toHalfPitchPosition(x: number, y: number): { x: number; y: number } {
  const padX = 40;
  const padY = 30;
  const fieldW = PITCH_WIDTH - padX * 2;
  const fieldH = PITCH_HEIGHT - padY * 2;
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  const depth = clamp((x - padX) / (PITCH_WIDTH / 2 - padX));
  const lateral = clamp((y - padY) / fieldH);
  return {
    x: padX + (1 - lateral) * fieldW,
    y: padY + depth * fieldH,
  };
}

// Helper generator for Full Pitch (both teams)
function generateFullPitchPlayers(format: MatchFormat): Player[] {
  const ts = randomToken();
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
    ...mirrorForTeamB({ x: p.x, y: p.y }),
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
  halfTeam: "A" | "B" = "B",
): BoardState {
  if (pitchType === "half") {
    return {
      players: generateHalfPitchPlayers(format, halfTeam),
      balls: [{ id: createId("ball"), x: 525, y: 480, size: 11 }],
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
      players: [],
      balls: [],
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
    balls: [{ id: createId("ball"), x: 525, y: 340, size: 11 }],
    equipments: [],
    lines: [],
    shapes: [],
    texts: [],
    title: `Match Tactics - ${format}`,
    notes: "Tactical analysis and passing progressions.",
  };
}

// Identity of the board's contents, ignoring generated ids, so a board can be
// compared against the untouched default for a layout.
function boardSignature(s: BoardState): string {
  const players = s.players
    .map((p) =>
      [
        p.team,
        p.number,
        p.name,
        Math.round(p.x),
        Math.round(p.y),
        p.color,
        p.textColor,
        p.radius,
        p.facingAngle,
        p.isGoalkeeper ? 1 : 0,
      ].join("|"),
    )
    .sort()
    .join(";");
  const balls = s.balls
    .map((b) => [Math.round(b.x), Math.round(b.y), b.size].join("|"))
    .sort()
    .join(";");
  return [
    players,
    balls,
    s.equipments.length,
    s.lines.length,
    s.shapes.length,
    s.texts.length,
  ].join("//");
}

export function useTacticsState() {
  // Storage is read once per mount, never per render.
  const [initial] = useState(loadStoredState);
  const { settings: savedSettings, preferences: savedPrefs } = initial;

  const [isRestoredFromCache, setIsRestoredFromCache] = useState<boolean>(
    () => initial.sequence !== null,
  );

  // Current active tool
  const [activeTool, setActiveTool] = useState<ToolType>("select");

  // Game Format: 11v11, 9v9, or 7v7
  const [matchFormat, setMatchFormat] = useState<MatchFormat>(
    savedSettings.matchFormat,
  );
  const [showBuildOutLines, setShowBuildOutLines] = useState<boolean>(
    savedPrefs.showBuildOutLines,
  );

  // Selected formations for Team A and Team B across formats
  const [selectedFormations, setSelectedFormations] =
    useState<SelectedFormations>(savedSettings.selectedFormations);

  // Selected item ID and its type
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<
    "player" | "ball" | "equipment" | "line" | "shape" | "text" | null
  >(null);

  // Pitch visual customization
  const [grassStyle, setGrassStyle] = useState<GrassStyle>(
    savedPrefs.grassStyle,
  );
  const [pitchType, setPitchType] = useState<PitchType>(
    savedSettings.pitchType,
  );
  const [halfPitchTeam, setHalfPitchTeam] = useState<"A" | "B">(
    savedSettings.halfPitchTeam,
  );
  const [hiddenTeams, setHiddenTeams] = useState<{ A: boolean; B: boolean }>(
    savedPrefs.hiddenTeams,
  );
  const [showGrid, setShowGrid] = useState<boolean>(savedPrefs.showGrid);
  const [showZones, setShowZones] = useState<boolean>(savedPrefs.showZones);
  const [showPlayerLabels, setShowPlayerLabels] = useState<boolean>(
    savedPrefs.showPlayerLabels,
  );

  // Drawing customization
  const [drawingColor, setDrawingColor] = useState<string>(
    savedPrefs.drawingColor,
  );
  const [drawingWidth, setDrawingWidth] = useState<number>(
    savedPrefs.drawingWidth,
  );
  const [showPreviousFrame, setShowPreviousFrame] = useState<boolean>(
    savedPrefs.showPreviousFrame,
  );

  // Undo / Redo history over the whole sequence plus the selected frame
  const [history, setHistory] = useState<HistoryState>(() => {
    const sequence =
      initial.sequence ??
      sequenceFromBoard(
        createBaseState(
          savedSettings.pitchType,
          savedSettings.matchFormat,
          savedSettings.halfPitchTeam,
        ),
      );
    return {
      past: [],
      present: {
        sequence,
        selectedFrameId: initial.selectedFrameId ?? sequence.frames[0].id,
      },
      future: [],
      draft: null,
      readOnly: false,
    };
  });

  const { present, draft } = history;
  const committedState = useMemo(
    () => boardFromSequence(present.sequence, present.selectedFrameId),
    [present],
  );
  const state = draft ?? committedState;
  const frames = present.sequence.frames;
  const selectedFrameId = present.selectedFrameId;
  const isAnimated = frames.length > 1;
  const hasDraft = draft !== null;

  // Playback/scrub preview is read-only; the ref guards commands that also touch settings.
  const isPreviewing = history.readOnly;
  const previewRef = useRef(false);
  const setPreviewing = useCallback((previewing: boolean) => {
    previewRef.current = previewing;
    setHistory((curr) =>
      curr.readOnly === previewing && !curr.draft
        ? curr
        : { ...curr, readOnly: previewing, draft: null },
    );
    if (previewing) {
      setSelectedId(null);
      setSelectedType(null);
    }
  }, []);

  // Debounced autosave of committed changes only; drag drafts are never written.
  const settings = useMemo<DocumentSettings>(
    () => ({ pitchType, matchFormat, halfPitchTeam, selectedFormations }),
    [pitchType, matchFormat, halfPitchTeam, selectedFormations],
  );
  const preferences = useMemo<Preferences>(
    () => ({
      grassStyle,
      showGrid,
      showZones,
      showPlayerLabels,
      showBuildOutLines,
      drawingColor,
      drawingWidth,
      hiddenTeams,
      showPreviousFrame,
    }),
    [
      grassStyle,
      showGrid,
      showZones,
      showPlayerLabels,
      showBuildOutLines,
      drawingColor,
      drawingWidth,
      hiddenTeams,
      showPreviousFrame,
    ],
  );
  const projectDocument = useMemo(
    () => toDocument(present.sequence, settings),
    [present.sequence, settings],
  );

  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ state: "saved" });
  // Unreadable v2 data pauses autosave until the user decides what to do with it.
  const [storageProblem, setStorageProblem] = useState<StorageProblem | null>(
    initial.problem ?? null,
  );
  const pendingSaveRef = useRef<StoredState | null>(null);
  const latestSaveRef = useRef<StoredState | null>(null);
  const flushSave = useCallback(() => {
    const data = pendingSaveRef.current;
    if (!data) return;
    const result = saveStoredState(data);
    if (result.ok) {
      pendingSaveRef.current = null;
      setSaveStatus({ state: "saved" });
    } else {
      setSaveStatus({ state: "error", reason: result.reason });
      track("animation_save_failed", { reason: result.reason });
    }
  }, []);

  useEffect(() => {
    if (storageProblem) return;
    const data = buildStoredState(
      present.sequence,
      present.selectedFrameId,
      settings,
      preferences,
    );
    pendingSaveRef.current = data;
    latestSaveRef.current = data;
    const timer = setTimeout(flushSave, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [present, settings, preferences, storageProblem, flushSave]);

  const retrySave = useCallback(() => {
    pendingSaveRef.current = latestSaveRef.current;
    flushSave();
  }, [flushSave]);

  /** Overwrites unreadable saved data with the current board and resumes autosave. */
  const discardStoredData = useCallback(() => setStorageProblem(null), []);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flushSave();
    };
    window.addEventListener("pagehide", flushSave);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("pagehide", flushSave);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      flushSave();
    };
  }, [flushSave]);

  // Push an edit of the selected frame onto history
  const pushState = useCallback(
    (newStateOrUpdater: BoardState | ((prev: BoardState) => BoardState)) => {
      setHistory((curr) =>
        commit(curr, editSnapshot(curr.present, newStateOrUpdater)),
      );
    },
    [],
  );

  // Edit the selected frame without an undo entry (layout changes aren't undoable)
  const setPresentState = useCallback(
    (newStateOrUpdater: BoardState | ((prev: BoardState) => BoardState)) => {
      setHistory((curr) =>
        curr.readOnly
          ? curr
          : {
              ...curr,
              present: editSnapshot(curr.present, newStateOrUpdater),
              draft: null,
            },
      );
    },
    [],
  );

  const replaceSequence = useCallback((sequence: SequenceState) => {
    setHistory((curr) =>
      commit(curr, { sequence, selectedFrameId: sequence.frames[0].id }),
    );
  }, []);

  // Drag transaction: one history entry on commit, none for a click or a cancel
  const beginDrag = useCallback(() => {
    setHistory((curr) =>
      curr.readOnly
        ? curr
        : {
            ...curr,
            draft: boardFromSequence(
              curr.present.sequence,
              curr.present.selectedFrameId,
            ),
          },
    );
  }, []);

  // No-op once the draft was dropped (undo, frame switch, cancel) mid-gesture.
  const updateDrag = useCallback(
    (updater: (prev: BoardState) => BoardState) => {
      setHistory((curr) =>
        curr.draft ? { ...curr, draft: updater(curr.draft) } : curr,
      );
    },
    [],
  );

  const commitDrag = useCallback(() => {
    setHistory((curr) => {
      if (!curr.draft) return curr;
      const base = boardFromSequence(
        curr.present.sequence,
        curr.present.selectedFrameId,
      );
      const d = curr.draft;
      const unchanged =
        d.players === base.players &&
        d.balls === base.balls &&
        d.equipments === base.equipments &&
        d.lines === base.lines &&
        d.shapes === base.shapes &&
        d.texts === base.texts;
      if (unchanged) return { ...curr, draft: null };
      return commit(curr, editSnapshot(curr.present, d));
    });
  }, []);

  const cancelDrag = useCallback(() => {
    setHistory((curr) => (curr.draft ? { ...curr, draft: null } : curr));
  }, []);

  // Undo
  const undo = useCallback(() => {
    setHistory((curr) => {
      if (curr.past.length === 0 || curr.readOnly) return curr;
      const previous = curr.past[curr.past.length - 1];
      const newPast = curr.past.slice(0, curr.past.length - 1);
      return {
        past: newPast,
        present: previous,
        future: [curr.present, ...curr.future],
        draft: null,
        readOnly: false,
      };
    });
  }, []);

  // Redo
  const redo = useCallback(() => {
    setHistory((curr) => {
      if (curr.future.length === 0 || curr.readOnly) return curr;
      const next = curr.future[0];
      const newFuture = curr.future.slice(1);
      return {
        past: [...curr.past, curr.present],
        present: next,
        future: newFuture,
        draft: null,
        readOnly: false,
      };
    });
  }, []);

  const canUndo = history.past.length > 0 && !isPreviewing;
  const canRedo = history.future.length > 0 && !isPreviewing;

  // Frame commands. Selection is not an undo step, but is restored by undo.
  const selectFrame = useCallback((frameId: string) => {
    setHistory((curr) =>
      curr.present.selectedFrameId === frameId ||
      !curr.present.sequence.frames.some((f) => f.id === frameId)
        ? curr
        : {
            ...curr,
            present: { ...curr.present, selectedFrameId: frameId },
            draft: null,
          },
    );
    setSelectedId(null);
    setSelectedType(null);
  }, []);

  const addFrame = useCallback(() => {
    setHistory((curr) => {
      const result = duplicateFrame(
        curr.present.sequence,
        curr.present.selectedFrameId,
      );
      return result
        ? commit(curr, {
            sequence: result.seq,
            selectedFrameId: result.frameId,
          })
        : curr;
    });
  }, []);

  const deleteFrame = useCallback((frameId: string) => {
    setHistory((curr) => {
      const result = deleteFrameCommand(curr.present.sequence, frameId);
      return result
        ? commit(curr, {
            sequence: result.seq,
            selectedFrameId: result.frameId,
          })
        : curr;
    });
  }, []);

  const moveFrame = useCallback((frameId: string, toIndex: number) => {
    setHistory((curr) => {
      const sequence = moveFrameCommand(
        curr.present.sequence,
        frameId,
        toIndex,
      );
      return sequence === curr.present.sequence
        ? curr
        : commit(curr, { ...curr.present, sequence });
    });
  }, []);

  /** Bends (or straightens with `null`) an entity's move out of `frameId`; one undo step. */
  const setPathControl = useCallback(
    (frameId: string, entityId: string, control: Point | null) => {
      setHistory((curr) => {
        const sequence = setPathControlCommand(
          curr.present.sequence,
          frameId,
          entityId,
          control,
        );
        return sequence === curr.present.sequence
          ? curr
          : commit(curr, { ...curr.present, sequence });
      });
    },
    [],
  );

  /** Copies an equipment item from the selected frame into every frame; one undo step. Returns false at the equipment limit. */
  const copyEquipmentToAllFrames = useCallback(
    (equipmentId: string) => {
      if (
        copyEquipmentToAllFramesCommand(
          present.sequence,
          present.selectedFrameId,
          equipmentId,
        ) === null
      ) {
        return false;
      }
      setHistory((curr) => {
        const sequence = copyEquipmentToAllFramesCommand(
          curr.present.sequence,
          curr.present.selectedFrameId,
          equipmentId,
        );
        return sequence === null || sequence === curr.present.sequence
          ? curr
          : commit(curr, { ...curr.present, sequence });
      });
      return true;
    },
    [present],
  );

  /** Removes an equipment item from every frame; one undo step. */
  const removeEquipmentFromAllFrames = useCallback((equipmentId: string) => {
    setHistory((curr) => {
      const sequence = removeEquipmentFromAllFramesCommand(
        curr.present.sequence,
        equipmentId,
      );
      return sequence === curr.present.sequence
        ? curr
        : commit(curr, { ...curr.present, sequence });
    });
    setSelectedId(null);
    setSelectedType(null);
  }, []);

  const renameFrame = useCallback((frameId: string, title: string) => {
    setHistory((curr) =>
      commit(curr, {
        ...curr.present,
        sequence: renameFrameCommand(curr.present.sequence, frameId, title),
      }),
    );
  }, []);

  /** Returns an error message when the timing is outside the allowed limits. */
  const setFrameTiming = useCallback(
    (frameId: string, timing: { holdMs?: number; durationMs?: number }) => {
      const result = setFrameTimingCommand(present.sequence, frameId, timing);
      if (!result.ok) return result.error;
      setHistory((curr) => {
        const next = setFrameTimingCommand(
          curr.present.sequence,
          frameId,
          timing,
        );
        return next.ok
          ? commit(curr, { ...curr.present, sequence: next.value })
          : curr;
      });
      return null;
    },
    [present.sequence],
  );

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
    track("drawings_cleared");
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
    if (previewRef.current) return;
    track("board_reset", { match_format: matchFormat, pitch_type: pitchType });
    const fresh = createBaseState(pitchType, matchFormat, halfPitchTeam);
    replaceSequence(sequenceFromBoard(fresh));
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
  }, [pitchType, matchFormat, halfPitchTeam, replaceSequence]);

  // Replace the whole document with an imported project as one undoable step
  const importProject = useCallback(
    (project: ImportedProject) => {
      if (previewRef.current) return;
      if (project.settings) {
        setPitchType(project.settings.pitchType);
        setMatchFormat(project.settings.matchFormat);
        setHalfPitchTeam(project.settings.halfPitchTeam);
        setSelectedFormations(project.settings.selectedFormations);
      }
      replaceSequence(project.sequence);
      setSelectedId(null);
      setSelectedType(null);
    },
    [replaceSequence],
  );

  // Load Formation. Returns false when it cannot be applied.
  const loadFormation = useCallback(
    (formation: FormationPreset, team: "A" | "B"): boolean => {
      if (previewRef.current) return false;
      const isTeamA = team === "A";
      const isHalf = pitchType === "half";
      const slotPosition = (p: { x: number; y: number }) =>
        isHalf
          ? toHalfPitchPosition(p.x, p.y)
          : isTeamA
            ? { x: p.x, y: p.y }
            : mirrorForTeamB({ x: p.x, y: p.y });
      // Half pitch holds a single team, so both squads are replaced there.
      const isInTeam = (p: Player) =>
        isHalf ? p.team === "A" || p.team === "B" : p.team === team;

      // Animated boards keep player identities so every frame still refers to them.
      let moved: Map<string, Player> | null = null;
      if (isAnimated) {
        const assigned = assignFormationSlots(
          state.players.filter(isInTeam),
          formation.players.map((p) => ({
            ...slotPosition(p),
            isGoalkeeper: p.isGoalkeeper,
          })),
        );
        if (!assigned) return false;
        moved = new Map(assigned.map((p) => [p.id, p]));
      }

      track("formation_applied", {
        formation: formation.id,
        team,
        match_format: matchFormat,
      });
      setSelectedFormations((prev) => ({
        ...prev,
        [matchFormat]: {
          ...prev[matchFormat],
          [isTeamA ? "teamA" : "teamB"]: formation.id,
        },
      }));

      if (moved) {
        const byId = moved;
        pushState((prev) => ({
          ...prev,
          players: prev.players.map((p) => byId.get(p.id) ?? p),
        }));
        return true;
      }

      pushState((prev) => {
        const color = isTeamA
          ? TEAM_COLORS.teamA.primary
          : TEAM_COLORS.teamB.primary;
        const gkColor = isTeamA ? TEAM_COLORS.teamA.gk : TEAM_COLORS.teamB.gk;
        const facing = isHalf ? 90 : isTeamA ? 0 : 180;
        const idPrefix = createId(`player-${team.toLowerCase()}`);

        const newPlayers: Player[] = formation.players.map((p, idx) => {
          const pos = slotPosition(p);
          return {
            id: `${idPrefix}-${idx}`,
            team,
            number: p.number,
            name: p.name,
            x: pos.x,
            y: pos.y,
            color: p.isGoalkeeper ? gkColor : color,
            textColor: "#ffffff",
            isGoalkeeper: p.isGoalkeeper,
            radius: 17,
            facingAngle: facing,
            showVisionCone: false,
          };
        });

        return {
          ...prev,
          players: [...prev.players.filter((p) => !isInTeam(p)), ...newPlayers],
        };
      });
      return true;
    },
    [matchFormat, pitchType, pushState, isAnimated, state.players],
  );

  // Layout changes regenerate players, so they are locked while animated.
  const switchFormat = useCallback(
    (format: MatchFormat) => {
      if (isAnimated || previewRef.current) return;
      track("match_format_changed", { match_format: format });
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
            players: generateHalfPitchPlayers(format, halfPitchTeam),
            balls: [{ id: createId("ball"), x: 525, y: 480, size: 11 }],
            title: `Half Pitch Training - ${format}`,
          };
        }
        if (pitchType === "blank") {
          return {
            ...prev,
            players: [],
            balls: [],
            title: `Drill / Practice - ${format}`,
          };
        }
        // Full pitch
        return {
          ...prev,
          players: generateFullPitchPlayers(format),
          balls: [{ id: createId("ball"), x: 525, y: 340, size: 11 }],
          title: `Match Tactics - ${format}`,
        };
      });
      setSelectedId(null);
      setSelectedType(null);
    },
    [pitchType, pushState, halfPitchTeam, isAnimated],
  );

  // Switch Pitch Layout (Full Pitch, Half Pitch, Just Grass)
  // Re-seeds the default setup for the new layout, but only while the board is
  // still untouched, so user work is never discarded.
  const switchPitchType = useCallback(
    (type: PitchType) => {
      if (type === pitchType || isAnimated || previewRef.current) return;
      track("pitch_layout_changed", { pitch_type: type });
      setPitchType(type);

      const prevBase = createBaseState(pitchType, matchFormat, halfPitchTeam);
      if (boardSignature(state) !== boardSignature(prevBase)) return;

      const nextBase = createBaseState(type, matchFormat, halfPitchTeam);
      // Not pushed to history: the layout itself isn't undoable, so an entry here
      // would let undo restore the old layout's players onto the new pitch.
      setPresentState((prev) => ({
        ...nextBase,
        title: prev.title === prevBase.title ? nextBase.title : prev.title,
        notes: prev.notes === prevBase.notes ? nextBase.notes : prev.notes,
      }));
      setSelectedId(null);
      setSelectedType(null);
    },
    [pitchType, matchFormat, halfPitchTeam, state, setPresentState, isAnimated],
  );

  // Swap which team is set up on the half pitch. The half pitch only ever holds
  // one team, so the existing squad is recoloured in place rather than replaced.
  const switchHalfPitchTeam = useCallback(
    (team: "A" | "B") => {
      if (team === halfPitchTeam || isAnimated || previewRef.current) return;
      setHalfPitchTeam(team);
      if (pitchType !== "half") return;

      const primary =
        team === "A" ? TEAM_COLORS.teamA.primary : TEAM_COLORS.teamB.primary;
      const gk = team === "A" ? TEAM_COLORS.teamA.gk : TEAM_COLORS.teamB.gk;

      setPresentState((prev) => ({
        ...prev,
        players: prev.players.map((p) =>
          p.team === "A" || p.team === "B"
            ? { ...p, team, color: p.isGoalkeeper ? gk : primary }
            : p,
        ),
      }));
    },
    [halfPitchTeam, pitchType, setPresentState, isAnimated],
  );

  const toggleTeamVisibility = useCallback(
    (team: "A" | "B") => {
      setHiddenTeams((prev) => ({ ...prev, [team]: !prev[team] }));
      // Keep a hidden player from staying selected in the properties panel.
      const selected = state.players.find((p) => p.id === selectedId);
      if (selected?.team === team) {
        setSelectedId(null);
        setSelectedType(null);
      }
    },
    [state.players, selectedId],
  );

  return {
    state,
    pushState,
    beginDrag,
    updateDrag,
    commitDrag,
    cancelDrag,
    undo,
    redo,
    canUndo,
    canRedo,
    activeTool,
    setActiveTool,
    matchFormat,
    isRestoredFromCache,
    setIsRestoredFromCache,
    selectedFormationA: selectedFormations[matchFormat]?.teamA ?? null,
    selectedFormationB: selectedFormations[matchFormat]?.teamB ?? null,
    selectedFormations,
    showBuildOutLines,
    setShowBuildOutLines,
    switchFormat,
    switchPitchType,
    halfPitchTeam,
    switchHalfPitchTeam,
    hiddenTeams,
    toggleTeamVisibility,
    selectedId,
    setSelectedId,
    selectedType,
    setSelectedType,
    grassStyle,
    setGrassStyle,
    pitchType,
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
    showPreviousFrame,
    setShowPreviousFrame,
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
    importProject,
    frames,
    selectedFrameId,
    isAnimated,
    selectFrame,
    addFrame,
    deleteFrame,
    moveFrame,
    renameFrame,
    setFrameTiming,
    setPathControl,
    copyEquipmentToAllFrames,
    removeEquipmentFromAllFrames,
    hasDraft,
    isPreviewing,
    setPreviewing,
    settings,
    projectDocument,
    saveStatus,
    retrySave,
    storageProblem,
    discardStoredData,
  };
}

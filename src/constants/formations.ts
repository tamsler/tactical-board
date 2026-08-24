import type { FormationPreset } from "../types/tactics";

export const PITCH_WIDTH = 1050;
export const PITCH_HEIGHT = 680;

// Standard 11v11 Formations for Team A (defending left, attacking right)
export const FORMATIONS_11V11_TEAM_A: FormationPreset[] = [
  {
    id: "4-3-3",
    name: "4-3-3 Attacking",
    system: "4-3-3",
    players: [
      { number: "1", name: "GK", x: 80, y: 340, isGoalkeeper: true },
      { number: "2", name: "RB", x: 260, y: 550 },
      { number: "4", name: "CB", x: 220, y: 420 },
      { number: "5", name: "CB", x: 220, y: 260 },
      { number: "3", name: "LB", x: 260, y: 130 },
      { number: "6", name: "DM", x: 360, y: 340 },
      { number: "8", name: "CM", x: 440, y: 460 },
      { number: "10", name: "AM", x: 440, y: 220 },
      { number: "7", name: "RW", x: 500, y: 550 },
      { number: "9", name: "ST", x: 500, y: 340 },
      { number: "11", name: "LW", x: 500, y: 130 },
    ],
  },
  {
    id: "4-2-3-1",
    name: "4-2-3-1 Wide",
    system: "4-2-3-1",
    players: [
      { number: "1", name: "GK", x: 80, y: 340, isGoalkeeper: true },
      { number: "2", name: "RB", x: 250, y: 550 },
      { number: "4", name: "CB", x: 210, y: 420 },
      { number: "5", name: "CB", x: 210, y: 260 },
      { number: "3", name: "LB", x: 250, y: 130 },
      { number: "6", name: "DM", x: 340, y: 400 },
      { number: "8", name: "DM", x: 340, y: 280 },
      { number: "7", name: "RM", x: 460, y: 540 },
      { number: "10", name: "CAM", x: 450, y: 340 },
      { number: "11", name: "LM", x: 460, y: 140 },
      { number: "9", name: "ST", x: 500, y: 340 },
    ],
  },
  {
    id: "4-4-2",
    name: "4-4-2 Classic",
    system: "4-4-2",
    players: [
      { number: "1", name: "GK", x: 80, y: 340, isGoalkeeper: true },
      { number: "2", name: "RB", x: 250, y: 550 },
      { number: "4", name: "CB", x: 220, y: 420 },
      { number: "5", name: "CB", x: 220, y: 260 },
      { number: "3", name: "LB", x: 250, y: 130 },
      { number: "7", name: "RM", x: 380, y: 550 },
      { number: "8", name: "CM", x: 360, y: 400 },
      { number: "6", name: "CM", x: 360, y: 280 },
      { number: "11", name: "LM", x: 380, y: 130 },
      { number: "9", name: "ST", x: 490, y: 390 },
      { number: "10", name: "ST", x: 490, y: 290 },
    ],
  },
  {
    id: "3-5-2",
    name: "3-5-2 Wingbacks",
    system: "3-5-2",
    players: [
      { number: "1", name: "GK", x: 80, y: 340, isGoalkeeper: true },
      { number: "4", name: "RCB", x: 220, y: 470 },
      { number: "5", name: "CB", x: 200, y: 340 },
      { number: "6", name: "LCB", x: 220, y: 210 },
      { number: "2", name: "RWB", x: 370, y: 570 },
      { number: "8", name: "CM", x: 350, y: 420 },
      { number: "10", name: "CAM", x: 420, y: 340 },
      { number: "7", name: "CM", x: 350, y: 260 },
      { number: "3", name: "LWB", x: 370, y: 110 },
      { number: "9", name: "ST", x: 490, y: 400 },
      { number: "11", name: "ST", x: 490, y: 280 },
    ],
  },
  {
    id: "3-4-3",
    name: "3-4-3 Diamond / High Press",
    system: "3-4-3",
    players: [
      { number: "1", name: "GK", x: 80, y: 340, isGoalkeeper: true },
      { number: "4", name: "RCB", x: 220, y: 480 },
      { number: "5", name: "CB", x: 200, y: 340 },
      { number: "6", name: "LCB", x: 220, y: 200 },
      { number: "2", name: "RM", x: 370, y: 550 },
      { number: "8", name: "CM", x: 360, y: 400 },
      { number: "10", name: "CM", x: 360, y: 280 },
      { number: "3", name: "LM", x: 370, y: 130 },
      { number: "7", name: "RW", x: 490, y: 520 },
      { number: "9", name: "ST", x: 500, y: 340 },
      { number: "11", name: "LW", x: 490, y: 160 },
    ],
  },
  {
    id: "5-3-2",
    name: "5-3-2 Defensive Solid",
    system: "5-3-2",
    players: [
      { number: "1", name: "GK", x: 80, y: 340, isGoalkeeper: true },
      { number: "2", name: "RWB", x: 260, y: 570 },
      { number: "4", name: "RCB", x: 200, y: 450 },
      { number: "5", name: "CB", x: 180, y: 340 },
      { number: "6", name: "LCB", x: 200, y: 230 },
      { number: "3", name: "LWB", x: 260, y: 110 },
      { number: "7", name: "RCM", x: 360, y: 450 },
      { number: "8", name: "CM", x: 340, y: 340 },
      { number: "10", name: "LCM", x: 360, y: 230 },
      { number: "9", name: "ST", x: 480, y: 400 },
      { number: "11", name: "ST", x: 480, y: 280 },
    ],
  },
];

// Standard 9v9 Formations for Team A (U11-U12 Youth Soccer)
export const FORMATIONS_9V9_TEAM_A: FormationPreset[] = [
  {
    id: "3-2-3",
    name: "3-2-3 (Attacking 9v9)",
    system: "3-2-3",
    players: [
      { number: "1", name: "GK", x: 90, y: 340, isGoalkeeper: true },
      { number: "2", name: "RB", x: 250, y: 530 },
      { number: "4", name: "CB", x: 220, y: 340 },
      { number: "3", name: "LB", x: 250, y: 150 },
      { number: "6", name: "CM", x: 360, y: 420 },
      { number: "8", name: "CM", x: 360, y: 260 },
      { number: "7", name: "RW", x: 480, y: 530 },
      { number: "9", name: "ST", x: 490, y: 340 },
      { number: "11", name: "LW", x: 480, y: 150 },
    ],
  },
  {
    id: "3-3-2",
    name: "3-3-2 (Balanced 9v9)",
    system: "3-3-2",
    players: [
      { number: "1", name: "GK", x: 90, y: 340, isGoalkeeper: true },
      { number: "2", name: "RB", x: 250, y: 530 },
      { number: "4", name: "CB", x: 220, y: 340 },
      { number: "3", name: "LB", x: 250, y: 150 },
      { number: "7", name: "RM", x: 370, y: 520 },
      { number: "8", name: "CM", x: 360, y: 340 },
      { number: "11", name: "LM", x: 370, y: 160 },
      { number: "9", name: "ST", x: 490, y: 400 },
      { number: "10", name: "ST", x: 490, y: 280 },
    ],
  },
  {
    id: "4-3-1",
    name: "4-3-1 (Solid Backline)",
    system: "4-3-1",
    players: [
      { number: "1", name: "GK", x: 90, y: 340, isGoalkeeper: true },
      { number: "2", name: "RB", x: 250, y: 540 },
      { number: "4", name: "CB", x: 210, y: 410 },
      { number: "5", name: "CB", x: 210, y: 270 },
      { number: "3", name: "LB", x: 250, y: 140 },
      { number: "7", name: "RM", x: 370, y: 500 },
      { number: "8", name: "CM", x: 360, y: 340 },
      { number: "11", name: "LM", x: 370, y: 180 },
      { number: "9", name: "ST", x: 490, y: 340 },
    ],
  },
  {
    id: "3-4-1",
    name: "3-4-1 (Midfield Dominance)",
    system: "3-4-1",
    players: [
      { number: "1", name: "GK", x: 90, y: 340, isGoalkeeper: true },
      { number: "4", name: "RCB", x: 230, y: 490 },
      { number: "5", name: "CB", x: 210, y: 340 },
      { number: "6", name: "LCB", x: 230, y: 190 },
      { number: "2", name: "RM", x: 360, y: 540 },
      { number: "8", name: "CM", x: 350, y: 400 },
      { number: "10", name: "CM", x: 350, y: 280 },
      { number: "3", name: "LM", x: 360, y: 140 },
      { number: "9", name: "ST", x: 490, y: 340 },
    ],
  },
  {
    id: "2-3-3",
    name: "2-3-3 (High Press 9v9)",
    system: "2-3-3",
    players: [
      { number: "1", name: "GK", x: 90, y: 340, isGoalkeeper: true },
      { number: "4", name: "RCB", x: 220, y: 440 },
      { number: "5", name: "LCB", x: 220, y: 240 },
      { number: "7", name: "RM", x: 340, y: 530 },
      { number: "8", name: "CM", x: 330, y: 340 },
      { number: "11", name: "LM", x: 340, y: 150 },
      { number: "10", name: "RW", x: 480, y: 520 },
      { number: "9", name: "ST", x: 490, y: 340 },
      { number: "17", name: "LW", x: 480, y: 160 },
    ],
  },
];

// Standard 7v7 Formations for Team A (U9-U10 Youth Soccer with Build Out Lines)
export const FORMATIONS_7V7_TEAM_A: FormationPreset[] = [
  {
    id: "2-3-1",
    name: "2-3-1 (Standard US Youth 7v7)",
    system: "2-3-1",
    players: [
      { number: "1", name: "GK", x: 90, y: 340, isGoalkeeper: true },
      { number: "2", name: "RD", x: 240, y: 470 },
      { number: "3", name: "LD", x: 240, y: 210 },
      { number: "7", name: "RM", x: 360, y: 530 },
      { number: "8", name: "CM", x: 350, y: 340 },
      { number: "11", name: "LM", x: 360, y: 150 },
      { number: "9", name: "ST", x: 480, y: 340 },
    ],
  },
  {
    id: "3-2-1",
    name: "3-2-1 (Defensive & Wingbacks)",
    system: "3-2-1",
    players: [
      { number: "1", name: "GK", x: 90, y: 340, isGoalkeeper: true },
      { number: "2", name: "RWB", x: 250, y: 520 },
      { number: "4", name: "CB", x: 220, y: 340 },
      { number: "3", name: "LWB", x: 250, y: 160 },
      { number: "8", name: "CM", x: 370, y: 420 },
      { number: "10", name: "CM", x: 370, y: 260 },
      { number: "9", name: "ST", x: 480, y: 340 },
    ],
  },
  {
    id: "1-3-2",
    name: "1-3-2 (Attacking Duo)",
    system: "1-3-2",
    players: [
      { number: "1", name: "GK", x: 90, y: 340, isGoalkeeper: true },
      { number: "4", name: "CB", x: 220, y: 340 },
      { number: "7", name: "RM", x: 340, y: 520 },
      { number: "8", name: "CM", x: 330, y: 340 },
      { number: "11", name: "LM", x: 340, y: 160 },
      { number: "9", name: "ST", x: 480, y: 420 },
      { number: "10", name: "ST", x: 480, y: 260 },
    ],
  },
  {
    id: "2-2-2",
    name: "2-2-2 (Box / Diamond Dynamic)",
    system: "2-2-2",
    players: [
      { number: "1", name: "GK", x: 90, y: 340, isGoalkeeper: true },
      { number: "2", name: "RD", x: 240, y: 460 },
      { number: "3", name: "LD", x: 240, y: 220 },
      { number: "8", name: "RCM", x: 350, y: 460 },
      { number: "6", name: "LCM", x: 350, y: 220 },
      { number: "9", name: "RST", x: 480, y: 460 },
      { number: "10", name: "LST", x: 480, y: 220 },
    ],
  },
  {
    id: "3-1-2",
    name: "3-1-2 (Anchor Midfield)",
    system: "3-1-2",
    players: [
      { number: "1", name: "GK", x: 90, y: 340, isGoalkeeper: true },
      { number: "2", name: "RB", x: 240, y: 510 },
      { number: "4", name: "CB", x: 210, y: 340 },
      { number: "3", name: "LB", x: 240, y: 170 },
      { number: "8", name: "DM", x: 340, y: 340 },
      { number: "9", name: "ST", x: 480, y: 410 },
      { number: "10", name: "ST", x: 480, y: 270 },
    ],
  },
];

// Backward-compatible alias
export const FORMATIONS_TEAM_A = FORMATIONS_11V11_TEAM_A;

// Helper to mirror formation for Team B (defending right, attacking left)
export function getMirroredFormationForTeamB(
  formation: FormationPreset,
): FormationPreset {
  return {
    id: `${formation.id}-team-b`,
    name: formation.name,
    system: formation.system,
    players: formation.players.map((p) => ({
      ...p,
      x: PITCH_WIDTH - p.x,
      // keep y coordinate
    })),
  };
}

export const TEAM_COLORS = {
  teamA: {
    primary: "#ef4444", // Red
    secondary: "#ffffff",
    gk: "#eab308", // Yellow GK
  },
  teamB: {
    primary: "#3b82f6", // Blue
    secondary: "#ffffff",
    gk: "#10b981", // Green GK
  },
  neutral: {
    primary: "#a855f7", // Purple
    secondary: "#ffffff",
    gk: "#f97316",
  },
};

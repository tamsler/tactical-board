export type ToolType =
  | "select"
  | "add-player-a"
  | "add-player-b"
  | "add-player-gk-a"
  | "add-player-gk-b"
  | "add-player-c"
  | "add-ball"
  | "add-cone"
  | "add-mannequin"
  | "add-mini-goal"
  | "line-run" // Straight player run (solid with arrow)
  | "line-pass" // Ball pass (dashed with arrow)
  | "line-dribble" // Dribble (wavy/squiggly with arrow)
  | "line-curve" // Curved pass/run with quadratic bézier control
  | "line-block" // Block / screen (solid with perpendicular end bar)
  | "draw-freehand" // Freehand pen
  | "shape-rect" // Zone rectangle
  | "shape-circle" // Zone circle
  | "text" // Text annotation
  | "eraser"; // Quick erase

export type PitchType = "full" | "half" | "blank";

export type MatchFormat = "11v11" | "9v9" | "7v7";

export type GrassStyle =
  | "stripes"
  | "grid"
  | "plain"
  | "slate"
  | "blueprint"
  | "indoor";

export interface Point {
  x: number; // 0 to 100 percentage or coordinate
  y: number;
}

export type TeamSide = "A" | "B" | "neutral" | "custom";

export interface Player {
  id: string;
  team: TeamSide;
  number: string;
  name?: string;
  x: number; // 0 to 1000 normalized coordinate system
  y: number; // 0 to 650 normalized coordinate system
  color: string;
  textColor: string;
  isGoalkeeper?: boolean;
  radius?: number;
  facingAngle?: number; // 0-360 degrees
  showVisionCone?: boolean;
}

export interface Ball {
  id: string;
  x: number;
  y: number;
  size?: number;
  rotation?: number;
}

export type EquipmentType =
  | "cone-orange"
  | "cone-yellow"
  | "cone-blue"
  | "mannequin"
  | "mini-goal"
  | "ladder"
  | "pole";

export interface Equipment {
  id: string;
  type: EquipmentType;
  x: number;
  y: number;
  rotation?: number;
  scale?: number;
}

export type LineStyle = "solid" | "dashed" | "dotted" | "wavy";
export type ArrowHead = "none" | "arrow" | "t-bar" | "ball" | "double-arrow";

export interface DrawingLine {
  id: string;
  type: "straight" | "pass" | "dribble" | "curve" | "block" | "freehand";
  points: Point[]; // for straight/curve: [start, (control), end], for freehand: [p1, p2, ...]
  controlPoint?: Point; // for quadratic bezier
  color: string;
  width: number;
  style: LineStyle;
  arrowStart?: ArrowHead;
  arrowEnd?: ArrowHead;
  label?: string;
}

export interface TacticalShape {
  id: string;
  type: "rectangle" | "circle" | "polygon";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  fillOpacity: number;
  strokeColor: string;
  strokeWidth: number;
  label?: string;
}

export interface TextAnnotation {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
  bgColor?: string;
  bgOpacity?: number;
  isBold?: boolean;
  isItalic?: boolean;
  align?: "left" | "center" | "right";
  borderStyle?: "none" | "solid" | "dashed";
  borderColor?: string;
}

export interface TacticFrame {
  id: string;
  title: string;
  players: Player[];
  balls: Ball[];
  equipments: Equipment[];
  lines: DrawingLine[];
  shapes: TacticalShape[];
  texts: TextAnnotation[];
  notes?: string;
}

export interface FormationPlayerPreset {
  number: string;
  name: string;
  x: number; // 0 to 1000
  y: number; // 0 to 650
  isGoalkeeper?: boolean;
}

export interface FormationPreset {
  id: string;
  name: string;
  system: string; // e.g. "4-3-3"
  players: FormationPlayerPreset[];
}

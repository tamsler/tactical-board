# Tactical Board: core board specification

Behavioural specification of the static tactical board, as of v1.5.0. It
describes what the app does *without* animation frames, so changes can be
checked against it. Animation, playback, sharing, file Save/Open and video
export are specified in [animation.md](animation.md); where the two overlap
(state, storage, import/export), this document describes single-frame
behaviour and links there for the rest.

Values in this document come from the source. When code and spec disagree,
treat the difference as a bug in one of them and resolve it explicitly. Record
user-visible changes in [CHANGELOG.md](../../CHANGELOG.md).

## Source map

| Area | Files |
|---|---|
| Composition | `src/App.tsx` |
| State, history, commands | `src/hooks/useTacticsState.ts` |
| Types | `src/types/tactics.ts` |
| Pitch rendering | `src/components/Pitch/SoccerPitch.tsx` |
| Board interaction | `src/components/Pitch/TacticalBoard.tsx` |
| Entities | `src/components/Pitch/PitchPlayer.tsx`, `PitchBall.tsx`, `PitchEquipment.tsx`, `PitchDrawings.tsx` |
| Toolbars | `src/components/Toolbar/TopHeader.tsx`, `ToolSelector.tsx`, `BottomQuickBar.tsx` |
| Sidebar | `src/components/Sidebar/FormationsPanel.tsx`, `PropertiesPanel.tsx` |
| Help/About | `src/components/Modal/HelpModal.tsx`, `src/constants/appInfo.ts` |
| Constants | `src/constants/formations.ts` |
| Utilities | `src/utils/mathUtils.ts`, `textUtils.ts`, `exportUtils.ts`, `analytics.ts`, `id.ts` |
| Storage | `src/animation/storage.ts` |
| SEO/PWA | `index.html`, `public/site.webmanifest`, `public/robots.txt`, `public/sitemap.xml` |

## 1. Layout

- **Header:** logo; editable board title; "Restored" badge; save
  status. Undo, Redo, Clear Lines and Reset buttons. Load, the Save / Export
  menu, Formations (small screens only) and Help.
- **Left rail:** drawing tools, a colour palette and line-width options. The
  tool list scrolls while the pickers stay put.
- **Centre:** the SVG pitch, with zoom controls floating at the bottom right on
  screens narrower than `lg`.
- **Bottom:** the quick-add bar.
- **Right sidebar** with two tabs:
  - **Formations & Pitch:** layout, format, formations, style and overlays,
    notes.
  - **Properties:** the selected item.
- **Sidebar behaviour:**
  - Open by default when the window is at least 768 px wide.
  - Below `md` it is a fixed drawer over a dark backdrop; tapping the backdrop
    or the close button closes it.
  - A handle on the edge collapses and expands it.
  - Selecting an item switches to the Properties tab.
- **Small screens:** Load and Help move into the Save / Export menu.

## 2. Pitch

- **Coordinates:** logical units `PITCH_WIDTH = 1050` by `PITCH_HEIGHT = 680`,
  with the field drawn inside 40 / 30 unit padding. All positions are stored in
  these units, independent of screen size and zoom.
- **Layouts** (`PitchType`):

  | Layout | What is drawn |
  |---|---|
  | `full` (default) | Full field with both halves, penalty and goal areas, centre circle, spots, corner arcs and goals |
  | `half` | Attacking half, goal at the top and halfway line at the bottom |
  | `blank` | Grass only, no markings |

- **Formats** (`MatchFormat`): `11v11` (default), `9v9`, `7v7`.
- **7v7 build-out lines:** when the format is 7v7 and "Show Build-Out Lines" is
  on (the default), lines with a "BOL" badge are drawn. On the full pitch they
  sit at 28% and 72% of the field width; on the half pitch a single line sits
  at 56% of the field height.
- **Grass styles:**
  - Selectable: `stripes` "Classic FIFA Stripes" (default), `plain` "Pure Grass
    Green", `slate` "Dark Tactical Slate", `blueprint` "Tactical Blueprint".
  - The type also includes `grid` and `indoor`, which render as stripes.
- **Overlays** (both off by default):
  - "18 Tactical Zones (Half-Spaces)": dashed yellow lanes and thirds.
  - "Coordinate Fine Grid": a 20-column dashed white grid.
- **"Player Name / Role Labels"** (on by default) shows player names under the
  tokens.

## 3. Entities

| Entity | Key properties |
|---|---|
| Player | `team` A (red `#ef4444`, keeper `#eab308`), B (blue `#3b82f6`, keeper `#eab308`), `neutral` or `custom`; `number`; optional `name`; `color`/`textColor`; `isGoalkeeper`; `radius` (17, or 18 for keepers from the tools); `facingAngle` 0–360 (A 0, B 180, half pitch 90); `showVisionCone` |
| Ball | `size` (default 11), `rotation` |
| Equipment | `cone-orange`, `cone-yellow`, `cone-blue`, `mannequin`, `mini-goal` (plus `ladder` and `pole` in the type, not creatable); `scale` (default 1), `rotation` |
| Line | `straight`, `pass`, `dribble`, `curve`, `block`, `freehand`; style, arrowheads, colour, width, optional label; curves have a `controlPoint` |
| Shape | `rectangle` or `circle` (`polygon` in the type, not creatable); fill opacity, stroke, optional label |
| Text | Multi-line text, font size, colour, background colour and opacity, bold/italic, alignment, border style and colour |

- **Readable numbers:** player text colour is chosen for contrast
  (`getContrastTextColor`), so numbers stay readable on light jerseys.
- **Text formatting:** `**bold**`, `*italic*` and `***bold italic***` render in
  text notes. ⌘/Ctrl+B and ⌘/Ctrl+I toggle them while editing.
- **IDs:** unique within a board and never reused across kinds. New IDs are
  `<kind>-<uuid>`.

## 4. Tools

| Tool | Label | Behaviour |
|---|---|---|
| `select` | Select / Move | Click to select; drag to move; click empty pitch to deselect (and pan when zoomed) |
| `line-run` | Player Run | Solid line with an arrow |
| `line-pass` | Ball Pass | Dashed line with an arrow |
| `line-dribble` | Dribble | Wavy line with an arrow |
| `line-curve` | Curved Run / Pass | Bézier with its control point arched outward by 25% of the length |
| `line-block` | Screen / Block | Solid line with a T-bar end |
| `draw-freehand` | Freehand Pen | Smooth path through the pointer trail |
| `shape-rect` | Tactical Zone | Rectangle, fill opacity 0.2, stroke width 2 |
| `shape-circle` | Zone Circle | Ellipse inside the dragged box |
| `text` | Coaching Notes | Click to place "Coaching Notes" text (13 px, white on `#0f172a` at 0.9, solid `#334155` border); switches back to Select |
| `eraser` | Quick Eraser | Click an item to delete it; the tool stays active |

- **Committing a drawing:** lines and shapes are created on release only if
  the drag is longer than 15 units. Freehand needs more than two points.
- **Drawing colours:** `#facc15` (default), `#ef4444`, `#3b82f6`, `#ffffff`,
  `#10b981`, `#a855f7`, `#f97316`.
- **Line widths:** 2, 3.5 (default) and 6.
- **After use:** drawing tools stay active; only Text switches back to Select.

## 5. Quick-add bar

- **Player chips:** Red, Yellow keeper (Team A, number "1", name "GK"), Purple,
  Green, Blue (Team B), Orange, Cyan, White (dark text) and Black.
  - Numbers count up within the team.
  - Team A players appear around x = 350, Team B around x = 700, and neutral
    players at x = 525, staggered in y.
- **Ball and equipment:** ball, orange cone, yellow cone, mannequin and mini
  goal appear near the centre (525, 340), offset randomly by up to ±40.
- **After adding:** the new item is selected and the tool switches to Select.

## 6. Formations and layout

- **Formation presets** (Team A positions; Team B is mirrored with
  `x → 1050 − x`):

  | Format | Presets | Default A / B |
  |---|---|---|
  | 11v11 | 4-3-3, 4-2-3-1, 4-4-2, 3-5-2, 3-4-3, 5-3-2 | 4-3-3 / 4-4-2 |
  | 9v9 | 3-2-3, 3-3-2, 4-3-1, 3-4-1, 2-3-3 | 3-2-3 / 3-3-2 |
  | 7v7 | 2-3-1, 3-2-1, 1-3-2, 2-2-2, 3-1-2 | 2-3-1 / 3-2-1 |

- **Applying a formation:** replaces that team's players with new ones; on the
  half pitch it replaces both squads. It is undoable, and the selected preset
  is highlighted per format.
- **Half pitch:** shows one team, chosen with "Half Pitch Team" (Red or Blue,
  default Blue), attacking the top goal. Presets are rotated with
  `toHalfPitchPosition`: depth becomes y and lateral position becomes x.
- **Team visibility:** on the full pitch, the eye toggle next to each team
  hides it from view without deleting it, and deselects a hidden player.
- **Default boards** (`createBaseState`):

  | Layout | Players | Ball | Title / notes |
  |---|---|---|---|
  | Full | Both teams in the format's default presets | (525, 340) | "Match Tactics - {format}" / "Tactical analysis and passing progressions." |
  | Half | The chosen team | (525, 480) | "Half Pitch Training - {format}" / "Tactical analysis and defending/attacking phases." |
  | Blank | None | None | "Drill / Practice - {format}" / "Drill notes and coaching points." |

- **Changing format:** regenerates players and balls for the current layout,
  resets that format's selected presets, and updates the title. It is
  undoable.
- **Changing layout:** re-seeds the board with the new layout's default
  *only if the board is still untouched*. `boardSignature` compares positions,
  numbers, names, colours and item counts, ignoring IDs. Otherwise the players
  are kept. Not undoable.
- **Changing the half-pitch team:** recolours the existing squad in place. Not
  undoable.
- **Coaching Notes:** the notes field in the sidebar edits the board notes,
  which appear on the PDF.

## 7. Properties panel

| Selection | Controls |
|---|---|
| Player | Number/label (max 4 characters), name/role, jersey colour palette (text colour set automatically), Goalkeeper Styling, Vision Cone / Body Angle, and a Facing Angle slider (0–360) when the cone is on |
| Ball | Ball Size slider (8–24) |
| Equipment | Size Scale slider (0.5–2.5, step 0.1) and presets Small 0.7, Normal 1.0, Large 1.4, Extra 1.8. On an animated board also "Copy to all frames" and "Remove from all" (see [animation.md](animation.md) §4) |
| Line | Colour (the 7 drawing colours), Line Width slider (2–10, step 0.5), Label Annotation |
| Shape | Fill Opacity slider (0.05–0.8, step 0.05), Zone Title |
| Text | Text editing with the formatting toolbar and shortcuts, Font Size (10–32), colours, Background Opacity (0.2–1.0, step 0.05), alignment and border |

Every panel has a Delete button. With nothing selected it shows "Nothing
Selected".

## 8. Interaction

- **Dragging:** positions round to whole pitch units.
  - Each drag is one undo step, recorded on release.
  - A click without movement records nothing.
  - Pointer cancel or Escape discards the drag.
- **Selected lines:** show endpoint handles, plus a control handle for curves.
- **Selected shapes:** show a resize handle; the minimum size is 25 × 25.
- **Zoom:** 1.0–3.0 in steps of 0.25 with the buttons; 100% resets zoom and
  pan.
  - Pinch-to-zoom and two-finger pan on touch devices.
  - With Select, dragging empty pitch pans while zoomed in above 1.02.
  - Pan is clamped to the pitch.
- **Keyboard** (ignored while typing in inputs, text areas, selects or editable
  text):

  | Key | Action |
  |---|---|
  | V | Select tool |
  | Delete / Backspace | Delete the selected item |
  | Escape | Cancel the drag, deselect, and switch to Select |
  | Ctrl/Cmd+Z | Undo |
  | Ctrl/Cmd+Shift+Z, Ctrl/Cmd+Y | Redo |

  Ctrl/Cmd+S (Save) and Ctrl/Cmd+Shift+S (Save As) work everywhere, including
  while typing; see [animation.md](animation.md).

## 9. History

- **Size:** up to 25 committed actions. A new action clears redo.
- **Undoable:** item edits, additions and deletions, drags, applying
  formations, changing format, clearing drawings, reset, importing, and title
  and notes edits (one step per keystroke).
- **Not undoable:** changing layout and changing the half-pitch team (the
  layout itself isn't undoable), view settings and tool changes.
- **Clear Lines:** removes all lines, shapes and texts; players, balls and
  equipment stay.
- **Reset:** confirms with "Reset the board to standard positions?", then
  replaces the board with the default for the current layout and format and
  resets that format's presets. It can be undone.

## 10. Persistence

- **Autosave:** the board, layout settings (`pitchType`, `matchFormat`,
  `halfPitchTeam`, `selectedFormations`) and view preferences (grass style,
  grid, zones, labels, build-out lines, drawing colour and width, hidden teams)
  save automatically to `localStorage["tactical_board_saved_state_v2"]`.
  - Saving happens ~750 ms after each committed change and when the page is
    hidden or closed.
  - Drags in progress are never written.
- **Migration:** on first load, data under `tactical_board_saved_state_v1` is
  migrated and left untouched.
- **Restored badge:** shown when a saved board was restored.
- **Save errors, unreadable data and the storage format** are covered in
  [animation.md §8 and §13](animation.md).

## 11. Export and import

| Export | Details |
|---|---|
| PNG | Canvas at 2.5× the pitch size on a `#0f172a` background, named from the title (fallback `soccer-tactics.png`) |
| JPEG | Same as PNG, quality 0.95 |
| SVG | Vector clone of the board |
| PDF | A4 landscape. Header with the title (fallback "Soccer Tactical Board Plan") and "Created: {date} \| Tactical Blueprint"; the pitch image on the left; "COACHING NOTES" on the right (fallback "No notes provided for this drill.") with Team Red / Team Blue player counts and ball/equipment counts; footer "Tactical Soccer Board Pro • Exported Tactical Sheet" |
| Project | "Save (Ctrl/Cmd+S)" writes every frame as a `.tacticalboard` file (see [animation.md](animation.md)) |
| JSON | "Current Frame (legacy JSON)" downloads the selected frame as `{title}-frame.json` (fallback `tactics-frame.json`) for older versions |

- **Exports** leave out editor-only overlays (`data-editor-only`). File names
  are the board title in lowercase with punctuation replaced by hyphens.
- **Confirmations** use toasts (`src/utils/toast.ts`,
  `src/components/Toast/Toaster.tsx`): a message such as "Exported
  {filename}", "Saved {filename}" or "Opened {filename}" appears below the
  header, is announced politely to screen readers, can be dismissed, and
  disappears after 4 s (8 s for errors). At most three show at once. There are
  no success pop-up dialogs and no confetti.
- **Load** accepts `.json` (and `.tacticalboard`) files up to 5 MB. Files are
  validated as described in [animation.md §6](animation.md).
  - Invalid files show an error toast: "Invalid tactics file." followed by
    the reason.
  - Valid files replace the board as one undoable step and show "Opened
    {filename}".

## 12. Help and About

- **Keyboard shortcuts:** Select Mode (V), Delete Selected, Undo, Redo,
  Deselect / Cancel.
- **Tool guide:** Move & Drag, Player Runs, Ball Passes, Dribbles, Curved
  Passes, Tactical Zones, Export.
- **About:** Created by Thomas Amsler; version from `package.json`; contact
  info@tacticalboard.app; GitHub Repository and Submit Issue / Bug links.
- **Closing:** Escape or a click outside.

## 13. SEO, PWA and analytics

- **`index.html`:** title "Tactical Soccer Board – Free Online Formation & Set
  Piece Planner", description, canonical `https://tacticalboard.app/`, Open
  Graph and Twitter tags, `WebApplication` JSON-LD, a screen-reader-only
  `<h1>` and `noscript` content.
- **Web app manifest:** standalone, landscape, theme `#0f172a`, icons (SVG,
  192, 512). `.tacticalboard` is registered as a file handler.
- **Analytics:** `track(event, params)` sends GA4 events and does nothing when
  `gtag` is missing. Core events:
  - `export` with `format`
  - `import_tactics`
  - `formation_applied`
  - `match_format_changed`
  - `pitch_layout_changed`
  - `board_reset`
  - `drawings_cleared`
  - `help_opened`

  Events carry counts and identifiers only, never player names or positions.

## 14. Acceptance criteria

| ID | Scenario | Expected |
|---|---|---|
| C1 | First load | Full pitch, 11v11, 22 players (4-3-3 v 4-4-2), 1 ball at the centre, no undo available |
| C2 | Format switch | 9v9 gives 18 players, 7v7 gives 14; the title follows the format; Undo restores the previous board |
| C3 | Layout switch on an untouched board | The new layout's default board and title appear; switching back re-seeds again |
| C4 | Layout switch after an edit | Players and title are kept; the pitch markings change |
| C5 | Formation | Applying a preset repositions that team only (both squads on the half pitch) and highlights the preset |
| C6 | Drag | Moving a player changes one position; one Undo restores it; a click adds no undo step; Escape mid-drag restores it |
| C7 | Drawing | A 10-unit drag with a line tool creates nothing; a 20-unit drag creates one line in the current colour and width |
| C8 | Eraser and Delete | Both remove exactly the targeted item, and Undo restores it |
| C9 | Clear Lines | Lines, shapes and texts are removed; players, balls and equipment remain |
| C10 | Reset | After confirming, the default board is shown; Undo restores the previous board |
| C11 | Persistence | After a reload, the board, layout settings and view preferences are restored (including blank boards) |
| C12 | Export | PNG/JPEG/SVG/PDF contain the pitch and items but no selection handles; the PDF shows the title, notes and counts |
| C13 | Import | A legacy `.json` board loads with identical IDs and positions; malformed files are rejected with a reason and the board is unchanged |
| C14 | Visibility | Hiding Team Red on the full pitch removes its players from the view and exports but keeps them in the saved board |
| C15 | Keyboard | Shortcuts work on the board and are ignored while typing in the title, notes or property fields |

Automated coverage today: `src/hooks/useTacticsState.test.ts` (C1, C2, C6,
C8, C9, C11), `src/utils/mathUtils.test.ts` (line geometry and contrast),
`src/utils/textUtils.test.ts` (text formatting), and
`src/animation/validate.test.ts` (C13).

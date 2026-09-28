# Tactical Board: animated player and ball movements

Product specification and implementation plan · Revised v1.1 · 27 September 2026

**Status:** generally available since app v1.5.0 (28 September 2026); the
feature flag described in §"Feature flag and analytics" was removed then.

Revision of the proposed v1 specification after a source review against commit
`e1c7311ce8da9f06d277477def0b3ad35bd9825b` (local `develop`). Changes from v1
are summarized in [Appendix A](#appendix-a-changes-from-the-v1-proposal).
The static board this builds on is specified in [core-board.md](core-board.md);
user-visible changes are listed in [CHANGELOG.md](../../CHANGELOG.md).

## Summary

Add a frame-based sequence editor to the existing board. A coach arranges the
starting positions, adds a frame, moves players and the ball to their next
positions, and presses Play. Each frame stores a complete board snapshot;
transitions calculate intermediate positions. Animation sampling is a pure
function of the sequence and time, independent of React and the SVG renderer,
so editing, scrubbing, playback and future video export share one calculation.

## Repository grounding

| Source | Finding and implication |
|---|---|
| `src/types/tactics.ts` | Defines `TacticFrame` with complete player, ball, equipment, drawing, shape, text and notes snapshots. Extend it rather than introduce a competing frame model. Multiple balls are already supported. |
| `src/hooks/useTacticsState.ts` | Owns `BoardState`, board-only undo/redo, localStorage persistence and formation/layout commands. It also declares `frames`/`activeFrameIndex` state, but **no component has ever read or written it** (verified in git history). Every real v1 cache therefore contains only the untouched default placeholder frame. |
| `src/components/Pitch/TacticalBoard.tsx` | SVG renderer, pointer dragging, pinch/zoom/pan and window-level keyboard shortcuts. Retain the renderer and isolate sampled positions from editor mutations. |
| `src/constants/formations.ts` | Pitch coordinates are 1050 × 680 (`PITCH_WIDTH`, `PITCH_HEIGHT`). Pointer input is clamped to that area. |
| `src/App.tsx` | Composes header, pitch, bottom quick-add bar and properties/formations sidebar. No timeline or playback controls. |
| `src/components/Toolbar/TopHeader.tsx`, `src/utils/exportUtils.ts` | JSON export saves only `BoardState`; import does `pushState(parsed)` after checking only for `players`/`balls`. Image, SVG and PDF exports clone the rendered SVG. |
| `src/utils/analytics.ts` | Existing gtag-based `track()` with a typed `AnalyticsEvent` union. |
| `package.json` | React 19, TypeScript, Vite, Tailwind, Vitest, React Testing Library, oxlint. No state manager, animation engine or feature-flag system. |

## 1. Outcome and scope

A coach communicates coordinated runs, passes, defensive shifts and set pieces
without drawing every intermediate position. "Frame" means an authored tactical
pose, not one rendered video frame.

| Release | Included |
|---|---|
| v1: sequence editor | Create animation from the current board; add (duplicate), rename, delete and reorder frames with buttons; drag players and ball within a frame; hold and duration controls; linear interpolation; play, pause, restart, seek, loop, speed; numbered frame chips; previous-frame ghosts; undo/redo; save/load and migration |
| v1.1: motion controls | Per-transition easing (`easeInOut`), per-object delayed starts and early arrivals, ball possession/follow, insert frame at playhead, drag-to-reorder, rendered thumbnails, arrow-key nudging of selected entities (curved paths shipped early, §14) |
| Later | GIF export, stand-alone HTML player, cloud storage (§13), animated annotations, multiple clips per board, collaboration, cross-tab conflict detection, narration, templates, substitutions and object lifecycles |

Out of scope for v1: physics, collision avoidance, automatic tactical
decisions, real-time recording. Overlapping players and fast ball movement are
valid coaching diagrams; playback is an illustration, not a simulation.

### Limits

Validation limits (enforced on import, load and edit):

| Item | Limit |
|---|---|
| Frames per sequence | 1–100 |
| Transition duration (`durationMs`) | integer, 100–30,000 ms, default 1,000 |
| Hold (`holdMs`) | integer, 0–30,000 ms, default 0 |
| Total sequence duration | ≤ 600,000 ms (10 minutes) |
| Players / balls per frame | ≤ 100 / ≤ 50 |
| Equipment, lines, shapes, texts per frame | ≤ 500 each |
| Points per freehand line | ≤ 5,000 |
| Title / notes / text annotation / other strings | ≤ 200 / 10,000 / 2,000 / 200 chars |
| Imported file size | ≤ 5 MB |

Performance budget (a target, not a validation rule): 100 frames with 50
moving entities. Durations are stored as integer milliseconds and shown as
seconds with two decimal places.

## 2. Main workflow

1. The coach selects **Animate**. The current board becomes Frame 1. A board
   that already has more than one frame opens its sequence.
2. **Add frame** duplicates the selected frame immediately after itself and
   selects it. Entity IDs stay the same; the new frame gets a new ID.
3. The coach drags players and the ball. Only the selected frame changes.
   Unmoved objects remain stationary during the incoming transition.
4. The coach sets **Move to next frame** (outgoing duration) and optionally
   **Hold this frame** on each frame. The last frame's duration is not used.
5. The coach presses **Play**. All moving entities interpolate simultaneously.
6. The coach pauses or scrubs, selects a frame to edit, and the board autosaves.

Example: Frame 1 has player 6 in possession. Frame 2 places player 8 farther
forward and the ball beside player 8. Over a 1-second transition player 8 runs
and the ball travels simultaneously. A run followed by a pass needs an
intermediate frame in v1; delayed passes within one transition are v1.1.

## 3. Editor and interaction requirements

A timeline sits below the pitch, above the quick-add bar, on desktop, and as a
collapsible horizontally scrolling strip on small screens. A compact playback
bar stays visible when the strip is collapsed. Frame label and timing are
edited in an inspector row inside the timeline panel, next to the frame they
affect, so it stays visible when the sidebar is closed. Frame notes use the
existing Coaching Notes field, which is labelled with the selected frame while
animated.

| Surface | Required controls and behavior |
|---|---|
| Frame strip | Numbered chip per frame (label if set), hold and outgoing duration; selected frame and playhead visually distinct |
| Frame actions | Add, delete, move earlier, move later |
| Playback bar | Play/pause, restart, previous/next frame, seek slider, elapsed/total time, loop, speed |
| Speed | 0.25×, 0.5×, 1×, 1.5×, 2×; default 1×; changes preview rate, not saved durations |
| Pitch overlays | **Show moves** toggle (on by default): previous-frame positions and movement guides with bend handles (§14); faded, non-interactive apart from the handles. Hint "Moves appear from Frame 2" on Frame 1. The UI never says "ghosts", which coaches don't recognise |
| Frame inspector | Frame label, hold, outgoing duration (notes via the Coaching Notes field); outgoing settings shown only when a next frame exists |
| Status | Saving / saved / error, and a distinct preview versus frame-edit state |

Frame titles are optional. An empty title displays as "Frame N" by position,
so numbering stays correct after reorder and delete.

### Modes

- Selecting a frame pauses playback, seeks to the start of that frame's hold
  and enters **edit** mode.
- Scrubbing pauses playback and enters read-only **preview**, including when
  the playhead lands exactly on a frame boundary. Preview shows "Select a frame
  to edit". This prevents an intermediate pose from overwriting a frame.
- Play resumes from the playhead; Play at the end restarts at zero. Restart
  pauses and selects Frame 1.
- Previous/next selects the neighbouring authored frame relative to the
  current sampled segment; within a transition, Previous selects its source and
  Next its target. Unavailable navigation is disabled.
- Document editing is disabled during playback and preview. A one-frame
  sequence with zero hold disables Play and explains "Add a frame to animate".

### Input and accessibility

- Touch uses pointer capture. Pitch panning is suppressed only during an object
  drag. Touch targets are roughly 44 px.
- A single editing guard in the board keyboard handler blocks Delete,
  Backspace, undo/redo and tool shortcuts during playback and preview. Keyboard
  handling ignores events when focus is in `INPUT`, `TEXTAREA`, `SELECT`,
  `contenteditable` or on a `BUTTON` (for Space/Enter).
- Shortcuts when the board owns focus: **Space** play/pause; **,** / **.**
  (and **PageUp** / **PageDown**) previous/next frame; **Escape** cancels an
  active drag, then deselects; existing undo/redo. Arrow keys are reserved for
  v1.1 entity nudging.
- Frame selection, slider time, control names and disabled states are exposed
  to assistive technology. Animation ticks are not announced. No autoplay;
  reduced-motion users get the same explicit Play and frame stepping.

## 4. Frame mutation rules

Frames store full snapshots. Changing Frame 2 never alters Frame 1 or Frame 3.
Undo restores both content and the frame selected before the command. One drag
is one history entry, committed on pointer release; a click without movement
creates no entry; pointer cancellation discards the draft.

Each frame owns its **outgoing** transition (`durationMs`). This removes any
need to reconcile transitions keyed by frame pairs.

| Operation | Semantics |
|---|---|
| Add | Deep-copy the selected frame (content, hold, duration) with a new frame ID and empty title; insert after the selected frame and select it. |
| Delete | Remove the selected frame with its hold and duration. Select the previous frame, or the new first frame. The only frame cannot be deleted. |
| Reorder | Move the frame with its hold and duration. The last frame keeps its (unused) duration so moving it back restores it. |
| Edit a position | Update only that entity in the selected frame. |
| Edit hold / duration | Validate against limits with an inline explanation; in edit mode keep the selected frame and seek to its new start. |
| Edit identity/appearance | Apply to the same ID in every frame (see §6). |
| Add / remove player or ball | Apply to every frame atomically: "Add to all frames" inserts at the same position in each frame; "Remove from all frames". |
| Apply formation | Positions change in the selected frame only, with IDs preserved (see §12). |

Insertion, deletion and reordering change total duration; show a brief
notification with Undo.

Equipment, lines, shapes, texts and notes are per-frame (existing
`TacticFrame` semantics): copied when adding a frame, edited within that frame,
and switched at the destination frame boundary without interpolation. During a
transition the source frame's annotations are shown. Existing run/pass/curve
arrows are not reinterpreted as motion paths. The document title is shared;
the frame inspector edits frame label and notes. Clearing drawings affects the
selected frame only.

Equipment added after frames exist can be applied to the whole animation from
the Properties panel: **Copy to all frames** places the item, as it is in the
selected frame, in every frame (overwriting copies with the same ID, refused
if a frame is at the equipment limit), and **Remove from all** deletes it from
every frame. Each is one undo step. The panel shows how many frames hold the
item exactly as it is in the selected frame.

### Layout lock

Half-pitch mode remaps formations, so it is a different layout. While a
sequence has more than one frame, pitch type, match format and half-pitch team
are locked; the hook guards `switchPitchType`, `switchFormat` and
`switchHalfPitchTeam` centrally, not just in the UI. Grass, grid, zones, labels
and team visibility stay available. Hidden teams remain in frames and in
sampling; visibility only filters rendering. Positions are validated as finite
but not clamped, so legacy boards are preserved exactly.

## 5. Temporal contract

Each frame is held before its outgoing movement. Playback begins at Frame 1's
pose. With `hold[i]` and `duration[i]` from frame `i`:

```
start[0]     = 0
start[i + 1] = start[i] + hold[i] + duration[i]
total        = start[last] + hold[last]
```

- In `[start[i], start[i] + hold[i])` return frame `i` exactly.
- In `[start[i] + hold[i], start[i + 1])` interpolate from frame `i` to `i + 1`.
- Intervals are half-open: at an exact boundary return the destination pose.
- `time >= total` returns the final pose; negative or non-finite time clamps
  to 0. A one-frame, zero-hold sequence returns its pose without division.

For `u = clamp((time - moveStart) / duration, 0, 1)` and v1 linear easing
`p = u`:

```
x = from.x + (to.x - from.x) * p
y = from.y + (to.y - from.y) * p
```

All entities share the transition progress. Identical endpoints stay still.
Boundaries return stored endpoints exactly. Because `duration ≥ 100 ms`,
`start` is strictly increasing, so a binary search finds the segment.

Looping wraps to zero and may jump from the last pose to the first; to make a
smooth loop, the coach duplicates the first pose as the final frame. With
looping off, playback pauses on the final pose.

## 6. TypeScript model

```ts
import type { TacticFrame, PitchType, MatchFormat } from "../types/tactics";

interface AnimationFrame extends TacticFrame {
  holdMs: number;
  durationMs: number; // outgoing transition; unused on the last frame
  paths?: Record<string, Point>; // curve control points for outgoing moves (§14)
}

interface SequenceState {
  title: string;
  frames: AnimationFrame[]; // length >= 1; length > 1 means animated
}

interface DocumentSettings {
  pitchType: PitchType;
  matchFormat: MatchFormat;
  halfPitchTeam: "A" | "B";
  selectedFormations: Record<MatchFormat, { teamA: string | null; teamB: string | null }>;
}

interface TacticsDocument {
  kind: "tactical-board-document";
  schemaVersion: 3; // v2 is read as a document without curves
  title: string;
  settings: DocumentSettings;
  frames: AnimationFrame[];
}

interface PlaybackState {
  status: "paused" | "playing";
  timeMs: number;
  rate: 0.25 | 0.5 | 1 | 1.5 | 2;
  loop: boolean;
}

interface SampledFrame {
  frame: TacticFrame; // interpolated players/balls; source static content
  sourceFrameId: string;
  targetFrameId?: string;
  phase: "hold" | "move" | "end";
  progress: number; // 0..1 within the move phase
}
```

There is no `animationEnabled` flag and no separate sequence version: a
document is animated when it has more than one frame, and the document carries
the only `schemaVersion`.

Settings belong to the document and are exported, but they are not part of
undo history (the current app does not undo layout changes either). Local
preferences are stored separately and not exported: grass style, grid, zones,
player labels, build-out lines, drawing colour and width, hidden teams,
playback rate and loop.

### Entity identity

- Every frame contains the same set of player IDs and the same set of ball
  IDs. Validation rejects documents that violate this; there is no fallback
  for mismatched frames.
- IDs are unique within a frame across all kinds, so an ID never changes kind.
- Match objects by ID, never by array position or shirt number.
- **Per-frame pose properties** — player: `x`, `y`, `facingAngle`,
  `showVisionCone`; ball: `x`, `y`, `rotation`. Only `x`/`y` interpolate;
  the others switch at the destination boundary.
- **Sequence-wide properties** — every other player/ball property (team,
  number, name, colours, goalkeeper flag, radius, ball size). Edits propagate
  to the same ID in every frame.

Coordinates stay in logical pitch units (1050 × 680). Interpolated positions
keep decimals; authored dragging continues to round to integers.

### Validation

Runtime validation (TypeScript assertions are insufficient) for imports, v2
storage and v1 migration:

- supported `kind`/`schemaVersion`; newer versions are rejected, never
  overwritten;
- correct shapes for every field; objects are rebuilt from known fields only;
- finite numbers, known enums, integer durations within limits, aggregate
  limits from §1;
- unique frame IDs; unique entity IDs within each frame; identical player and
  ball ID sets across frames.

Legacy boards: `players` and `balls` arrays are required to recognize a board;
missing `equipments`/`lines`/`shapes`/`texts` normalize to empty arrays and a
missing title/notes to an empty string. Malformed supplied fields fail.

## 7. React and rendering architecture

Retain the SVG renderer and `PitchPlayer`/`PitchBall`. The rendered pose comes
from either the selected frame (plus a temporary drag draft) or the sampler.
The renderer never writes sampled values into frames.

| Module | Responsibility |
|---|---|
| `src/animation/model.ts` | Types, defaults, limits |
| `src/animation/validate.ts` | Runtime validation of boards and documents |
| `src/animation/commands.ts` | Immutable frame and entity mutations, board-edit propagation |
| `src/animation/timeline.ts` | Compile holds and durations into cumulative starts |
| `src/animation/sample.ts` | Pure `(frames, timeline, time) → SampledFrame` |
| `src/animation/playback.ts` | Playback controller: clock, seek, rate, loop; injectable clock |
| `src/animation/migrate.ts` | v1 cache and legacy JSON conversion, document serialization |
| `src/utils/id.ts` | `crypto.randomUUID()`-based IDs with a fallback for insecure contexts |
| `src/components/Animation/FrameTimeline.tsx` | Frame chips, selection and frame actions |
| `src/components/Animation/PlaybackControls.tsx` | Transport and seek |
| `src/components/Animation/FrameInspector.tsx` | Label, hold, duration |
| `src/components/Animation/PreviousFrameGhosts.tsx` | Previous-frame ghosts and movement guides (`data-editor-only`) |

`useTacticsState` keeps its facade. Internally, history holds
`{ sequence, selectedFrameId }` snapshots; `state` (a `BoardState`) is derived
from the selected frame and document title. `pushState(updater)` applies the
updated board to the selected frame and propagates entity additions, removals
and sequence-wide property changes to other frames, so existing call sites
keep working. Dragging uses `beginDrag` / `updateDrag` / `commitDrag` /
`cancelDrag`; the draft lives outside history and is never persisted.

The playback controller exposes `subscribe`/`getSnapshot` for
`useSyncExternalStore` with cached immutable snapshots. Only the moving board
layer subscribes to per-tick updates. One `requestAnimationFrame` loop
computes time from its timestamp:

```
time = anchorTimelineMs + (now - anchorClockMs) * rate
```

Pause, seek and rate changes rebase both anchors. Cleanup cancels outstanding
callbacks; Strict Mode must not create two loops. No CSS transitions on
players. When the tab becomes hidden (Page Visibility API) playback pauses and
stays paused on return. The timeline is compiled after committed edits, not
per tick.

## 8. Persistence, history and compatibility

- History: bounded to 25 committed actions, structural sharing, not
  persisted. Playback, seeking, selection and view toggles create no history.
  New commits clear redo.
- Autosave runs on committed changes only, debounced ~750 ms, flushed on
  `pagehide` / `visibilitychange` (hidden). Playback and scrubbing produce no
  storage writes. Storage is read once on mount, lazily.
- The v2 key `tactical_board_saved_state_v2` stores
  `{ document, selectedFrameId, preferences }`. Read v2 first, otherwise
  migrate v1; the v1 key `tactical_board_saved_state_v1` is left untouched as a
  rollback backup. Migrated v2 data is written only after validation.
- The UI shows saving/saved/error with Retry. On quota failure work stays in
  memory and the user is offered a project JSON download. Invalid or newer v2
  data shows a recovery error and pauses autosave rather than overwriting it.

### Migration

1. **Legacy exported `BoardState` JSON**: validate and create one frame with
   zero hold, retaining title, notes, IDs and content.
2. **v1 cache**: `boardState` becomes Frame 1. The `frames` and
   `activeFrameIndex` fields are ignored (they were never user-editable).
   Settings and preferences carry over.
3. **Blank, ball-only and equipment-only boards** are valid and restored; the
   current `players.length > 0` requirement is removed.
4. **Invalid v1 data** falls back to the default board for the saved layout.

### Import and export

- Project JSON export writes the `TacticsDocument` envelope, which has no
  top-level `players`/`balls`, so old clients reject it instead of loading one
  frame and resaving.
- Import accepts a v2 document or a legacy `BoardState`, validates it, and
  replaces the document as one undoable action. "Export current frame (legacy
  JSON)" is offered for compatibility and labelled as excluding animation.
- PNG/JPEG/SVG/PDF pause at the current sampled pose. Selections, ghosts,
  handles and guides carry `data-editor-only` and are removed from the cloned
  SVG. PDF notes and counts come from the same sampled source frame.

No backend is added. Cross-tab conflict detection is deferred.

## 9. Acceptance criteria

| ID | Scenario | Acceptance condition |
|---|---|---|
| A1 | Convert a static board | Frame 1 matches every player/ball position and identity; survives save/reload |
| A2 | Isolated frame editing | Moving a player in duplicated Frame 2 leaves Frame 1 unchanged; one Undo restores the whole drag |
| A3 | Interpolate a pass | Ball from (200,340) to (800,340) over 1,000 ms is at (500,340) at 500 ms |
| A4 | Hold timing | Hold 500, move 1,000, final hold 250 totals 1,750 ms; boundaries follow §5 |
| A5 | Deterministic seek | Seeking to 700 ms equals sampling playback at 700 ms within tolerance |
| A6 | Playback control | Pause/resume does not jump; rate changes preserve pose; 2× covers 2 s of timeline in 1 s |
| A7 | Frame mutation | Add/delete/reorder carry each frame's hold and duration; Undo restores frames and selection |
| A8 | Boundary cases | Unmoved entities stay still; one-frame/zero-total input has no division errors; non-looping playback ends on the final pose |
| A9 | Coordinate independence | Resize, zoom and pan do not change positions or motion; layouts are retained |
| A10 | Durable editing | Round-trip preserves IDs and timing; malformed/newer files do not replace valid work |
| A11 | Lifecycle | Hidden tab pauses; unmount cancels callbacks; Strict Mode does not double speed |
| A12 | Accessible editing | Frame workflow works by keyboard; no autoplay; drag cancellation works on touch |
| A13 | Entity scope | Adding/removing a player or ball updates all frames atomically; Undo restores them |
| A14 | Regression | Drawing, formations, dragging, static save/load and image export still work |
| A15 | Share link | A link opens the same document (IDs, timing, settings) after confirmation; invalid, oversized or newer links are rejected without changing the board |
| A16 | File save/open | Save writes the project to the chosen file and later saves overwrite it; browsers without file-system access fall back to download/upload |
| A17 | Video export | The exported video's duration equals the sequence length plus the end hold; the pose at time *t* matches the sampler; editor overlays are absent; cancel stops encoding |

Unit tests cover the sampler, timeline boundaries, commands, validation,
migration and the playback controller with an injectable clock. Integration
tests cover drag commit/cancel/undo and autosave behavior. Required gates:
`npm test`, `npm run lint`, `npm run build`, plus a manual touch-device check.
A Playwright suite is optional.

Performance target at the budget: smooth 60 Hz on the reference desktop
(p95 frame work ≤ 16.7 ms), ≥ 30 Hz on a mid-range phone, seek-to-paint
< 100 ms, no accumulated listeners after repeated play/pause.

## 10. Delivery plan

| Phase | Work | Gate |
|---|---|---|
| P0. Static-board fixes | Drag draft with commit/cancel (no storage writes per pointer move, no history entry for a click, real `onPointerCancel`); debounced autosave with flush; read storage once; restore blank boards; validated JSON import; UUID-based IDs; correct coordinate comments | Existing tests pass; new drag/restore/import tests |
| 1. Domain and state | `src/animation/*` model, validation, commands, timeline, sampler, playback controller, migration; hook history becomes `{ sequence, selectedFrameId }` with derived `state`; layout guards; ID-preserving formations when animated | A3–A5, A7–A8, A13 pass; no split board/frame truth |
| 2. Frame editor | Feature flag, Animate entry, frame strip, frame actions, inspector, ghosts, selected-frame dragging | A1–A2; a coach can author a three-frame sequence |
| 3. Playback | React binding for the controller, controls, seek, speed, loop, visibility, sampled rendering, editing guard | A5–A6, A11; no writes during playback |
| 4. Persistence | v2 storage, migration wiring, save status and errors, v2 JSON import/export, export overlay stripping | A10 |
| 4b. Files and sharing | File-system Save/Open with download fallback, share links (§13) | A15–A16 |
| 4c. Video export | MP4/MOV export via WebCodecs (§13) | A17 |
| 5. Hardening | Mobile/keyboard, regression, profiling, help text, rollout | A9, A12, A14 and performance targets |

Estimate: approximately 10–15 engineering days. The first internal vertical
slice follows Phase 2 plus minimal playback.

### Feature flag and analytics

During the beta (1.3.0–1.4.0) the animation UI was hidden unless
`VITE_ENABLE_ANIMATION=true` at build time or the URL contained `?animate=1`.
Since 1.5.0 there is no flag: the Animate button, timeline, file picker,
Ctrl/Cmd+S, project-format Save, "Current Frame (legacy JSON)" and Share Link
are available to everyone, and the original single-board "Save Project File
(JSON)" menu item is gone. Share links drop `?animate=1` from the page URL;
old links that still carry it open normally.

Add to the `AnalyticsEvent` union: `animation_created`,
`animation_frame_added`, `animation_played`, `animation_save_failed`. Events
carry counts only (frames, duration buckets), never player names or
coordinates.

Rollback hides the animation UI while preserving stored sequences; a board
with several frames opens on its selected frame and is never stripped.

## 11. Next-stage movement design

Extensions keep the `sample(time)` contract and add optional fields with
defaults, or bump `schemaVersion` with a migration when semantics change.

- **Easing**: optional `easing: "linear" | "easeInOut"` per frame, with
  `p = 3u² − 2u³`.
- **Motion windows**: per-entity start/end fractions `0 ≤ start < end ≤ 1`.
- **Curved paths**: implemented (§14).
- **Possession**: explicit follow-player versus free-flight intervals; never
  inferred from proximity.
- **Insert at playhead**: split the current hold or transition preserving
  total duration and the original motion function.
- **Video/GIF export**: implemented for MP4/MOV (§13); GIF remains future
  work.

## 12. Repository changes and safeguards

| File | Change |
|---|---|
| `src/types/tactics.ts` | Correct coordinate comments (1050 × 680). |
| `src/hooks/useTacticsState.ts` | Sequence history with derived `state`; drag draft; frame commands; layout guards; debounced commit-only autosave; single storage read; blank-board restore. Remove unused `frames`/`activeFrameIndex` state. |
| `src/components/Pitch/TacticalBoard.tsx` | Drag via `beginDrag`/`updateDrag`/`commitDrag`/`cancelDrag`; sampled render input; editing guard in keyboard handler; editor-only overlay markers. |
| `src/components/Pitch/PitchPlayer.tsx`, `PitchBall.tsx` | Interaction-disabled mode; fractional positions. |
| `src/App.tsx` | Timeline and playback bar; quick-add uses UUID IDs. |
| `src/components/Sidebar/*` | Frame-scoped notes label; disable editing in preview; lock layout controls when animated; "from all frames" delete labels. |
| `src/components/Toolbar/TopHeader.tsx` | Validated import; project JSON export; save status; animation-aware Reset ("Reset entire board and remove animation?" creates a fresh single-frame document as one undoable action). |
| `src/utils/exportUtils.ts` | Document serialization; strip `data-editor-only` from clones. |
| `src/components/Modal/HelpModal.tsx` | Frame workflow, edit scope, timing and shortcuts. |

Safeguards:

- **Formations when animated**: map the team's existing players to formation
  slots — goalkeepers first, then field players in existing order — and update
  positions in the selected frame only, preserving IDs and metadata. A
  player-count mismatch is rejected with an explanation. Static boards keep
  the current regenerate behavior.
- **Layout commands** are guarded in the hook while animated (§4).
- **Entity creation paths** (quick-add bar, canvas tools, eraser, Delete key,
  properties panel, formations) all go through `pushState`, whose propagation
  applies the all-frames policy uniformly.
- **IDs**: existing IDs are preserved; new IDs use `crypto.randomUUID()`.
  Duplicating a frame copies entity IDs and replaces only the frame ID.

## 13. Storage, sharing and video export

### Options considered

| Option | Cost | Backend | Effort | Use |
|---|---|---|---|---|
| Project file download/upload | Free | No | Low | Backups, email, offline |
| File System Access API (`showSaveFilePicker`) | Free | No | Low | Real Save/Open to one file; Chromium only, download fallback elsewhere |
| Share link (document compressed into the URL fragment) | Free | No | Low–medium | Send a play to another coach; the fragment never reaches a server |
| IndexedDB board library | Free | No | Medium | Many boards per device; per-browser and evictable |
| Google Drive (`drive.file` scope) | Free (user's quota) | No | Medium | Cloud storage without running servers; needs an OAuth client |
| Firebase (Auth + Firestore) | Free tier, then usage-based | Managed | Medium | Accounts and sync, quickest |
| Cloudflare (Pages + Workers + R2/D1) | Very low, no egress fees | Yes | Medium–high | Short links, public viewer, accounts |
| AWS (S3 + Cognito + Lambda) | Low, plus egress | Yes | High | Overkill at this scale |

**Decision.** v1 stays serverless: project files, file-system Save/Open and
share links. Google Drive is the first cloud option if users ask for it;
Cloudflare or Firebase only if accounts, short links or cross-device sync
become requirements. Server storage would hold player names, often of minors,
so it needs a privacy policy, deletion and GDPR/COPPA review first.

### Project files and file-system access

- The project file is the `TacticsDocument` JSON saved as `.tacticalboard`
  (MIME `application/vnd.tacticalboard+json`), named from the document title.
  Open and Load also accept `.json`; import detects the format from the
  contents, not the extension. "Current Frame (legacy JSON)" stays `.json`.
- An opened `.json` file is never overwritten: its handle is not kept, so the
  next Save asks for a `.tacticalboard` location.
- The web manifest registers `.tacticalboard` as a file handler; when the site
  is installed as an app (Chrome/Edge desktop), double-clicking a file opens it
  via `launchQueue`. `.json` is deliberately not registered.
- **Save** (Ctrl/Cmd+S) writes to the file handle from the last Open or Save
  As; without one it behaves like Save As. **Save As** (Ctrl/Cmd+Shift+S) uses
  `showSaveFilePicker`; **Open** uses `showOpenFilePicker`. Where the API is
  missing, Save/Save As download the file and Open uses a file input.
- The file handle lives in memory only; after a reload the next Save asks for
  a location again. Save errors (permission denied, disk full) are shown and
  the in-browser autosave is unaffected. Cancelling a picker is not an error.
- Opening a file goes through the same validation and undoable replace as
  import.

### Share links

- Format: `https://tacticalboard.app/#share=1.<payload>` where `payload` is
  base64url of `deflate-raw`-compressed `TacticsDocument` JSON
  (`CompressionStream`). The leading `1` is the link format version.
- The document travels in the fragment, so it is not sent to the server or
  logged by it. Anyone with the link can read the board.
- Opening a link asks "Open the shared board? This replaces your current
  board; you can undo." Accepting imports it as one undoable action and
  removes the fragment with `history.replaceState`. Declining also removes it.
- Decoding rejects links longer than 2 MB, stops decompressing past the 5 MB
  import limit, then runs full document validation. Unknown link versions are
  rejected with an explanation.
- The share dialog shows the link with a Copy button and warns when it is
  longer than 8,000 characters, since some messaging apps truncate long links.

### Video export

- Export menu **Video (MP4)** and **Video (MOV)**, shown when the board has
  more than one frame. MP4 (H.264) is the default: it plays in QuickTime,
  iOS, Android, WhatsApp and browsers. MOV uses the same H.264 stream in a
  QuickTime container.
- Encoding runs in the browser with WebCodecs through `mediabunny`, loaded on
  demand so the main bundle does not grow. Browsers without an H.264 encoder
  are told video export is unsupported.
- Frames are rendered offline, not recorded from the screen: for each output
  frame at 30 fps, sample the sequence at `t = i / 30`, render the pitch and
  sampled entities to SVG markup (`react-dom/server`), draw it to a canvas
  and encode. The pitch layer is rendered once and reused. Output is
  1920 px wide (height rounded to an even number); hidden teams and label
  settings match the board; ghosts, guides and selection never appear.
- The video holds the final pose for an extra 1 s so players do not stop on
  the last frame.
- A dialog shows progress with Cancel; cancelling discards the partial file.
  Playback pauses while exporting.

### Deferred

GIF export, a stand-alone HTML player file, IndexedDB board library, Google
Drive, and any server-side storage.

## 14. Curved moves

A coach can bend any player's or ball's move between two frames, for curved
runs, overlaps and curled passes.

### Interaction

- With **Show moves** on, each moved entity's guide (previous pose → current pose)
  shows a bend handle at its midpoint while editing with the Select tool.
- Dragging the handle bends the guide live; release commits one undo step.
  Dropping it back on the straight line (within 4 pitch units) or
  double-clicking it removes the curve. Escape or pointer cancel discards the
  drag. Handles are hidden during playback, preview and other drags.
- Curved guides are amber; straight guides stay white. Handles and guides are
  `data-editor-only` and never appear in image or video exports.

### Model and semantics

- `AnimationFrame.paths?: Record<entityId, Point>` holds a quadratic Bézier
  control point, in absolute pitch units, for the entity's **outgoing** move
  (frame *i* → *i + 1*). Missing entries are straight. The handle drawn at
  curve parameter 0.5 maps to the control point by
  `c = 2m − (p0 + p1) / 2`.
- Movement along a curve uses arc-length reparameterisation (32-sample
  table), so speed stays constant; endpoints are returned exactly. A curve
  with identical endpoints produces an out-and-back move.
- Control points stay absolute when an endpoint is moved later, so the bend
  changes shape rather than disappearing.
- Paths are kept consistent by the frame commands:
  - duplicating frame *i* moves its curves to the copy (the copy has the same
    pose and now precedes the old target) and clears them on frame *i*;
  - deleting or reordering drops curves on any frame whose next frame
    changed;
  - removing a player or ball removes its curves in every frame.
- Validation accepts control points only for players and balls present in
  that frame, as finite points; keys are stored as own properties so IDs such
  as `__proto__` stay plain data.

### Compatibility

The document schema is now version 3. Version 2 documents, v2 storage and
share links load unchanged (no curves). Builds that only understand version 2
reject v3 files as "created by a newer version" instead of silently dropping
the curves and saving straight moves back.

### Deferred

Facing the direction of travel along a curve, keyboard access to bend
handles, and cubic or multi-point paths.

## Appendix A: changes from the v1 proposal

- Dropped migration of "meaningful" v1 frames, the "Recovered current board"
  frame and the mismatched-entity sampling fallback: the v1 `frames` state was
  never user-facing. Validation now requires identical player/ball ID sets.
- Replaced `FrameTransition[]` keyed by frame pairs with an outgoing
  `durationMs` on each frame; removed transition reconciliation rules.
- Removed `animationEnabled` and the sequence-level `schemaVersion`;
  "animated" means more than one frame.
- Split document settings from local preferences, and kept settings out of
  undo history to match current behavior.
- Resolved the arrow-key conflict: `,`/`.` and PageUp/PageDown navigate frames;
  arrow nudging moves to v1.1. Specified a single editing guard in the board
  keyboard handler.
- Defined the feature-flag mechanism and the analytics events for the existing
  `track()` helper.
- Deferred drag-to-reorder, rendered thumbnails, the easing picker, arrow-key
  nudging, cross-tab detection, raw backup download and the Playwright suite.
- Moved static-board bug fixes into a prerequisite phase (P0).
- Made `facingAngle`/`showVisionCone`/ball `rotation` per-frame pose
  properties, and defined which properties are sequence-wide.
- Replaced the 50-entity validation cap with generous per-collection limits;
  50 moving entities remains a performance budget.
- Empty frame titles display as "Frame N" by position.
- Reduced the estimate to 10–15 engineering days.

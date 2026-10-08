# Proposal

## Why

Every move in an animation runs at constant speed from start to finish, so
players start and stop instantly and playback looks mechanical. The animation
spec already reserves the fix (`docs/specs/animation.md` §11: an optional
per-frame `easing` with `p = 3u² − 2u³`) and it is candidate 1 on the
roadmap. It was never built: the app has no easing code, field or control
today.

The curve used is `p = 6u⁵ − 15u⁴ + 10u³`, not the `3u² − 2u³` that §11
suggested: tried in the app, the suggested curve started and stopped too
abruptly. The chosen one eases in and out more gently over the same duration.

## What Changes

- Each frame gets a setting for how its move to the next frame is paced:
  **Steady speed** (today's behaviour) or **Natural (speeds up, then slows)**, where
  everything accelerates out of the frame and slows into the next one.
- The setting is chosen in the frame inspector, next to "Move to next frame
  (s)". It is hidden on the last frame, which has no outgoing move.
- It applies to every player and ball in that move, on straight and curved
  paths, and takes the same time as before. Only the pacing changes.
- Playback, scrubbing, the image exports of a paused pose and video export
  all show the same eased positions.
- The document format gains an optional frame field,
  `easing: "linear" | "easeInOut"`. A missing field means `"linear"`.
- The document schema version becomes **4**. Version 2 and 3 documents,
  boards in local storage and existing share links open unchanged and play
  exactly as they do now. **BREAKING** for older builds only: a build that
  knows version 3 rejects a version 4 file or link as "created by a newer
  version", as version 2 builds already do for version 3.
- In the timeline, a frame whose move uses Natural pacing shows a small
  marker on its chip, so the coach can see it without selecting the frame.
- The app counts how often the pacing control is changed, as an anonymous
  usage event carrying the chosen value and the frame count only.
- New frames and existing boards stay on Steady speed. Nothing changes for a
  coach until they pick Natural (speeds up, then slows).
- The AI format reference (`docs/agent/`) documents the field and when to use
  it, and one example drill uses it.

**Out of scope**

- Any other curve (ease-in only, ease-out only, custom Béziers) and a
  document-wide default easing.
- Different easing for different players or the ball within one move. All
  entities keep sharing one clock per transition; per-entity motion windows
  stay on the roadmap.
- Making Natural (speeds up, then slows) the default for new frames, or converting
  existing boards.
- A lint warning about easing. Unlike `paths`, `easing` on the last frame is
  accepted silently, as `durationMs` is.
- Easing of holds, of annotations (which do not animate) or of the playback
  speed setting.

**Baseline sections touched**

- `docs/specs/animation.md` §1 (release table, v1.1 row), §3 (Frame inspector
  row), §5 Temporal contract (the "v1 linear easing `p = u`" passage), §6
  TypeScript model (`AnimationFrame`, `schemaVersion`), §11 (the Easing
  bullet) and §14 Compatibility (the current schema version).
- `docs/specs/core-board.md`: none.

## Capabilities

### New Capabilities

- `move-easing`: how a move between two frames is paced over its duration:
  the available easings and their formulas, how a coach chooses one, how it
  is stored in the document, and which document versions the app accepts now
  that the field exists.

### Modified Capabilities

- `usage-analytics`: adds one event, `frame_pacing_changed`, sent when a
  coach changes a frame's pacing. No existing event changes.

`keyboard-positioning` is unaffected: a nudge edits a stored pose, not
pacing.

## Impact

- **Code:** the frame model, sampling, validation and frame commands in
  `src/animation/`; the state hook `src/hooks/useTacticsState.ts`; the frame
  inspector and frame chips in `src/components/Animation/`; the event list in
  `src/utils/analytics.ts`. Video export and playback use the
  sampler and need no change of their own.
- **Document format:** one optional field and schema version 4. This reaches
  project files, local storage and share links, which all carry the document.
  The share-link envelope (`#share=1.`) and the storage keys do not change.
- **Shipped AI docs:** `docs/agent/document-format.md`, one drill in
  `docs/agent/examples/`, and the regenerated `public/ai/` files.
- **Docs:** `docs/specs/animation.md`, `docs/roadmap.md`, `CHANGELOG.md`.
- **Dependencies:** none.

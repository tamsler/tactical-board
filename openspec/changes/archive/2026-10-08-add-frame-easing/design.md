# Design

## Context

See proposal.md for motivation and specs/move-easing/spec.md for the required
behaviour.

What the code looks like today:

- `src/animation/sample.ts` is the only place positions are computed for a
  time. `sampleAt` works out `u` for the current move and passes it to
  `interpolate`, which uses it directly: `lerp` for straight moves and
  `pointAtLength(from, control, to, u)` for curved ones. Playback
  (`useAnimationPlayback`), the board layers and video export
  (`videoExport.ts`) all call `sampleAt`.
- `AnimationFrame` (`model.ts`) carries the outgoing move's settings:
  `durationMs` and the optional `paths`. `DOCUMENT_SCHEMA_VERSION` is 3 and
  `SUPPORTED_SCHEMA_VERSIONS` is `[2, 3]`.
- `validate.ts` rebuilds each frame from known fields and drops `undefined`
  ones with `compact`, which is how `paths` stays absent when unset.
  `parseDocument` accepts any supported version and always returns the
  current one, so "migration" from 2 or 3 is the parse itself.
- `commands.ts` has `setFrameTiming(seq, frameId, { holdMs?, durationMs? })`.
  `duplicateFrame` spreads the source frame into the copy, then moves `paths`
  to the copy. Delete and reorder leave `durationMs` on its frame.
- `FrameInspector.tsx` shows label, hold and (when not last) duration.
  `FrameTimeline.tsx` remounts it with a `key` built from the frame's stored
  values so local drafts reset.
- The board's keyboard handler ignores keys while focus is in an `INPUT`,
  `TEXTAREA` or `SELECT`.
- `agentDocs.test.ts` fails when `document-format.md` does not mention a
  field the validator reads or a value in one of its `as const` lists.
  `scripts/build-ai-prompt.test.mjs` fails when `public/ai/` is stale.

## Goals / Non-Goals

**Goals:**

- One place applies the easing, so playback, scrubbing and video export
  cannot disagree.
- Boards without the field produce bit-for-bit the same positions as today.
- The stored form stays minimal: nothing is written for a steady move.

**Non-Goals:**

- A general easing-function registry or cubic-bézier support.
- Changing `pointAtLength` or the arc-length table.
- Restyling the frame inspector or the frame chips beyond the marker.

## Decisions

### 1. The field is `easing?: "easeInOut"` in memory, absent for linear

`model.ts` adds `EASINGS = ["linear", "easeInOut"] as const`, the `Easing`
type and `easing?: Easing` on `AnimationFrame`. The validator accepts both
values and normalises `"linear"` to absent, so in memory and on disk a frame
either has `easing: "easeInOut"` or no field. Equality checks, the
round-trip test and share-link size all stay as they are for existing boards.

*Alternative considered:* a required `easing` on every frame. Rejected: it
would add a field to every stored frame and every test fixture for no
behaviour, and existing documents would no longer round-trip unchanged.

### 2. Easing is applied once, in `sampleAt`

Add a pure `ease(u, easing)` (in a small `src/animation/easing.ts`) returning
`u` for linear and `u * u * u * (u * (6 * u - 15) + 10)` (that is, `6u⁵ − 15u⁴ + 10u³`) for `easeInOut`. `sampleAt` computes
`p = ease(u, source.easing)` and passes `p` to `interpolate` for both players
and balls. Nothing else changes: `lerp` and `pointAtLength` already take a
0..1 progress, and `pointAtLength` treats it as a fraction of arc length,
which is exactly the curved-path requirement.

Exact endpoints hold without special cases: the polynomial gives exactly 0
and 1 at `u = 0` and `u = 1`, the move interval is half-open so `u = 1` is
served by the next frame's hold, and the existing "identical endpoints
return the same object" branch runs before any arithmetic.

*Alternative considered:* `3u² − 2u³`, the curve `animation.md` §11 named.
Implemented first and rejected after trying it: the start and stop still
looked abrupt. The fifth-order curve covers 10.4% of the path in the first
quarter of the time instead of 15.6%, at the cost of a higher peak speed
(1.875× the average instead of 1.5×). Both give exact endpoints and exact
values at the quarter points in floating point, so the tests stay exact.

*Alternative considered:* easing inside `interpolate` or `pointAtLength`.
Rejected: two call sites would each need the frame's easing, and the path
maths would stop being a pure geometry helper.

### 3. `SampledFrame.progress` stays the time fraction `u`

`progress` keeps meaning "how far through the move's duration", not the eased
value. Nothing outside `sample.ts` reads it today, and a time fraction is
what a future progress indicator or insert-at-playhead needs.

### 4. Schema version 4, with 2 and 3 still read

`DOCUMENT_SCHEMA_VERSION` becomes 4 and `SUPPORTED_SCHEMA_VERSIONS` becomes
`[2, 3, 4]`. No migration function is needed: older documents have no
`easing`, which already means linear. The app writes version 4 for every
document, including ones with no eased frame, because the version is a
constant of the writer, as it was for version 3.

The field alone would be backward compatible (an older build drops unknown
fields), which is exactly the problem: a 1.8.0 tab would load an eased board,
play it steadily and autosave it without the field. The bump makes that build
refuse the document instead. This follows the project rule that a format
change bumps the version, and the precedent set for `paths` in
`animation.md` §14.

*Alternative considered:* write version 4 only when some frame is eased.
Rejected: two writer versions to test, and the type
`schemaVersion: typeof DOCUMENT_SCHEMA_VERSION` would have to widen.

### 5. Easing travels with the frame, like `durationMs`

`duplicateFrame` already copies every field of the source into the copy, so
the copy inherits the easing and the source keeps it; delete and reorder
leave it alone. No reconciliation is added. This differs from `paths` on
purpose: a curve's control point is in absolute pitch units and is only
meaningful between two specific poses, while an easing is meaningful for any
move.

### 6. A separate `setFrameEasing` command

Add `setFrameEasing(seq, frameId, easing)` to `commands.ts`. It returns the
**same** `seq` when the frame already has that easing, removes the field for
`"linear"` and sets it for `"easeInOut"`. `useTacticsState` exposes
`setFrameEasing(frameId, easing)`, which commits one history entry and skips
the commit when the command returned the same object. Like the other frame
commands it does nothing in preview.

*Alternative considered:* extending `setFrameTiming`'s `timing` argument.
Rejected: that function returns a validation `Result` with range messages
for numbers; easing has no failure case, and the inspector's error state is
keyed by timing field.

### 7. A native `<select>` in the inspector

`FrameInspector` gets an `onSetEasing` prop and, inside the existing
not-last-frame branch after the duration input, a labelled `<select>` ("Move
style") with the two options from the spec, styled with the existing
`inputClass`. It is controlled directly by `frame.easing ?? "linear"` with no
local draft, and commits on change. `FrameTimeline` adds the easing to the
inspector's `key` so the other drafts reset consistently after undo.

A native select needs no new keyboard handling: the board handler already
returns early for `SELECT`, so arrow keys change the option and do not nudge.
It also works on touch without a custom popover.

*Alternative considered:* a two-button toggle. Rejected: a focused `BUTTON`
does not block arrow-key nudging or Space, and a third easing later would
need a redesign.

### 8. The chip marker is an icon beside the duration

`FrameTimeline.tsx` renders each chip's timing line as `→ 1.50 s`. For a
non-last frame with `easing === "easeInOut"` it adds a small `aria-hidden`
lucide icon (an S-curve such as `Spline`; pick the nearest one the installed
lucide version ships) after the duration, and appends ", natural pacing" to
the chip's existing `aria-label`. The chip already re-renders from the frame,
so undo and reorder need nothing extra.

*Alternative considered:* the word "natural" in the timing line. Rejected:
chips are capped at `max-w-40` and "hold 0.80 s · → 1.50 s" already nearly
fills one at this font size.

*Alternative considered:* a text glyph such as `∿`. Rejected: coverage in
system fonts is uneven, and the app already uses lucide icons.

### 9. The usage event is sent by the timeline, not the hook

`frame_pacing_changed` is added to the `AnalyticsEvent` union in
`src/utils/analytics.ts`. `FrameTimeline.tsx` sends it from the
`onSetEasing` handler, only when the chosen value differs from the frame's
current one, next to where `animation_frame_added` is sent today. Keeping it
out of `useTacticsState` means undo, redo and imports cannot trigger it, and
the command stays pure.

### 10. No change to lint or to video export code

`lint.ts` gains no warning (see proposal, out of scope). `videoExport.ts` and
`useAnimationPlayback.ts` are untouched; they get easing through `sampleAt`.

### 11. Guidance for AI authors

`document-format.md` §5 rule 4 currently promises constant speed. It is
rewritten to say constant speed unless the frame sets `easing`, and rule 10
drops "still at constant speed" in favour of the same wording. The pacing
notes add two facts an author needs: an eased move peaks at 1.875 times its
average speed (the maximum slope of `6u⁵ − 15u⁴ + 10u³`), so the believable-speed
figures apply to the average; and because the ball shares the move's clock,
`easeInOut` suits runs and team shifts, while a move that is mainly a pass or
a shot reads better left linear. The `7v7-build-out` example gets `easing` on
one transition that is a player movement without a pass.

## Risks / Trade-offs

- [A coach on an older cached build opens a version 4 share link or file and
  is told it was made by a newer version] → Intended; it is the same message
  version 2 builds give for version 3, and a reload fetches the current
  build.
- [After a rollback of the deployment, a board autosaved as version 4 shows
  the storage recovery banner] → Accepted, as for version 3. The banner
  pauses autosave and offers a download, so nothing is lost; redeploying
  restores access.
- [An eased pass looks odd: the ball accelerates gently instead of leaving
  the foot at speed] → Easing is opt-in per move and the default stays
  steady. The AI guidance says when not to use it. Per-entity pacing is the
  roadmap's motion-windows item.
- [Peak speed in an eased move is 1.875× the average, so a long run can look
  too fast mid-move] → Documented for file authors; the coach sees it in
  playback and can lengthen the move.
- [`agentDocs.test.ts` or the stale-prompt test fails midway through the
  work] → Task order puts the format reference and `npm run build:ai` in the
  same group as the validator change.

## Migration Plan

No data migration. Deploying the build is the migration: versions 2 and 3
are parsed as before and re-saved as version 4 on the next committed edit.
The v1 and v2 local-storage keys, the storage envelope version and the share
link prefix do not change. Rollback is a redeploy of the previous build, with
the consequence described under Risks.

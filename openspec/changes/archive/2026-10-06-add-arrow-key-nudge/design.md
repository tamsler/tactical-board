# Design

## Context

See proposal.md for motivation and specs/keyboard-positioning/spec.md for the
required behaviour.

What the code looks like today:

- `TacticalBoard.tsx` registers one window-level `keydown` handler. It returns
  early when focus is in `INPUT`, `TEXTAREA`, `SELECT` or editable text, then
  handles frame keys and Space, then returns early when `tactics.isPreviewing`
  (the "editing guard"), then handles Delete, Escape, undo/redo and V.
- Selection is a single `selectedId` plus `selectedType` held in
  `useTacticsState`. There is no multi-selection.
- History lives in `useTacticsState`. `pushState` commits an edit of the
  selected frame as one undo step. `setPresentState` replaces the present
  without adding a step. Both are no-ops in preview (`readOnly`).
- A pointer drag uses `beginDrag` / `updateDrag` / `commitDrag`, with a
  `draft` board held beside the history. `isDragging` is local state in
  `TacticalBoard.tsx`.
- Pointer positions are clamped to 0..1050 × 0..680, but a dragged shape or
  line is moved by the pointer delta, so it can hang over the edge. Validation
  does not bound coordinates; the document lint only warns about items outside
  the canvas.
- `TacticalBoard.tsx` has no tests.

## Goals / Non-Goals

**Goals:**

- Keep the movement and clamping logic pure and unit-tested, outside the
  1,459-line board component.
- Reuse the existing history functions; add no new history concepts.
- Leave every existing shortcut and the drag transaction untouched.

**Non-Goals:**

- Refactoring the keyboard handler or the drag code.
- Making drag clamping consistent with nudge clamping.

## Decisions

### 1. A pure `nudgeBoard` function does the move

Add `src/animation/nudge.ts` with:

- `nudgeDeltaForKey(event)`: returns `{ dx, dy }` for an arrow key with no
  Ctrl, Cmd or Alt, using 10 when Shift is held and 1 otherwise; returns
  `null` for anything else.
- `nudgeBoard(board, id, type, dx, dy)`: returns a new `BoardState` with the
  item moved, or the **same object** when nothing moved. It computes the
  item's bounds (its position; a line's `points`; a shape's rectangle) and
  clamps each axis of the delta to
  `[min(0, 0 − boundsMin), max(0, LIMIT − boundsMax)]`. That one formula gives
  all three spec behaviours: stop at the edge, never move further out, always
  allowed back in. A line's `controlPoint` moves by the clamped delta but is
  not part of the bounds, because a control point legitimately sits off the
  curve and sometimes off the canvas.

*Alternative considered:* putting the logic inline in the keyboard handler,
next to the drag code it resembles. Rejected because that file cannot be unit
tested cheaply and the clamping has enough edge cases to deserve direct tests.

### 2. Undo grouping uses key auto-repeat, not a drag transaction

`useTacticsState` gains `nudgeSelected(dx, dy, continueStep)`:

- `continueStep === false`: apply through `pushState` (a new undo step).
- `continueStep === true`: apply through `setPresentState` (folds into the
  step the first press created).

Both paths skip the update when `nudgeBoard` returns the same object, so a
press against an edge adds no step.

The board passes `continueStep = event.repeat && runOpen`, where `runOpen` is
a ref set to true when a non-repeat press actually moved the item and cleared
on any `keyup`, on a selection change, on a frame change and on window blur. A
repeat event with no open run is treated as a fresh press, so a stray repeat
can never rewrite an unrelated history entry.

*Alternative considered:* `beginDrag` on keydown and `commitDrag` on keyup.
Rejected because it depends on always receiving the keyup (lost when the
window loses focus), it would have to coexist with a pointer drag's draft, and
the draft is dropped by undo and frame switches mid-gesture.

*Alternative considered:* one undo step per auto-repeat tick. Rejected because
holding a key for two seconds would fill the 25-step history.

*Alternative considered:* merging every consecutive nudge of the same item,
including separate presses, into one step. Rejected as less predictable: the
baseline already treats each keystroke in the title as its own step.

### 3. Where the branch goes in the keyboard handler

After the `isPreviewing` guard and before the Delete branch:

```
typing guard -> frame keys -> Space -> preview guard -> ARROWS -> Delete/Esc/undo/V
```

This position gives "ignored while typing" and "ignored during playback and
preview" for free. The branch additionally requires `selectedId`,
`selectedType`, `!isDragging` and no active `pathDrag`. It calls
`preventDefault()` only when it handles the key, so the page still scrolls
with the arrow keys when nothing is selected.

Focus on a `BUTTON` does not block nudging (unlike Space), because arrow keys
do nothing on a button and focus is usually left on a toolbar button after a
click.

### 4. Frames and curved moves need no special handling

`pushState` and `setPresentState` already edit only the selected frame through
`editSnapshot`. Curve control points for animated moves are stored per frame
in absolute units and are left alone when an endpoint moves, which is what a
drag does too.

### 5. Half pitch

The half-pitch layout converts positions, it does not rotate the canvas, so
screen directions and canvas axes agree in every layout. Task 3.3 confirms
this by hand.

## Risks / Trade-offs

- [Arrow keys are used by another control that is not an input, such as a
  custom slider or tab list] → A search found no arrow-key handling anywhere
  in `src`, and range sliders are `INPUT` elements covered by the typing
  guard. Task 3.3 includes a manual pass over the sidebar and timeline.
- [The board component test cannot run in jsdom because of SVG geometry
  APIs] → The component already falls back to `getBoundingClientRect` when
  `getScreenCTM` is missing. If selecting an item by pointer still proves
  impractical in jsdom, select through the Properties panel flow or keep the
  integration coverage at hook level and say so in the task; the pure
  functions and hook tests carry the behaviour either way.
- [Nudging clamps shapes and lines to the canvas while dragging does not] →
  Accepted. The nudge rule never makes an item less valid, and the "can move
  back in" clause keeps overhanging items usable.
- [A held key writes to history state on every repeat tick] → Each tick is one
  state update of the same size as a drag move; autosave is already debounced
  to about 750 ms.

# Proposal

## Why

Items on the board can only be positioned by dragging, which makes small
corrections hard: lining up a back four or setting a ball exactly at a
player's feet takes several attempts, more so on a trackpad. Arrow-key nudging
was reserved for this in the animation spec (§3, "Arrow keys are reserved for
v1.1 entity nudging") and never shipped. The arrow keys do nothing on the
board today.

## What Changes

- Pressing an arrow key moves the selected item 1 pitch unit in that
  direction. With Shift held it moves 10 units.
- It works for every item that can be selected: players, balls, equipment,
  lines, shapes and texts.
- A nudge cannot push an item off the 1050 × 680 canvas.
- Each key press is one undo step. Holding the key down repeats the move and
  the whole hold is still one undo step.
- In an animation, a nudge changes the item's position in the selected frame
  only, exactly as a drag does.
- Nudging is ignored while typing, during playback and preview, and while a
  pointer drag is in progress.
- The Help dialog lists the new shortcut.

**Out of scope**

- Selecting more than one item. The board has single selection only.
- Keyboard access to resize handles, line endpoint handles and curve bend
  handles.
- Changing the selection with the keyboard (for example Tab to the next
  player).
- Snapping, alignment guides and a configurable step size.
- Any change to the `.tacticalboard` document format, validation or
  `docs/agent/`. Positions are stored as before.
- Analytics events for nudging.

**Baseline sections touched**

- `docs/specs/core-board.md` §8 Interaction (keyboard table) and §12 Help and
  About (shortcut list).
- `docs/specs/animation.md` §3 Editor and interaction requirements, "Input and
  accessibility" (the sentence that reserves the arrow keys).

## Capabilities

### New Capabilities

- `keyboard-positioning`: moving the selected board item with the keyboard:
  which keys, how far, the limits, and how the moves are recorded in undo
  history.

### Modified Capabilities

None. `openspec/specs/` is empty; the existing keyboard shortcuts stay
specified in the baseline documents and their behaviour does not change.

## Impact

- **Code:** the board keyboard handler in
  `src/components/Pitch/TacticalBoard.tsx`, a new command in
  `src/hooks/useTacticsState.ts`, a new pure helper with its tests, and the
  shortcut list in `src/components/Modal/HelpModal.tsx`.
- **Docs:** `docs/specs/core-board.md`, `docs/specs/animation.md`,
  `docs/roadmap.md`, `CHANGELOG.md`.
- **Data and compatibility:** none. No stored format, share link or project
  file changes.
- **Dependencies:** none.

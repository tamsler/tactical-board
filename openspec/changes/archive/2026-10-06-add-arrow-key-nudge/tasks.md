# Tasks

## 1. Movement logic

- [x] 1.1 Add `src/animation/nudge.ts` with `nudgeDeltaForKey` (design decision 1) and `src/animation/nudge.test.ts` covering each arrow key, Shift giving 10, and `null` for Ctrl, Cmd, Alt and non-arrow keys; verify with `npx vitest run src/animation/nudge.test.ts`
- [x] 1.2 Add `nudgeBoard` to the same file for players, balls, equipment and texts, returning the same object when nothing moves; add tests for the "Arrow keys move the selected item" scenarios and for "other items stay put"; verify the test file passes
- [x] 1.3 Extend `nudgeBoard` to lines (all `points` plus `controlPoint`) and shapes (position only); add tests for the three "Lines and shapes move as a whole" scenarios; verify the test file passes
- [x] 1.4 Add the canvas clamp to `nudgeBoard` using the bounds formula in design decision 1; add one test per scenario under "Nudges stay on the canvas", including the two for an item already outside; verify the test file passes

## 2. History command

- [x] 2.1 Add `nudgeSelected(dx, dy, continueStep)` to `useTacticsState` and return it from the hook (design decision 2); it does nothing when no item is selected or `nudgeBoard` returns the same board
- [x] 2.2 Add tests to `src/hooks/useTacticsState.test.ts` for: three separate nudges then one undo; a nudge followed by continued nudges undone in one step; redo; a nudge at the edge leaving `canUndo` false; a nudge in frame 2 leaving frames 1 and 3 unchanged; no change while previewing. Verify with `npx vitest run src/hooks/useTacticsState.test.ts`

## 3. Keyboard handling

- [x] 3.1 Add the arrow-key branch to the keyboard handler in `src/components/Pitch/TacticalBoard.tsx` at the position given in design decision 3, with the `runOpen` ref and its resets (keyup, selection change, frame change, window blur); `preventDefault` only when the key is handled
- [x] 3.2 Add `src/components/Pitch/TacticalBoard.test.tsx` that renders the board with the real hook, selects a player, and checks: ArrowRight moves it by 1; Shift+ArrowRight by 10; a repeated keydown (`repeat: true`) followed by one undo restores the start position; ArrowRight with focus in an input moves nothing; ArrowRight with nothing selected is not default-prevented. If selection by pointer is impractical in jsdom, follow the fallback in design.md Risks and note it in the test file. Verify with `npx vitest run src/components/Pitch/TacticalBoard.test.tsx`
- [x] 3.3 Check by hand in `npm run dev`: nudge each of the six item types; hold a key and undo once; nudge at each canvas edge; nudge on the half-pitch layout and confirm directions match the screen; arrow keys still work in the title, notes, frame label and every Properties slider; arrows do nothing during playback; the page does not scroll while nudging on a small window. Record the result in the change's pull request or commit message

## 4. Help and documentation

- [x] 4.1 Add "Nudge Selected" (arrow keys) and "Nudge 10×" (Shift + arrow keys) rows to the shortcuts grid in `src/components/Modal/HelpModal.tsx`, matching the existing rows; verify in the running app that Help shows both
- [x] 4.2 In `docs/specs/core-board.md` add an arrow-keys row to the §8 keyboard table and "Nudge Selected" to the §12 shortcut list, each pointing to `openspec/specs/keyboard-positioning/spec.md` for the rules instead of restating them; verify the links resolve once the change is archived
- [x] 4.3 In `docs/specs/animation.md` §3 "Input and accessibility", replace "Arrow keys are reserved for v1.1 entity nudging." with a sentence that arrow keys nudge the selected item and a link to the same spec
- [x] 4.4 Remove item 2 from the candidates table in `docs/roadmap.md`, renumber the rest, and update "Order agreed so far"
- [x] 4.5 Add an entry under **Unreleased** → **Added** in `CHANGELOG.md` describing arrow-key nudging in user terms

## 5. Verification

- [x] 5.1 Run `npm test`, `npm run lint` and `npm run build`; all three pass with no new warnings
- [x] 5.2 Run `openspec validate add-arrow-key-nudge --strict`; it reports the change as valid

## Workflow follow-up

- Archive the change with `/opsx:archive` once it is reviewed; this creates `openspec/specs/keyboard-positioning/spec.md`.
- After archiving, open the two links added in tasks 4.2 and 4.3 and confirm they resolve.

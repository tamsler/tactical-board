# Tasks

## 1. Easing in the model and the sampler

- [x] 1.1 In `src/animation/model.ts` add `EASINGS`, the `Easing` type and the optional `easing` field on `AnimationFrame` (design decision 1); verify `npx tsc -b` passes
- [x] 1.2 Add `src/animation/easing.ts` with the pure `ease(u, easing)` function (design decision 2) and `src/animation/easing.test.ts` covering: linear returns `u`; `easeInOut` gives 0, 0.103515625, 0.5, 0.896484375 and 1 at `u` = 0, 0.25, 0.5, 0.75 and 1; a missing easing behaves as linear. Verify with `npx vitest run src/animation/easing.test.ts`
- [x] 1.3 Apply `ease` in `sampleAt` in `src/animation/sample.ts`, leaving `SampledFrame.progress` as the time fraction (design decision 3); update the reference to §5 in its comment if the passage moves (task 5.1)
- [x] 1.4 Extend `src/animation/sample.test.ts` with the spec scenarios under "Move progress follows the easing", "Eased moves start and end on the stored poses", "One easing for everything in a move" and "Easing applies along curved paths" (use a curve of known length and compare against `pointAtLength` at 0.103515625 and 0.5), plus a check that an un-eased sequence samples exactly as before. Verify with `npx vitest run src/animation/sample.test.ts`

## 2. Document format, validation and the AI reference

- [x] 2.1 In `src/animation/validate.ts` read the optional `easing` frame field against `EASINGS`, normalising `"linear"` to absent (design decision 1); in `model.ts` set `DOCUMENT_SCHEMA_VERSION` to 4 and `SUPPORTED_SCHEMA_VERSIONS` to `[2, 3, 4]` and update the comment above them (design decision 4)
- [x] 2.2 Update `src/animation/validate.test.ts`: the "newer version" test uses version 5; versions 2 and 3 parse and come back as 4 with paths intact; `"easeInOut"` round-trips; `"linear"` comes back without the field; `"easeOut"` and `true` are rejected with the path `document.frames[1].easing`; `easing` on the last frame is accepted. Verify with `npx vitest run src/animation/validate.test.ts`
- [x] 2.3 Add cases to `src/animation/storage.test.ts` and `src/animation/shareLink.test.ts`: an eased frame survives a storage save/load and a share-link encode/decode; a stored document with `schemaVersion` 5 yields the "newer version" storage problem. Add a `src/animation/lint.test.ts` case that a document with `easing` on a middle frame and on the last frame produces no warnings. Verify with `npx vitest run src/animation`
- [x] 2.4 Pin the old formats with fixtures written as literal JSON in the tests (not built with `toDocument`, which would stamp the new version): a `schemaVersion` 3 document with a curved path and a `schemaVersion` 2 document. In `shareLink.test.ts` encode each as a `#share=1.` link and check it parses to the same frames, timing and paths with no `easing`; in `storage.test.ts` store the version 3 document in a `storageVersion` 2 envelope under `tactical_board_saved_state_v2` and check it loads with its selected frame and no storage problem; in `src/hooks/useProjectFile.test.ts` check a legacy single-board JSON still loads as one frame. In addition, before changing the version constant in task 2.1, generate one real share link from the current build with `npm run check:board -- docs/agent/examples/minimal-wall-pass.tacticalboard`, paste its `#share=1.` fragment into `shareLink.test.ts` as a fixed string and assert it still opens. Verify with `npx vitest run src/animation src/hooks`
- [x] 2.5 Update `docs/agent/document-format.md`: the title and both `schemaVersion` occurrences to 4 (§1 and the §8 example); an `easing` row in the §3 frame table and in the §3 sample frame; §5 rules 4 and 10 and the pacing notes as set out in design decision 11. Verify `npx vitest run src/animation/agentDocs.test.ts` passes
- [x] 2.6 Set `"schemaVersion": 4` in both files in `docs/agent/examples/` and add `"easing": "easeInOut"` to the first frame of `7v7-build-out.tacticalboard` (the "Goal kick set-up" → "Split wide" move, which has no pass); verify `npm run check:board -- docs/agent/examples/7v7-build-out.tacticalboard` and the same for `minimal-wall-pass.tacticalboard` both print `VALID` with no warnings
- [x] 2.7 Check `docs/agent/system-prompt.md` and `docs/agent/chat-ending.md` for statements that every move is constant speed or that the version is 3, and correct any found; run `npm run build:ai` and commit the regenerated `public/ai/` files; verify `public/ai/prompt.md` contains `easeInOut` and `"schemaVersion": 4` and that `node --test scripts/build-ai-prompt.test.mjs` (or `npm test`, whichever runs it) passes

## 3. Frame command and history

- [x] 3.1 Add `setFrameEasing` to `src/animation/commands.ts` (design decision 6) and tests in `src/animation/commands.test.ts`: sets and clears the field; returns the same sequence when unchanged; `duplicateFrame` gives the copy the source's easing and leaves the source's in place; reorder, delete of another frame and `setFrameTiming` keep each frame's easing. Verify with `npx vitest run src/animation/commands.test.ts`
- [x] 3.2 Add `setFrameEasing(frameId, easing)` to `src/hooks/useTacticsState.ts` and return it from the hook; add tests to `src/hooks/useTacticsState.test.ts` for one undo step per change, redo, no step when the value is unchanged, and no change while previewing. Verify with `npx vitest run src/hooks/useTacticsState.test.ts`

## 4. Inspector control, chip marker and usage event

- [x] 4.1 Add the "Move pacing" `<select>` to `src/components/Animation/FrameInspector.tsx` with the options "Steady speed" and "Natural (speeds up, then slows)" (design decision 7); pass `onSetEasing` from `src/components/Animation/FrameTimeline.tsx` and add the easing to the inspector's `key`
- [x] 4.2 Extend `src/components/Animation/FrameTimeline.test.tsx`: the control is shown for a frame with a next frame and absent on the last frame; choosing "Natural (speeds up, then slows)" changes only that frame; reselecting the frame shows the stored choice; undo restores "Steady speed". Verify with `npx vitest run src/components/Animation/FrameTimeline.test.tsx`
- [x] 4.3 Add the pacing marker and the ", natural pacing" accessible-name suffix to the frame chips in `FrameTimeline.tsx` (design decision 8); extend `FrameTimeline.test.tsx` with the four scenarios under "Frame chips mark natural pacing", including that a steady frame's `aria-label` is unchanged. Verify the test file passes
- [x] 4.4 Add `frame_pacing_changed` to the `AnalyticsEvent` union in `src/utils/analytics.ts` and send it from the timeline's easing handler (design decision 9); add tests using the existing analytics recorder for each scenario in specs/usage-analytics/spec.md, and extend `src/utils/analyticsPrivacy.test.tsx` if it enumerates events. Verify with `npx vitest run src/components/Animation src/utils`
- [x] 4.5 Check by hand in `npm run dev`: set one move of a three-frame animation to "Natural (speeds up, then slows)" and compare it with a steady one in playback; scrub through it; change the control with the keyboard while a player is selected and confirm the player is not nudged; confirm the inspector row still wraps cleanly at phone width and the chip marker is visible on selected, playhead and plain chips; save and reload the project file and open its share link; export a short video and confirm the eased move. Record the result in the pull request or commit message

## 5. Baseline specs, roadmap and changelog

- [x] 5.1 In `docs/specs/animation.md` replace the superseded passages with links to `openspec/specs/move-easing/spec.md` instead of restating the rules: the "v1 linear easing `p = u`" passage in §5, the Easing bullet in §11, and the current-version sentence in §14 Compatibility; add `easing` to `AnimationFrame` and set `schemaVersion` to 4 in the §6 model; add "move pacing" to the Frame inspector row and the pacing marker to the Frame strip row in §3; add `frame_pacing_changed` to the event list in §10 "Feature flag and analytics"; move easing out of the v1.1 row of the §1 table. Verify no remaining text in the file says moves are always linear or that the current schema is version 3
- [x] 5.2 Remove candidate 1 from the table in `docs/roadmap.md`, renumber the rest, and update "Order agreed so far"
- [x] 5.3 Add an entry under **Unreleased** → **Added** in `CHANGELOG.md` describing the Move pacing setting in user terms, note under **Changed** that the app now counts changes of the pacing control as an anonymous usage event (the chosen value and the frame count only), and that saved files and share links are now schema version 4 and need this version or later to open

## 6. Verification

- [x] 6.1 Run `npm test`, `npm run lint` and `npm run build`; all three pass with no new warnings
- [x] 6.2 Run `npm run test:e2e`, because the change reaches storage, share links and export; the suite passes
- [x] 6.3 Run `openspec validate add-frame-easing --strict`; it reports the change as valid

## Workflow follow-up

- Archive the change with `/opsx:archive` once it is reviewed; this creates `openspec/specs/move-easing/spec.md`.
- After archiving, open the links added in task 5.1 and confirm they resolve.

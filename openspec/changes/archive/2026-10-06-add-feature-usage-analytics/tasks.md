# Tasks

## 1. Event names

- [x] 1.1 Add `share_link_copied`, `ai_paste_opened`, `ai_paste_feedback_copied`, `ai_paste_abandoned` and `video_export_failed` to the `AnalyticsEvent` union in `src/utils/analytics.ts`; verify `npx tsc -b` passes
- [x] 1.2 Add `src/utils/analytics.test.ts` covering: `track` forwards the event and parameters to `window.gtag`; it does nothing and does not throw when `gtag` is missing; it does not throw when `gtag` itself throws (make `track` swallow that error if it does not already). Verify with `npx vitest run src/utils/analytics.test.ts`

## 2. Import source

- [x] 2.1 In `src/hooks/useProjectFile.ts` send `import_tactics` with `source: "file"` and `frames`; extend `src/hooks/useProjectFile.test.ts` with a stubbed `gtag` for the project-file, legacy-file and rejected-file scenarios; verify the test file passes
- [x] 2.2 In `src/hooks/useShareLinkImport.ts` send `source: "share_link"` and `frames`; add `src/hooks/useShareLinkImport.test.ts` for the accepted and declined scenarios (stub `confirm` and `gtag`); verify it passes
- [x] 2.3 In `src/App.tsx` send `source: "ai_paste"`, `frames` and `warnings` for a board opened through Paste from AI, passing the warning count out of `PasteImportDialog` with the project; verify with the dialog tests in group 4

## 3. Share link

- [x] 3.1 In `src/components/Modal/ShareDialog.tsx` send `share_link_copied` with `frames` after the clipboard write succeeds
- [x] 3.2 Add `src/components/Modal/ShareDialog.test.tsx` for the copied, closed-without-copying and copy-fails scenarios (stub `navigator.clipboard` and `gtag`); verify it passes

## 4. Paste from AI

- [x] 4.1 Send `ai_paste_opened` once when `PasteImportDialog` mounts, guarded so React Strict Mode's double mount in development does not send it twice
- [x] 4.2 Send `ai_paste_feedback_copied` with `result` and `warnings` after the feedback copy succeeds
- [x] 4.3 Send `ai_paste_abandoned` with `result` (`empty`, `invalid`, `warnings` or `valid`) on every close path that does not open a board: Escape, the backdrop, the close button and Cancel
- [x] 4.4 Extend `src/components/Modal/PasteImportDialog.test.tsx` with one test per scenario under the three Paste from AI requirements and the "warning count on success" requirement, including that typing sends nothing and that opening a board sends no `ai_paste_abandoned`; verify it passes

## 5. Video export

- [x] 5.1 In `src/components/Modal/VideoExportDialog.tsx` send `video_export_failed` with `format` and `reason` (`unsupported` for `VideoExportUnsupportedError`, otherwise `error`) in the failure branch, and nothing when the export was cancelled
- [x] 5.2 Add `src/components/Modal/VideoExportDialog.test.tsx` with `../../animation/videoExport` mocked to cover the unsupported, other-error, cancelled and finished scenarios; verify it passes

## 6. No board content

- [x] 6.1 Add a test that runs a board with a distinctive title, notes, player name, caption and frame label through file import, share-link import, Paste from AI (valid, and invalid text containing a marker string), share-link copy and a failed video export, then asserts that no argument of any `gtag` call contains any of those strings; verify it passes and that it fails if a title is added to an event by hand
- [x] 6.2 Add a Playwright test in `e2e/` that records `window.gtag` calls through an init script, opens an example share link and asserts one `import_tactics` with `source` `share_link` and no parameter containing the example's title; verify with `npm run test:e2e`

## 7. Documentation

- [x] 7.1 In `docs/specs/core-board.md` §13 replace the event list with a one-line summary and a link to `openspec/specs/usage-analytics/spec.md`, keeping the sentence about `track` doing nothing without `gtag`
- [x] 7.2 In `docs/specs/animation.md` "Feature flag and analytics", point the counts-only sentence to the same spec
- [x] 7.3 Remove item 1 from the candidates table in `docs/roadmap.md`, renumber, and update the sentence that says item 1 exists to provide signal
- [x] 7.4 Add an entry under **Unreleased** → **Changed** in `CHANGELOG.md` saying which anonymous usage counts are now collected and that board content is never sent

## 8. Verification

- [x] 8.1 Run `npm test`, `npm run lint`, `npm run build` and `npm run test:e2e`; all pass
- [x] 8.2 Run `openspec validate add-feature-usage-analytics --strict`; it reports the change as valid

## Workflow follow-up

- Archive the change with `/opsx:archive` once reviewed; this creates `openspec/specs/usage-analytics/spec.md`, which the links from tasks 7.1 and 7.2 point to.
- In Google Analytics, register `source`, `result`, `reason`, `frames` and `warnings` as custom dimensions or metrics. GA4 records unregistered parameters but does not show them in standard reports.
- After release, confirm in GA4's DebugView or Realtime report that one of the new events arrives from the live site.

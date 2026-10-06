# Proposal

## Why

There is no way to tell whether the newest features are used, so there is no
evidence for what to build next. In particular the "Create drills with AI"
feature shipped as experimental in 1.6.0 and nothing shows whether coaches try
it, or whether the assistant's answers actually open. Three specific gaps in
today's events:

- Opening a board sends the same `import_tactics` event whether it came from a
  file, a share link or Paste from AI, so the three cannot be told apart.
- Creating a share link sends nothing.
- A Paste from AI attempt that fails, or a video export that fails, sends
  nothing, so only successes are visible.

(The roadmap said video export sends no events. That was wrong: a finished
video export already sends `export` with the format. Only its failures are
missing.)

## What Changes

- `import_tactics` gains a `source` (`file`, `share_link` or `ai_paste`) and a
  `frames` count. For Paste from AI it also carries the number of `warnings`.
- New event `share_link_copied` when a coach copies a share link.
- New events for the Paste from AI dialog: `ai_paste_opened`,
  `ai_paste_feedback_copied` and `ai_paste_abandoned` (closed without opening
  a board, with how far the coach got).
- New event `video_export_failed` with the format and whether the browser
  could not encode video or something else went wrong.
- A written rule for every event, old and new: parameters are counts, fixed
  category values and booleans only. Board content, titles, notes, names,
  pasted text, error messages, file names and share links are never sent.
- No visible change for coaches. Features behave the same whether or not
  analytics is available.

**Out of scope**

- Analytics on the `/ai/` guide page (prompt copied, example opened). That
  page loads no analytics today and tells coaches "Nothing is uploaded to us";
  adding tracking there is a separate decision.
- A consent banner, a privacy notice, or any change to how Google Analytics is
  loaded in `index.html`.
- Events for features that already report (formations, exports of images and
  PDFs, animation creation and playback) and for arrow-key nudging.
- Dashboards, reports or custom-dimension setup inside Google Analytics.
- Removing the "experimental" label from the AI feature.

**Baseline sections touched**

- `docs/specs/core-board.md` §13 SEO, PWA and analytics (the event list).
- `docs/specs/animation.md` §12 "Feature flag and analytics" (the animation
  events and the counts-only sentence).

## Capabilities

### New Capabilities

- `usage-analytics`: which usage events the app sends, with which parameters,
  and what it must never send.

### Modified Capabilities

None.

## Impact

- **Code:** `src/utils/analytics.ts` (event names), the three import call
  sites (`src/hooks/useProjectFile.ts`, `src/hooks/useShareLinkImport.ts`,
  `src/App.tsx`), `src/components/Modal/ShareDialog.tsx`,
  `src/components/Modal/PasteImportDialog.tsx`,
  `src/components/Modal/VideoExportDialog.tsx`, and tests for each.
- **Docs:** both baseline specs, `docs/roadmap.md`, `CHANGELOG.md`.
- **Data sent off the device:** more events to Google Analytics, all within
  the counts-and-categories rule above. No stored format, share link or
  project file changes, and `docs/agent/` is untouched.
- **Dependencies:** none.

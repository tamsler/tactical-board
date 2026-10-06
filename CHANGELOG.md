# Changelog

All notable changes to Tactical Soccer Board are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and versions follow [Semantic Versioning](https://semver.org/). Features marked
**(beta)** in 1.3.0 and 1.4.0 needed `?animate=1` (or a build with
`VITE_ENABLE_ANIMATION=true`); since 1.5.0 they are available to everyone. See
[docs/specs/animation.md](docs/specs/animation.md) for details.

## [Unreleased]

## [1.6.0] - 2026-10-05

### Added

- **Create drills with AI (experimental).** A new page at `/ai/` gives coaches
  a prompt to paste into an AI assistant, which then writes a board or
  animation from a one-line description. "Paste from AI" in the header, next
  to Load, checks the assistant's answer, lists anything that looks wrong, and
  opens it on the board. "Copy feedback for the AI" copies those messages so
  the assistant can correct its drill.
- `docs/agent/` documents the project file format for AI agents, and
  `npm run check:board -- <file>` validates a file from the command line and
  prints a share link.

### Fixed

- Team B and half-pitch formations no longer have left and right swapped. On
  the full pitch Team B's right back used to stand on Team B's left; on the
  half pitch the same happened to the single team shown. New boards and newly
  applied formations place each role on its own side. Saved boards are not
  changed.

## [1.5.0] - 2026-09-28

### Added

- Equipment on an animated board can be copied to every frame, or removed from
  every frame, from the Properties panel. The panel shows how many frames hold
  the item as it is in the selected frame.

### Changed

- Animation is out of beta and available to everyone: the Animate button,
  timeline and playback, video export, share links, Save/Save As/Open with
  `.tacticalboard` files, Ctrl/Cmd+S and "Current Frame (legacy JSON)".
  `?animate=1` is no longer needed; old links that include it still work, and
  new share links leave it out.
- Faster first load: the PDF library is downloaded only when you export a PDF,
  roughly halving the main script (832 kB to 432 kB).

### Removed

- The `VITE_ENABLE_ANIMATION` build flag and `?animate=1` URL switch.
- The unused `html-to-image` and `@testing-library/jest-dom` dependencies.
- "Save Project File (JSON)" from the Save / Export menu. Save now writes a
  `.tacticalboard` file; "Current Frame (legacy JSON)" still exports the old
  single-board `.json` for older versions.

### Fixed

- "Current Frame (legacy JSON)" on an untitled board is named
  `tactics-frame.json` instead of `tactics-frame-frame.json`.

## [1.4.0] - 2026-09-27

### Added

- **(beta)** Projects save as `.tacticalboard` files
  (`application/vnd.tacticalboard+json`). Load and Open accept both
  `.tacticalboard` and `.json`.
- When the site is installed as an app (Chrome/Edge desktop), double-clicking a
  `.tacticalboard` file opens it.
- MIT licence ([LICENSE](LICENSE)).

### Changed

- Opening a legacy `.json` board never overwrites it; the next Save asks for a
  new `.tacticalboard` file.
- Exports, saves and opened files are confirmed with a short message below the
  header (for example "Exported press-plan.png") that disappears after a few
  seconds, instead of confetti or a pop-up dialog. Errors stay visible longer.
- Export file names drop punctuation from the board title.
- The header no longer shows the version number; Help still does.
- Updated dependencies, including React 19.3, Vite 8.3 and lucide-react 1.48.
- Shorter README with a link to the live site, how to try the beta, and
  corrected setup steps (Node.js 20.19+ or 22.12+).

### Removed

- Confetti after image and PDF exports, and the `canvas-confetti` dependency.

## [1.3.0] - 2026-09-27

### Added

- **(beta)** Animation: build a sequence of frames, drag players and the ball
  to their next positions, and set how long each frame holds and each move
  takes.
- **(beta)** Playback with play/pause, restart, previous/next frame, a seek
  slider, loop and speeds from 0.25× to 2×; read-only preview while playing or
  scrubbing.
- **(beta)** "Show moves" overlay with each entity's previous position and
  movement arrow.
- **(beta)** Curved runs and passes: drag the dot on a move's arrow to bend it;
  double-click to straighten.
- **(beta)** Frame labels, per-frame notes, and moving or deleting frames with
  Undo.
- **(beta)** Video export to MP4 and MOV, rendered in the browser.
- **(beta)** Share links that carry the whole board in the URL; nothing is
  uploaded.
- **(beta)** Save, Save As and Open with real files in Chrome and Edge, plus
  Ctrl/Cmd+S.
- **(beta)** "Current Frame (legacy JSON)" export for older versions of the app.
- **(beta)** Keyboard shortcuts: Space to play/pause, `,` / `.` or
  PageUp/PageDown to change frame, Escape to return to editing.
- Opening a share link asks for confirmation and imports the board as one
  undoable step.
- Save status: a "Not saved" badge with Retry and Download when browser storage
  fails or is full.
- Recovery banner when saved data is damaged or from a newer version, with
  "Download backup" and "Discard and resume saving"; autosave pauses meanwhile.
- Product specifications in [docs/specs/](docs/specs/).

### Changed

- Browser storage moved to a new format (`tactical_board_saved_state_v2`). The
  old `tactical_board_saved_state_v1` data is migrated on first load and left
  untouched as a backup.
- Autosave waits ~750 ms after a completed change and saves when the tab is
  hidden or closed, instead of writing on every pointer move.
- Imported files are fully validated; invalid files are rejected with a message
  naming the problem field instead of being loaded as-is.
- New item IDs use random UUIDs instead of timestamps.
- Clear Lines, Reset and Notes say which frame they affect when a board has
  frames; layout, format and half-pitch team are locked while animated.

### Fixed

- Dragging an item is a single undo step, and clicking without moving no longer
  adds one.
- An interrupted touch or drag is discarded instead of being saved.
- Boards without players (blank drills with only cones or a ball) are restored
  after a reload.
- Saved state is read once on load instead of on every render.

### Removed

- Unused placeholder frame data that was written to browser storage but never
  used.

## [1.2.3] - 2026-09-07

### Added

- Contact email (info@tacticalboard.app) in About & Feedback.

## [1.2.2] - 2026-09-07

### Fixed

- 7v7 build-out line now shows on the half pitch (single line with a BOL
  badge).

## [1.2.1] - 2026-09-07

### Added

- Social preview image, Apple touch icon and 192/512 px app icons for
  installing the site.

### Changed

- Dependency updates (lucide-react, Vitest 5, Testing Library, Vite React
  plugin, oxlint).

## [1.2.0] - 2026-09-07

### Added

- Show/hide toggle per team on the full pitch.
- Search-engine and social metadata (description, Open Graph, Twitter,
  structured data), `robots.txt`, `sitemap.xml` and a web app manifest.
- Anonymous usage analytics for exports, imports, formations, layout and
  format changes, reset, clearing drawings and opening help.

### Changed

- Rebranded with a generic Tactical Board logo.
- Sidebar reordered to layout, then format, then formations.
- On phones, Load and Help moved into the Save / Export menu so the header
  fits.
- The colour and line-width pickers stay in place while the tool list scrolls.

### Fixed

- The export menu and tool tooltips are no longer cut off by the header and
  tool rail.
- The help window closes with Escape or a click outside it.
- The sidebar opens by default only on screens that are wide enough.

### Removed

- Previous club logos and unused images.

## [1.1.0] - 2026-08-24

### Changed

- Dependency updates.
- Automated tests for board state, drawing maths and text formatting.

## [1.0.0] - 2026-08-24

### Added

- Tactical board with full pitch, half pitch and plain grass layouts; 11v11,
  9v9 and 7v7 formats with formation presets for both teams; 7v7 build-out
  lines.
- Drawing tools for runs, passes, dribbles, curved runs, screens, freehand
  lines, zones and text notes, with bold/italic formatting in notes.
- Players, balls, cones, mannequins and mini goals, with a quick-add bar.
- Properties panel for colours, labels, sizes, vision cones and facing angle.
- Undo/redo, zoom, pan and pinch-to-zoom on touch devices.
- PNG, JPEG, SVG and PDF export, and JSON save/load.
- Automatic saving in the browser with a "Restored" indicator.
- App version, About information and a link to report issues.

### Fixed

- Player numbers stay readable on light jerseys.

[Unreleased]: https://github.com/tamsler/tactical-board/compare/v1.6.0...HEAD
[1.6.0]: https://github.com/tamsler/tactical-board/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/tamsler/tactical-board/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/tamsler/tactical-board/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/tamsler/tactical-board/compare/v1.2.3...v1.3.0
[1.2.3]: https://github.com/tamsler/tactical-board/compare/v1.2.2...v1.2.3
[1.2.2]: https://github.com/tamsler/tactical-board/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/tamsler/tactical-board/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/tamsler/tactical-board/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/tamsler/tactical-board/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/tamsler/tactical-board/releases/tag/v1.0.0

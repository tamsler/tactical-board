# ⚽ Tactical Soccer Board

A free tactical board for soccer coaches that runs in the browser. Set up
formations, draw runs and passes, and export the result as an image or a PDF
coaching sheet. Boards are saved in your browser; nothing is uploaded.

**Open it at [tacticalboard.app](https://tacticalboard.app/).**

![Tactical Soccer Board with an 11v11 4-3-3 against 4-4-2](social/app-screenshot.png)

## Features

- 11v11, 9v9 and 7v7, each with formation presets, plus 7v7 build-out lines.
- Full pitch, half pitch or plain grass, four pitch styles, and zone and grid
  overlays.
- Tools for runs, passes, dribbles, curved runs, screens, freehand lines,
  shaded zones and text. Anything can be moved or edited afterwards, and
  nudged into place with the arrow keys.
- Animated sequences: build frames, move players and the ball, bend their
  runs, choose steady or natural pacing for each move, and play them back.
  Export the animation as MP4 or MOV video.
- Export to PNG, JPEG, SVG or a PDF sheet with your coaching notes.
- Share a board as a link, with the whole board stored in the link itself.
- Create drills with AI (experimental): copy a prompt from
  [tacticalboard.app/ai](https://tacticalboard.app/ai/) into an AI assistant,
  describe a drill, and paste the answer into the board.
- Undo and redo, automatic saving, and saving or opening `.tacticalboard`
  project files.

Feedback is welcome in
[issues](https://github.com/tamsler/tactical-board/issues).

**Privacy.** Boards never leave your browser unless you save, export or share
them yourself. The site uses Google Analytics to count which features are
used (for example "a share link was copied"). Those events carry counts and
fixed categories only, never titles, notes, names, pasted text or links; the
exact list is in
[openspec/specs/usage-analytics/spec.md](openspec/specs/usage-analytics/spec.md).

See the [CHANGELOG](CHANGELOG.md) for what changed in each version.

## Development

Requires [Node.js](https://nodejs.org/) 20.19+ or 22.12+.

```bash
git clone https://github.com/tamsler/tactical-board.git
cd tactical-board
npm install
npm run dev
```

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm test` | Run the tests once (`npm run test:watch` to watch) |
| `npm run test:e2e` | Run the browser tests with [Playwright](https://playwright.dev/) (first run `npx playwright install chromium`) |
| `npm run lint` | Lint with [Oxlint](https://oxc.rs/docs/guide/usage/linter/rules) |

**Built with** React 19, TypeScript, Vite and Tailwind CSS v4. Images are
drawn with the browser's Canvas API, PDFs use jsPDF, video uses Mediabunny,
and tests use Vitest with Testing Library, plus Playwright for a small set of
browser tests. GitHub Actions runs lint, both test suites and the build on
every push.

### Specs

- [docs/specs/core-board.md](docs/specs/core-board.md): the board, tools,
  formations and exports, with acceptance criteria.
- [docs/specs/animation.md](docs/specs/animation.md): animation, playback,
  sharing, files and video export.
- [openspec/specs/](openspec/specs/): behaviour added or changed since v1.6.0,
  one folder per capability (`keyboard-positioning`, `move-easing`,
  `usage-analytics`).
- [docs/roadmap.md](docs/roadmap.md): candidate features, not committed work.
- [docs/agent/document-format.md](docs/agent/document-format.md): the
  `.tacticalboard` file format, written for AI agents. `npm run check:board
  -- <file>` validates a file; `npm run build:ai` regenerates the prompt and
  examples served at `/ai/`.

Behaviour changes go through [OpenSpec](https://github.com/Fission-AI/OpenSpec):
a proposal in `openspec/changes/` is reviewed, implemented, then archived into
[openspec/specs/](openspec/specs/), which takes precedence over the two
documents above for anything it covers. Add a CHANGELOG entry under
**Unreleased** for every user-visible change.

## Contact

Thomas Amsler, [info@tacticalboard.app](mailto:info@tacticalboard.app). Bugs
and ideas go in [GitHub issues](https://github.com/tamsler/tactical-board/issues).

## License

[MIT](LICENSE)

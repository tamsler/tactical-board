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
  shaded zones and text. Anything can be moved or edited afterwards.
- Export to PNG, JPEG, SVG or a PDF sheet with your coaching notes.
- Undo and redo, automatic saving, and saving or loading a board as a file.

### Beta: animation

Add `?animate=1` to the address
([tacticalboard.app/?animate=1](https://tacticalboard.app/?animate=1)) to try
animated sequences: build frames, play them back, share a board as a link,
save `.tacticalboard` files and export MP4 or MOV video. Feedback is welcome in
[issues](https://github.com/tamsler/tactical-board/issues).

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
| `npm run lint` | Lint with [Oxlint](https://oxc.rs/docs/guide/usage/linter/rules) |

To turn the beta on for every page load, start the server with
`VITE_ENABLE_ANIMATION=true npm run dev`.

**Built with** React 19, TypeScript, Vite and Tailwind CSS v4. Exports use
html-to-image and jsPDF, video uses Mediabunny, and tests use Vitest with
Testing Library.

### Specs

- [docs/specs/core-board.md](docs/specs/core-board.md): the board, tools,
  formations and exports, with acceptance criteria.
- [docs/specs/animation.md](docs/specs/animation.md): animation, playback,
  sharing, files and video export.

When you change behaviour, update the relevant spec and add a CHANGELOG entry
under **Unreleased**.

## Contact

Thomas Amsler, [info@tacticalboard.app](mailto:info@tacticalboard.app). Bugs
and ideas go in [GitHub issues](https://github.com/tamsler/tactical-board/issues).

## License

[MIT](LICENSE)

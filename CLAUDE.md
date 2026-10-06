# Tactical Board

A client-only React 19, TypeScript, Vite and Tailwind v4 app. See
[README.md](README.md) for commands.

## Specs come first

This project is spec-driven with [OpenSpec](https://github.com/Fission-AI/OpenSpec).

- **Any change to behaviour starts as an OpenSpec change**: `/opsx:propose`,
  review, `/opsx:apply`, then `/opsx:archive`. Do not edit code for a
  behaviour change that has no approved proposal in `openspec/changes/`.
- Bug fixes that restore specified behaviour, refactors, dependency updates
  and documentation need no proposal.
- **Where the truth is:**
  - [openspec/specs/](openspec/specs/): requirements added or changed since
    v1.6.0. These take precedence.
  - [docs/specs/core-board.md](docs/specs/core-board.md) and
    [docs/specs/animation.md](docs/specs/animation.md): the v1.6.0 baseline
    for everything else.
  - [docs/agent/](docs/agent/): the `.tacticalboard` format reference. It is
    shipped to users through `npm run build:ai`, so keep it exact.
  - [docs/roadmap.md](docs/roadmap.md): candidate features, not committed
    work.
- When code and spec disagree, say so and ask which one is wrong. Do not
  quietly change either to match the other.
- Project rules for proposals, specs and tasks are in
  [openspec/config.yaml](openspec/config.yaml).

## Before calling work done

Run `npm test`, `npm run lint` and `npm run build`. For changes to pointer
or touch handling, zoom, export, storage or share links, also run
`npm run test:e2e` (Playwright, in [e2e/](e2e/)); CI runs all four. Add a
[CHANGELOG.md](CHANGELOG.md) entry under **Unreleased** for anything a user
can see.

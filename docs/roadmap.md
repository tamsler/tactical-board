# Roadmap candidates

Ideas for what to build next, collected on 6 October 2026 at v1.6.0. Nothing
here is committed work. An item becomes work when it gets an OpenSpec proposal
in `openspec/changes/`; remove it from this list when that change is archived.

There is no user signal behind the ordering yet (no open issues, no feedback,
and no analytics for the newest features), so the order reflects size and
risk, not demand. Item 1 exists to change that.

## Candidates

| # | Candidate | Size | Why | Source |
|---|---|---|---|---|
| 1 | Usage analytics for share links, video export and Paste from AI | Small | These features send no events, so there is no way to tell whether the experimental AI feature or sharing is used. Informs every later choice. | `src/utils/analytics.ts` |
| 2 | Easing (`easeInOut`) per frame | Medium | Every move is linear, which makes playback look mechanical. The formula is already specified. Adds an optional field to the document format. | [animation.md](specs/animation.md) §11 |
| 3 | Ball possession (the ball follows a player) | Large | A dribble currently needs the ball and the player moved separately in every frame. Needs design work: possession must be explicit, never inferred from proximity. | [animation.md](specs/animation.md) §11 |
| 4 | Board library | Large | The app holds one board at a time; a second drill means saving a file and loading another. The spec defers an IndexedDB library. | [animation.md](specs/animation.md) §13 |
| 5 | Cross-tab conflict detection | Medium | Two tabs on the app overwrite each other's autosave without warning. How often this happens in practice is unknown. | [animation.md](specs/animation.md) §8 |

## Smaller deferred items

Listed in the specs as deferred and not yet weighed against the candidates
above:

- **Animation editing:** drag-to-reorder frames, rendered frame thumbnails,
  insert frame at playhead, per-entity motion windows (delayed starts and
  early arrivals).
- **Curved moves:** facing the direction of travel along a curve, keyboard
  access to bend handles, cubic or multi-point paths.
- **Output:** GIF export, a stand-alone HTML player file.
- **Storage:** Google Drive, any server-side storage (conflicts with the
  client-only constraint).
- **Longer term:** animated annotations, multiple clips per board,
  collaboration, narration, templates, substitutions and object lifecycles.

## Engineering gap

The two largest UI files are thinly tested:
`src/components/Pitch/TacticalBoard.tsx` has tests for arrow-key nudging only,
and `src/components/Sidebar/PropertiesPanel.tsx` has none. Pointer
interaction is untested because the Playwright suite planned in the animation
spec was deferred. Changes that touch these files should add tests as they
go.

## Order agreed so far

1. Arrow-key nudging was the first OpenSpec change (`add-arrow-key-nudge`)
   and is specified in `openspec/specs/keyboard-positioning/`.
2. Undecided. Easing and possession improve how animations look; the board
   library helps coaches who manage several drills. Choose once there is
   signal from coaches or from item 1.

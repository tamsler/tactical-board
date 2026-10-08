# Spec Delta

## Purpose

Defines how a move between two frames is paced over its duration: the easings
a coach or file author can choose, the positions they produce, how the choice
is stored in a document, and which document versions the app accepts.

## ADDED Requirements

### Requirement: Each move has an easing

Every frame SHALL have an easing for its outgoing move to the next frame,
either `linear` or `easeInOut`. A frame with no stored easing is `linear`. The
easing of the last frame is kept but has no effect, because the last frame has
no outgoing move.

#### Scenario: A frame without the setting
- **WHEN** a document's frame has no `easing` field
- **THEN** its outgoing move plays as `linear`

#### Scenario: Easing on the last frame
- **WHEN** the last frame of a document has `"easing": "easeInOut"`
- **THEN** the document is valid and plays the same as without it

### Requirement: Move progress follows the easing

During a move of duration `d` that started at `moveStart`, with
`u = clamp((time − moveStart) / d, 0, 1)`, every player and ball SHALL be at
progress `p` along its path, where `p = u` for `linear` and `p = 6u⁵ − 15u⁴ + 10u³`
for `easeInOut`. On a straight path the position is
`from + (to − from) × p`. The move's duration and the timeline do not change
with the easing.

#### Scenario: Linear move, a quarter of the way through
- **WHEN** a player moves from x = 100 to x = 500 in a 1,000 ms `linear` move and 250 ms have passed
- **THEN** the player is at x = 200

#### Scenario: Eased move, a quarter of the way through
- **WHEN** the same move is `easeInOut` and 250 ms have passed
- **THEN** the player is at x = 141.40625

#### Scenario: Eased move, halfway
- **WHEN** the same `easeInOut` move has run for 500 ms
- **THEN** the player is at x = 300

#### Scenario: Eased move, three quarters of the way through
- **WHEN** the same `easeInOut` move has run for 750 ms
- **THEN** the player is at x = 458.59375

#### Scenario: Total running time
- **WHEN** a frame's easing is changed from `linear` to `easeInOut`
- **THEN** the animation's total length and the start time of every frame are unchanged

### Requirement: Eased moves start and end on the stored poses

At the start of an eased move every player and ball SHALL be exactly at its
stored position in the source frame, and at the end exactly at its stored
position in the next frame, with no rounding difference. A player or ball
with the same position in both frames SHALL stay still throughout.

#### Scenario: End of an eased move
- **WHEN** an `easeInOut` move to a frame where the ball is at (640, 212) finishes
- **THEN** the ball is at exactly (640, 212)

#### Scenario: Entity that does not move
- **WHEN** a goalkeeper has the same position in two frames joined by an `easeInOut` move
- **THEN** the goalkeeper's position is that position at every moment of the move

### Requirement: One easing for everything in a move

The easing SHALL apply equally to every player and ball in the move, so they
all still start and arrive together. Properties that switch at the
destination frame (facing angle, vision cone, ball rotation) and annotations
SHALL keep switching at the end of the move, whatever the easing.

#### Scenario: Player and ball in the same eased move
- **WHEN** a player and a ball both move in a 1,000 ms `easeInOut` move and 250 ms have passed
- **THEN** each has covered 10.3515625% of its own path

### Requirement: Easing applies along curved paths

For a player or ball with a curved path, `p` SHALL be the fraction of the
curve's length travelled. With `linear` this is the existing constant-speed
movement along the curve.

#### Scenario: Eased curved run, a quarter of the way through
- **WHEN** a player's curved path is 200 pitch units long, the move is `easeInOut` and a quarter of its duration has passed
- **THEN** the player is 20.703125 units along the curve

#### Scenario: Eased curved run, halfway
- **WHEN** the same move is half over
- **THEN** the player is 100 units along the curve

### Requirement: The coach chooses the easing in the frame inspector

While a frame that has a next frame is selected for editing, the frame
inspector SHALL show a control labelled "Move pacing" next to "Move to next
frame (s)", with the options "Steady speed" (`linear`) and "Natural (speeds
up, then slows)" (`easeInOut`), showing the frame's current easing. Choosing an option
SHALL apply it to that frame's outgoing move only.

#### Scenario: Choose natural pacing for one move
- **WHEN** the coach selects Frame 2 of four and picks "Natural (speeds up, then slows)"
- **THEN** the move from Frame 2 to Frame 3 is `easeInOut` and the moves out of Frame 1 and Frame 3 are unchanged

#### Scenario: Last frame
- **WHEN** the last frame is selected
- **THEN** no "Move pacing" control is shown

#### Scenario: Reselecting a frame
- **WHEN** the coach sets Frame 1 to "Natural (speeds up, then slows)", selects Frame 2, then selects Frame 1 again
- **THEN** the control shows "Natural (speeds up, then slows)"

#### Scenario: Keyboard
- **WHEN** the "Move pacing" control has focus and the coach changes it with the keyboard
- **THEN** the easing changes as it does with a pointer, and no board item is nudged

### Requirement: Frame chips mark natural pacing

In the frame strip, the chip of a frame that has a next frame and is
`easeInOut` SHALL show a pacing marker next to its move duration, and the
chip's accessible name SHALL end with ", natural pacing". A `linear` frame
and the last frame SHALL show no marker and no such text.

#### Scenario: Eased frame
- **WHEN** Frame 2 of three is `easeInOut` with a 1.50 s move and no hold
- **THEN** its chip shows the marker beside "→ 1.50 s" and is announced as "Frame 2, hold 0.00 seconds, then move for 1.50 seconds, natural pacing"

#### Scenario: Steady frame
- **WHEN** a frame is `linear`
- **THEN** its chip looks and is announced exactly as it was before this change

#### Scenario: Eased frame moved to the end
- **WHEN** an `easeInOut` frame is reordered to become the last frame
- **THEN** its chip shows no marker

#### Scenario: Marker follows undo
- **WHEN** the coach sets a frame to "Natural (speeds up, then slows)" and then presses undo
- **THEN** the marker appears on that frame's chip and then disappears

### Requirement: Changing the easing is an undoable edit

Choosing a different easing SHALL be one undo step and SHALL be autosaved like
any other committed edit. Choosing the option that is already set SHALL NOT
add an undo step. The control SHALL NOT be available during playback or
preview.

#### Scenario: Undo
- **WHEN** the coach changes a frame from "Steady speed" to "Natural (speeds up, then slows)" and presses undo once
- **THEN** the frame is back to "Steady speed"

#### Scenario: Same value again
- **WHEN** the coach picks "Steady speed" on a frame that is already "Steady speed"
- **THEN** undo is no more available than it was before

### Requirement: New and existing frames default to steady speed

A frame created by starting an animation, by opening a board with no easing
stored, or by loading a legacy single-board file SHALL be `linear`. A frame
made with Add (duplicate) SHALL have the same easing as the frame it was
copied from, and the original SHALL keep its own.

#### Scenario: Board saved before this change
- **WHEN** a board saved by version 1.8.0 is opened
- **THEN** every move plays at steady speed, exactly as it did in 1.8.0

#### Scenario: Duplicate a frame with natural pacing
- **WHEN** the coach duplicates a frame set to "Natural (speeds up, then slows)"
- **THEN** both the original and the copy are "Natural (speeds up, then slows)"

### Requirement: Easing stays with its frame

A frame's easing SHALL stay with that frame when frames are reordered, when
another frame is deleted, and when its duration, hold, label or contents
change.

#### Scenario: Reorder
- **WHEN** Frame 1 is `easeInOut`, Frame 2 is `linear`, and the coach moves Frame 1 later so it becomes Frame 2
- **THEN** the frame now in second place is `easeInOut` and the frame now first is `linear`

#### Scenario: Change the duration
- **WHEN** the coach changes the move duration of an `easeInOut` frame from 1.00 s to 2.00 s
- **THEN** the frame is still `easeInOut`

### Requirement: Every output uses the same eased positions

Playback, scrubbing with the seek slider, image and PDF exports of a paused
pose, and video export SHALL all place players and balls at the positions
this spec defines for the sampled time.

#### Scenario: Scrub into an eased move
- **WHEN** the coach scrubs to 250 ms into a 1,000 ms `easeInOut` move in which a player goes from x = 100 to x = 500
- **THEN** the board shows the player at x = 141.40625

#### Scenario: Video export
- **WHEN** an animation with an `easeInOut` move is exported as video
- **THEN** the video frame for a given time shows the same positions as the board paused at that time

### Requirement: Documents store the easing in an optional frame field

A frame in a document MAY carry `easing` with the value `"linear"` or
`"easeInOut"`. Any other value SHALL make the document invalid, reported with
the path of the field. When the app writes a document (project file, local
storage or share link) it SHALL write `"easing": "easeInOut"` on frames with
that easing and SHALL omit the field on `linear` frames.

#### Scenario: Unknown easing value
- **WHEN** a document has `"easing": "easeOut"` on its second frame
- **THEN** it is rejected with an error naming `document.frames[1].easing`

#### Scenario: Wrong type
- **WHEN** a document has `"easing": true` on a frame
- **THEN** it is rejected

#### Scenario: Explicit linear
- **WHEN** a document with `"easing": "linear"` on a frame is opened and saved again
- **THEN** the saved file has no `easing` field on that frame and plays the same

#### Scenario: Round trip
- **WHEN** a board with one `easeInOut` frame is saved as a project file and opened again
- **THEN** that frame is `easeInOut` and the others are `linear`

#### Scenario: Share link
- **WHEN** a board with an `easeInOut` frame is shared by link and the link is opened
- **THEN** the opened board plays that move with `easeInOut`

### Requirement: The document schema is version 4

The app SHALL write `schemaVersion: 4` on every document it saves. It SHALL
open documents of versions 2, 3 and 4 from project files, local storage and
share links; versions 2 and 3 load with their frames, timing and curved paths
unchanged. It SHALL reject a document whose version is greater than 4 as
created by a newer version of the app, without overwriting it.

#### Scenario: Version 3 file
- **WHEN** a version 3 `.tacticalboard` file with curved paths is opened
- **THEN** it loads with the same curves and timing and every move is `linear`

#### Scenario: Version 2 file
- **WHEN** a version 2 file is opened
- **THEN** it loads with straight, `linear` moves

#### Scenario: Version 3 share link
- **WHEN** a share link created by version 1.8.0 for a board with curved paths is opened and confirmed
- **THEN** the board loads with the same frames, timing and curves, and every move is `linear`

#### Scenario: Version 2 share link
- **WHEN** a share link whose document has `schemaVersion` 2 is opened and confirmed
- **THEN** the board loads with straight, `linear` moves

#### Scenario: Version 3 board in local storage
- **WHEN** the app starts with a board autosaved by version 1.8.0 under `tactical_board_saved_state_v2`
- **THEN** the board is restored with the same frames, timing, curves and selected frame, and no recovery error is shown

#### Scenario: Legacy single-board file
- **WHEN** a legacy single-board `.json` file is opened
- **THEN** it loads as one `linear` frame, as before

#### Scenario: Saving after opening an older file
- **WHEN** a version 3 file is opened and saved without changes
- **THEN** the saved file has `schemaVersion` 4 and no `easing` fields

#### Scenario: Newer file
- **WHEN** a file with `schemaVersion` 5 is opened
- **THEN** it is rejected with a message that it was created by a newer version of the app

#### Scenario: Newer board in local storage
- **WHEN** local storage holds a document with `schemaVersion` 5
- **THEN** the app shows the recovery error and does not overwrite the stored board

### Requirement: The AI format reference covers easing

The format reference shipped to AI assistants SHALL describe the `easing`
field, its two values, its default and that it applies to every player and
ball in the move, and SHALL state schema version 4. At least one shipped
example drill SHALL use `"easing": "easeInOut"` and pass the board checker
with no warnings.

#### Scenario: Example drill is valid
- **WHEN** the example drill that uses `easing` is run through the board checker
- **THEN** it reports the drill as valid with no warnings

#### Scenario: Built prompt is current
- **WHEN** the AI prompt is rebuilt from the format reference
- **THEN** the published prompt mentions `easeInOut` and `"schemaVersion": 4`

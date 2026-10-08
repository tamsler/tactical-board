# Spec Delta

## ADDED Requirements

### Requirement: Changing a frame's pacing is reported

When a coach changes a frame's pacing with the "Move pacing" control, the app
SHALL send `frame_pacing_changed` with `easing` set to the new value,
`linear` or `easeInOut`, and `frames` set to the number of frames in the
animation. Choosing the value already set, undo, redo, and opening a board
that already contains eased frames SHALL send nothing.

#### Scenario: Switch to natural pacing
- **WHEN** a coach sets a frame of a 4-frame animation to "Natural (speeds up, then slows)"
- **THEN** one `frame_pacing_changed` event is sent with `easing` `easeInOut` and `frames` 4

#### Scenario: Switch back to steady
- **WHEN** the coach then sets that frame to "Steady speed"
- **THEN** one `frame_pacing_changed` event is sent with `easing` `linear` and `frames` 4

#### Scenario: Same value chosen
- **WHEN** a coach picks "Steady speed" on a frame that is already "Steady speed"
- **THEN** no `frame_pacing_changed` event is sent

#### Scenario: Undo and redo
- **WHEN** a coach changes a frame's pacing, presses undo and then redo
- **THEN** exactly one `frame_pacing_changed` event has been sent

#### Scenario: Opening an eased board
- **WHEN** a coach opens a file in which three frames are `easeInOut`
- **THEN** no `frame_pacing_changed` event is sent

#### Scenario: Frame label is not sent
- **WHEN** a coach changes the pacing of a frame labelled "Press their number 6"
- **THEN** the event contains neither that label nor the frame's position in the animation

# usage-analytics Specification

## Purpose
Defines the anonymous usage events the app sends to its analytics service,
the parameters each one carries, and the board content that is never sent.

## Requirements

### Requirement: Events carry no board content

Every usage event, including those specified in the baseline documents, SHALL
carry only whole-number counts, booleans, and values from a fixed list named
in its requirement. No event SHALL carry a board title, notes, a frame label,
a player name or number, a caption, a coordinate, pasted text, an error
message, a file name, or any part of a share link.

#### Scenario: Board with identifying text
- **WHEN** a board titled "U12 Lions v Rovers" with a player named "Amelia" and notes "Press their number 6" is shared, exported as video and reopened from a file
- **THEN** none of those strings, nor any part of them, appears in any event sent

#### Scenario: Invalid pasted text
- **WHEN** a coach pastes text that is not a valid document into Paste from AI and closes the dialog
- **THEN** no event contains the pasted text or the validation message shown to the coach

### Requirement: Features work without analytics

The app SHALL behave identically when the analytics service is unavailable or
blocked. A failure to send an event SHALL NOT show an error, delay the action,
or change its result.

#### Scenario: Analytics blocked
- **WHEN** a browser extension blocks the analytics script and a coach copies a share link
- **THEN** the link is copied and the usual confirmation is shown

### Requirement: Opening a board reports where it came from

When a board is opened from outside the app, the app SHALL send
`import_tactics` with `source` set to `file`, `share_link` or `ai_paste`,
`players` set to the number of players in the first frame, and `frames` set to
the number of frames. The event SHALL be sent only after the board has
replaced the current one.

#### Scenario: Project file
- **WHEN** a coach opens a `.tacticalboard` file with 3 frames and 14 players
- **THEN** one `import_tactics` event is sent with `source` `file`, `players` 14 and `frames` 3

#### Scenario: Legacy single-board file
- **WHEN** a coach opens a legacy `.json` board with 22 players
- **THEN** one `import_tactics` event is sent with `source` `file`, `players` 22 and `frames` 1

#### Scenario: Share link accepted
- **WHEN** a coach opens a share link and confirms
- **THEN** one `import_tactics` event is sent with `source` `share_link`

#### Scenario: Share link declined
- **WHEN** a coach opens a share link and cancels the confirmation
- **THEN** no `import_tactics` event is sent

#### Scenario: File rejected
- **WHEN** a coach opens a file that fails validation
- **THEN** no `import_tactics` event is sent

### Requirement: Paste from AI reports the warning count on success

When a board is opened through Paste from AI, the `import_tactics` event SHALL
also carry `warnings`, the number of advisory warnings shown for the pasted
document, with 0 when there were none.

#### Scenario: Clean document
- **WHEN** a coach pastes a valid document with no warnings and opens it
- **THEN** `import_tactics` is sent with `source` `ai_paste` and `warnings` 0

#### Scenario: Document with warnings opened anyway
- **WHEN** a coach pastes a valid document that shows 2 warnings and opens it
- **THEN** `import_tactics` is sent with `source` `ai_paste` and `warnings` 2

### Requirement: Copying a share link is reported

When a coach copies the link in the share dialog and the copy succeeds, the
app SHALL send `share_link_copied` with `frames` set to the number of frames
in the shared board. Opening the dialog without copying SHALL send nothing.

#### Scenario: Link copied
- **WHEN** a coach opens the share dialog for a 4-frame board and presses Copy
- **THEN** one `share_link_copied` event is sent with `frames` 4

#### Scenario: Dialog closed without copying
- **WHEN** a coach opens the share dialog and closes it
- **THEN** no `share_link_copied` event is sent

#### Scenario: Copy fails
- **WHEN** the browser refuses clipboard access when Copy is pressed
- **THEN** no `share_link_copied` event is sent

### Requirement: Opening Paste from AI is reported

Each time the Paste from AI dialog opens, the app SHALL send one
`ai_paste_opened` event with no parameters.

#### Scenario: Dialog opened from the header
- **WHEN** a coach presses Paste from AI
- **THEN** one `ai_paste_opened` event is sent

#### Scenario: Typing does not report
- **WHEN** a coach pastes text and edits it in the dialog
- **THEN** no further event is sent until the coach opens the board, copies feedback or closes the dialog

### Requirement: Copying feedback for the AI is reported

When a coach presses "Copy feedback for the AI" and the copy succeeds, the app
SHALL send `ai_paste_feedback_copied` with `result` set to `invalid` when the
pasted document was rejected or `warnings` when it was valid with warnings,
and `warnings` set to the number of warnings (0 for `invalid`).

#### Scenario: Feedback for a rejected document
- **WHEN** a coach pastes a document that fails validation and copies the feedback
- **THEN** `ai_paste_feedback_copied` is sent with `result` `invalid` and `warnings` 0

#### Scenario: Feedback for a document with warnings
- **WHEN** a coach pastes a valid document with 3 warnings and copies the feedback
- **THEN** `ai_paste_feedback_copied` is sent with `result` `warnings` and `warnings` 3

### Requirement: Leaving Paste from AI without a board is reported

When the Paste from AI dialog closes without a board being opened, the app
SHALL send `ai_paste_abandoned` with `result` describing the dialog's state at
that moment: `empty` when nothing was pasted, `invalid` when the pasted
document was rejected, `warnings` when it was valid with warnings, and `valid`
when it was valid with none. Closing after opening a board SHALL NOT send it.

#### Scenario: Closed with nothing pasted
- **WHEN** a coach opens the dialog and presses Escape
- **THEN** `ai_paste_abandoned` is sent with `result` `empty`

#### Scenario: Closed on a rejected document
- **WHEN** a coach pastes a document that fails validation and closes the dialog
- **THEN** `ai_paste_abandoned` is sent with `result` `invalid`

#### Scenario: Board opened
- **WHEN** a coach pastes a valid document and opens it
- **THEN** `import_tactics` is sent and `ai_paste_abandoned` is not

### Requirement: A failed video export is reported

When a video export ends in an error, the app SHALL send `video_export_failed`
with `format` set to `mp4` or `mov` and `reason` set to `unsupported` when the
browser cannot encode the video, or `error` for any other failure. A cancelled
export SHALL send nothing. A finished export continues to send `export` with
the format, as specified in the baseline.

#### Scenario: Browser cannot encode
- **WHEN** a coach starts an MP4 export in a browser without a video encoder
- **THEN** `video_export_failed` is sent with `format` `mp4` and `reason` `unsupported`

#### Scenario: Export cancelled
- **WHEN** a coach starts a video export and presses Cancel
- **THEN** neither `video_export_failed` nor `export` is sent

#### Scenario: Export finishes
- **WHEN** a MOV export completes and the file downloads
- **THEN** `export` is sent with `format` `mov` and `video_export_failed` is not
